import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");

    if (!REPLICATE_API_TOKEN) {
      console.error("REPLICATE_API_TOKEN is not configured");
      return new Response(
        JSON.stringify({ error: "TTS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit text length — Bark works best with shorter texts
    const cleanText = text.trim().substring(0, 1000);

    console.log("Bark TTS request via Replicate:", cleanText.substring(0, 60));

    // Create a prediction using Bark model on Replicate
    const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
        "Prefer": "wait",
      },
      body: JSON.stringify({
        version: "b76242b40d67c76ab6742e987628a2a9ac019e11d56ab96c4e91ce03b79b2787",
        input: {
          prompt: cleanText,
          text_temp: 0.7,
          waveform_temp: 0.7,
          history_prompt: "v2/ru_speaker_1",
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("Replicate API error:", createResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "TTS generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prediction = await createResponse.json();
    console.log("Replicate prediction status:", prediction.status);

    // If using Prefer: wait, the prediction should be completed
    // Otherwise we need to poll
    let result = prediction;

    if (result.status !== "succeeded") {
      // Poll for completion (max 60 seconds)
      const pollUrl = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`;
      const maxAttempts = 30;

      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const pollResponse = await fetch(pollUrl, {
          headers: {
            "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
          },
        });

        if (!pollResponse.ok) {
          console.error("Replicate poll error:", pollResponse.status);
          continue;
        }

        result = await pollResponse.json();
        console.log(`Poll attempt ${i + 1}: status=${result.status}`);

        if (result.status === "succeeded" || result.status === "failed" || result.status === "canceled") {
          break;
        }
      }
    }

    if (result.status !== "succeeded" || !result.output?.audio_out) {
      console.error("Bark generation failed:", result.status, result.error);
      return new Response(
        JSON.stringify({ error: "TTS generation failed or timed out" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the audio file from Replicate's output URL
    const audioUrl = result.output.audio_out;
    console.log("Bark audio URL:", audioUrl);

    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      console.error("Failed to fetch audio:", audioResponse.status);
      return new Response(
        JSON.stringify({ error: "Failed to download generated audio" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await audioResponse.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/wav",
      },
    });
  } catch (e) {
    console.error("Bark TTS error:", e);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
