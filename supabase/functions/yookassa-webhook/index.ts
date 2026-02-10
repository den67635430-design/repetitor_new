import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// YooKassa official notification IP ranges
const YOOKASSA_IP_RANGES = [
  { start: "185.71.76.0", end: "185.71.76.31" },   // 185.71.76.0/27
  { start: "185.71.77.0", end: "185.71.77.31" },   // 185.71.77.0/27
  { start: "77.75.153.0", end: "77.75.153.31" },    // 77.75.153.0/27
  { start: "77.75.156.11", end: "77.75.156.11" },
  { start: "77.75.156.35", end: "77.75.156.35" },
];

function ipToNum(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

function isYooKassaIP(ip: string): boolean {
  const num = ipToNum(ip);
  return YOOKASSA_IP_RANGES.some(
    (range) => num >= ipToNum(range.start) && num <= ipToNum(range.end)
  );
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_PLANS = ["preschool", "basic", "standard", "premium"];
const VALID_BILLING_PERIODS = ["monthly", "quarterly"];

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify source IP
  const clientIP =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "";

  if (clientIP && !isYooKassaIP(clientIP)) {
    console.error(`Rejected webhook from unauthorized IP: ${clientIP}`);
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const body = await req.json();
    const event = body.event;
    const paymentData = body.object;

    if (!paymentData?.id || !paymentData?.metadata) {
      return new Response("OK", { status: 200 });
    }

    // Verify payment with YooKassa API (fetch-before-process pattern)
    const shopId = Deno.env.get("YOOKASSA_SHOP_ID") ?? "";
    const secretKey = Deno.env.get("YOOKASSA_SECRET_KEY") ?? "";

    if (shopId && secretKey) {
      const verifyUrl = event?.startsWith("refund.")
        ? `https://api.yookassa.ru/v3/refunds/${paymentData.id}`
        : `https://api.yookassa.ru/v3/payments/${paymentData.id}`;

      const verifyRes = await fetch(verifyUrl, {
        headers: {
          "Authorization": `Basic ${btoa(`${shopId}:${secretKey}`)}`,
        },
      });

      if (!verifyRes.ok) {
        console.error(`YooKassa verification failed: ${verifyRes.status}`);
        await verifyRes.text();
        return new Response("Forbidden", { status: 403 });
      }

      const verified = await verifyRes.json();
      if (verified.status !== paymentData.status) {
        console.error(`Status mismatch: webhook=${paymentData.status}, API=${verified.status}`);
        return new Response("Forbidden", { status: 403 });
      }
    } else {
      console.error("Missing YooKassa credentials for verification");
      return new Response("Internal error", { status: 500 });
    }

    // Validate metadata fields
    const { payment_id, user_id, plan_id, billing_period } = paymentData.metadata || {};

    if (!payment_id || !user_id || !plan_id || !billing_period) {
      console.error("Missing required metadata fields");
      return new Response("OK", { status: 200 });
    }

    if (!UUID_REGEX.test(user_id) || !UUID_REGEX.test(payment_id)) {
      console.error("Invalid UUID format in metadata");
      return new Response("OK", { status: 200 });
    }

    if (!VALID_PLANS.includes(plan_id)) {
      console.error("Invalid plan_id in metadata");
      return new Response("OK", { status: 200 });
    }

    if (!VALID_BILLING_PERIODS.includes(billing_period)) {
      console.error("Invalid billing_period in metadata");
      return new Response("OK", { status: 200 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    if (event === "payment.succeeded") {
      await adminClient
        .from("payments")
        .update({ status: "succeeded" })
        .eq("id", payment_id);

      const now = new Date();
      const months = billing_period === "quarterly" ? 3 : 1;
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + months);

      await adminClient
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("user_id", user_id)
        .eq("status", "active");

      const { data: sub } = await adminClient
        .from("subscriptions")
        .insert({
          user_id,
          plan_id,
          billing_period,
          status: "active",
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select("id")
        .single();

      if (sub) {
        await adminClient
          .from("payments")
          .update({ subscription_id: sub.id })
          .eq("id", payment_id);
      }

      console.log(`Payment ${payment_id} succeeded. Subscription created for user ${user_id}`);
    } else if (event === "payment.canceled") {
      await adminClient
        .from("payments")
        .update({ status: "cancelled" })
        .eq("id", payment_id);

      console.log(`Payment ${payment_id} cancelled`);
    } else if (event === "refund.succeeded") {
      const { data: paymentRecord } = await adminClient
        .from("payments")
        .select("id, subscription_id")
        .eq("yookassa_payment_id", paymentData.payment_id)
        .single();

      if (paymentRecord) {
        await adminClient
          .from("payments")
          .update({ status: "refunded" })
          .eq("id", paymentRecord.id);

        if (paymentRecord.subscription_id) {
          await adminClient
            .from("subscriptions")
            .update({ status: "cancelled" })
            .eq("id", paymentRecord.subscription_id);
        }
      }

      console.log(`Refund processed for payment ${paymentData.payment_id}`);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("OK", { status: 200 });
  }
});
