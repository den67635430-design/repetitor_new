import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Webhook only accepts POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const event = body.event;
    const paymentData = body.object;

    if (!paymentData?.id || !paymentData?.metadata) {
      return new Response("OK", { status: 200 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { payment_id, user_id, plan_id, billing_period } = paymentData.metadata;

    if (event === "payment.succeeded") {
      // Update payment status
      await adminClient
        .from("payments")
        .update({ status: "succeeded" })
        .eq("id", payment_id);

      // Calculate subscription period
      const now = new Date();
      const months = billing_period === "quarterly" ? 3 : 1;
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + months);

      // Expire any existing active subscriptions for this user
      await adminClient
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("user_id", user_id)
        .eq("status", "active");

      // Create new subscription
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

      // Link payment to subscription
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
      // Find the payment by yookassa_payment_id
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
    // Return 200 to prevent YooKassa from retrying
    return new Response("OK", { status: 200 });
  }
});
