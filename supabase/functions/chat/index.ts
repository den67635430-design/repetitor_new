import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Build system instruction based on user context
function getSystemInstruction(
  userType: string,
  subject: string,
  mode: string,
  classLevel?: number
): string {
  if (userType === "PRESCHOOLER") {
    return `Ты — дружелюбный AI-репетитор для дошкольника. 
    Тон: очень добрый, поддерживающий, частая похвала. 
    Стиль: короткие фразы, простые слова, игровые элементы. 
    Задания должны быть на 1-3 минуты. 
    Предмет: ${subject}.
    Отвечай ТОЛЬКО на русском языке.`;
  }

  return `Ты — Сократический репетитор. 
  НИКОГДА не давай готовый финальный ответ сразу. 
  Веди ученика через наводящие вопросы. 
  Давай подсказки уровня 1 (намек), 2 (более детально), 3 (почти ответ). 
  Проси ученика выполнить шаг, проверяй его и корректируй. 
  Ученик учится в ${classLevel || "школьном"} классе. 
  Предмет: ${subject}. Режим: ${mode}.
  Отвечай ТОЛЬКО на русском языке.
  Если тебе предоставлен дополнительный контекст из интернета, используй его для максимально точного и актуального ответа.`;
}

// Determine if the user's message needs web search for accuracy
function shouldSearchWeb(message: string): boolean {
  const searchTriggers = [
    "формула", "закон", "теорема", "определение", "правило",
    "дата", "год", "когда", "кто", "что такое", "как вычислить",
    "столица", "население", "расстояние", "автор", "произведение",
    "реакция", "элемент", "атом", "молекула", "клетка",
    "уравнение", "функция", "график",
    "актуальн", "современн", "последн", "новейш",
    "сколько", "какой", "где находится"
  ];
  const lowerMsg = message.toLowerCase();
  return searchTriggers.some((trigger) => lowerMsg.includes(trigger));
}

// Search the web via Firecrawl for relevant context
async function searchWebContext(query: string, subject: string): Promise<string> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    console.warn("FIRECRAWL_API_KEY not configured, skipping web search");
    return "";
  }

  try {
    const searchQuery = `${subject} ${query} учебник школа`;
    console.log("Searching web for:", searchQuery);

    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 3,
        lang: "ru",
        country: "ru",
        scrapeOptions: {
          formats: ["markdown"],
        },
      }),
    });

    if (!response.ok) {
      console.error("Firecrawl search failed:", response.status);
      return "";
    }

    const data = await response.json();
    console.log("Firecrawl search returned", data?.data?.length || 0, "results");

    if (!data?.data || data.data.length === 0) return "";

    // Extract relevant content snippets
    const snippets = data.data
      .slice(0, 3)
      .map((result: any) => {
        const title = result.title || "";
        const content = result.markdown
          ? result.markdown.substring(0, 800)
          : result.description || "";
        return `[${title}]\n${content}`;
      })
      .join("\n\n---\n\n");

    return snippets
      ? `\n\n[ДОПОЛНИТЕЛЬНЫЙ КОНТЕКСТ ИЗ ИНТЕРНЕТА — используй для точности ответа]:\n${snippets}`
      : "";
  } catch (error) {
    console.error("Web search error:", error);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userType, subject, mode, classLevel } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system instruction
    const systemInstruction = getSystemInstruction(
      userType || "SCHOOLER",
      subject || "Общий",
      mode || "explain",
      classLevel
    );

    // Get the latest user message
    const lastUserMessage = messages?.[messages.length - 1]?.content || "";

    // Search web if the question might benefit from it
    let webContext = "";
    if (shouldSearchWeb(lastUserMessage)) {
      console.log("Web search triggered for:", lastUserMessage.substring(0, 80));
      webContext = await searchWebContext(lastUserMessage, subject || "");
    }

    // Build the full system prompt with web context
    const fullSystemPrompt = systemInstruction + webContext;

    console.log("Calling Lovable AI Gateway, web context:", webContext ? "yes" : "no");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: fullSystemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Слишком много запросов. Подождите немного и попробуйте снова." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Необходимо пополнить баланс AI-кредитов." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Ошибка AI сервиса" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response from AI gateway");
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Неизвестная ошибка",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
