import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const YOOKASSA_API = "https://api.yookassa.ru/v3/payments";

const PLAN_PRICES: Record<string, { monthly: number; quarterly: number }> = {
  preschool: { monthly: 1490, quarterly: 2970 },
  basic: { monthly: 1490, quarterly: 2970 },
  standard: { monthly: 1990, quarterly: 3990 },
  premium: { monthly: 2990, quarterly: 5970 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { planId, billingPeriod } = await req.json();

    // Validate
    if (!planId || !PLAN_PRICES[planId]) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["monthly", "quarterly"].includes(billingPeriod)) {
      return new Response(JSON.stringify({ error: "Invalid billing period" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amount = PLAN_PRICES[planId][billingPeriod as "monthly" | "quarterly"];

    // Create payment record in DB
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: payment, error: dbError } = await adminClient
      .from("payments")
      .insert({
        user_id: user.id,
        amount,
        plan_id: planId,
        billing_period: billingPeriod,
        status: "pending",
      })
      .select("id")
      .single();

    if (dbError || !payment) {
      console.error("DB error:", dbError);
      return new Response(JSON.stringify({ error: "Failed to create payment record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create YooKassa payment
    const shopId = Deno.env.get("YOOKASSA_SHOP_ID") ?? "";
    const secretKey = Deno.env.get("YOOKASSA_SECRET_KEY") ?? "";
    const idempotenceKey = payment.id;

    const returnUrl = Deno.env.get("SUPABASE_URL")
      ? `${req.headers.get("origin") || "https://repetitor-pod-rukoy.lovable.app"}/`
      : "https://repetitor-pod-rukoy.lovable.app/";

    const planNames: Record<string, string> = {
      preschool: "Дошкольники",
      basic: "Базовый",
      standard: "Стандарт",
      premium: "Премиум",
    };
    const periodNames: Record<string, string> = {
      monthly: "1 месяц",
      quarterly: "3 месяца",
    };

    const yooResponse = await fetch(YOOKASSA_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        Authorization: "Basic " + btoa(`${shopId}:${secretKey}`),
      },
      body: JSON.stringify({
        amount: {
          value: amount.toFixed(2),
          currency: "RUB",
        },
        confirmation: {
          type: "redirect",
          return_url: returnUrl,
        },
        capture: true,
        description: `Тариф "${planNames[planId]}" — ${periodNames[billingPeriod]}`,
        metadata: {
          payment_id: payment.id,
          user_id: user.id,
          plan_id: planId,
          billing_period: billingPeriod,
        },
      }),
    });

    if (!yooResponse.ok) {
      const errBody = await yooResponse.text();
      console.error("YooKassa error:", yooResponse.status, errBody);
      return new Response(JSON.stringify({ error: "Payment service error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const yooData = await yooResponse.json();

    // Save YooKassa payment ID
    await adminClient
      .from("payments")
      .update({ yookassa_payment_id: yooData.id })
      .eq("id", payment.id);

    return new Response(
      JSON.stringify({
        confirmationUrl: yooData.confirmation.confirmation_url,
        paymentId: payment.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Create payment error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
