import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Rate Limiting ──────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(userId);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 }); // 1 min window
    return true;
  }

  if (limit.count >= 15) {
    return false;
  }

  limit.count++;
  return true;
}

// ── Input Validation ───────────────────────────────────────────────────
const VALID_USER_TYPES = ["PRESCHOOLER", "SCHOOLER"];
const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES = 50;
const MAX_SUBJECT_LENGTH = 100;
const MAX_MODE_LENGTH = 50;

function sanitizeString(text: string, maxLength: number): string {
  return text
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .substring(0, maxLength);
}

interface ValidatedInput {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  userType: string;
  subject: string;
  mode: string;
  classLevel?: number;
}

function validateInput(body: unknown): ValidatedInput | string {
  if (!body || typeof body !== "object") {
    return "Invalid request body";
  }

  const { messages, userType, subject, mode, classLevel } = body as Record<string, unknown>;

  // Validate messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return "Messages must be a non-empty array";
  }
  if (messages.length > MAX_MESSAGES) {
    return `Too many messages (max ${MAX_MESSAGES})`;
  }

  const validatedMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const msg of messages) {
    if (!msg || typeof msg !== "object") return "Invalid message format";
    const { role, content } = msg as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return "Invalid message role";
    if (typeof content !== "string" || content.trim().length === 0) return "Message content must be a non-empty string";
    validatedMessages.push({
      role: role as "user" | "assistant",
      content: sanitizeString(content, MAX_MESSAGE_LENGTH),
    });
  }

  // Validate userType
  const validUserType = typeof userType === "string" && VALID_USER_TYPES.includes(userType)
    ? userType
    : "SCHOOLER";

  // Validate subject
  const validSubject = typeof subject === "string"
    ? sanitizeString(subject, MAX_SUBJECT_LENGTH)
    : "Общий";
  if (validSubject.length === 0) return "Subject cannot be empty";

  // Validate mode
  const validMode = typeof mode === "string"
    ? sanitizeString(mode, MAX_MODE_LENGTH)
    : "explain";

  // Validate classLevel
  let validClassLevel: number | undefined;
  if (classLevel !== undefined && classLevel !== null) {
    const level = Number(classLevel);
    if (!Number.isInteger(level) || level < 1 || level > 11) {
      return "Class level must be an integer between 1 and 11";
    }
    validClassLevel = level;
  }

  return {
    messages: validatedMessages,
    userType: validUserType,
    subject: validSubject,
    mode: validMode,
    classLevel: validClassLevel,
  };
}

// ── System Instruction Builder ─────────────────────────────────────────
function getSystemInstruction(
  userType: string,
  subject: string,
  mode: string,
  classLevel?: number
): string {
  const mathFormatRule = `
    КРИТИЧЕСКИ ВАЖНО — ФОРМАТИРОВАНИЕ МАТЕМАТИКИ:
    НИКОГДА не используй LaTeX, TeX или любую разметку с символами $ \\ \\frac \\cdot \\times \\sqrt и т.д.
    Пиши математические выражения ТОЛЬКО простым текстом, как в школьной тетради:
    - Дроби пиши как: 1/2, 3/4, a/b
    - Умножение пиши как: · или × или просто "умножить на"
    - Степени пиши как: x² или x^2 или "x в квадрате"
    - Корни пиши как: √9 или "корень из 9"
    - Индексы пиши как: a₁ или a1
    НИКОГДА не оборачивай формулы в знаки доллара ($). Ни одного символа $.
    НИКОГДА не используй двойные звёздочки (**) для выделения. Используй простой текст.
    Всё должно читаться как обычный текст без специальной разметки.`;

  // Support mode — clean help assistant with escalation
  if (subject === "Support") {
    return `Ты — дружелюбный ИИ-ассистент службы поддержки приложения "Репетитор под рукой".
    Помогай пользователям с вопросами по использованию приложения, подписке, навигации и техническими проблемами.
    Отвечай коротко, ясно и по делу. Обращайся к пользователю по имени, если знаешь его.
    
    ВАЖНО — ЭСКАЛАЦИЯ:
    Если ты НЕ МОЖЕШЬ решить проблему пользователя (например: баг в приложении, проблемы с оплатой, технические сбои, запросы на возврат средств, проблемы с аккаунтом), то:
    1. Вежливо объясни, что передашь вопрос специалисту
    2. Попроси пользователя указать его username в Telegram, чтобы специалист мог с ним связаться
    3. Когда пользователь укажет свой Telegram username, ответь РОВНО в таком формате (это обязательный маркер для системы):
       "Я передал вашу проблему нашему специалисту. Он свяжется с вами в Telegram в ближайшее время! [ESCALATE: telegram=@username, problem=краткое описание проблемы]"
    
    НИКОГДА не выдумывай ответы на вопросы, которые ты не знаешь. Лучше эскалируй.
    Отвечай ТОЛЬКО на русском языке.`;
  }

  if (userType === "PRESCHOOLER") {
    return `Ты — дружелюбный AI-репетитор для дошкольника (3-6 лет).
    Тон: очень добрый, поддерживающий, частая похвала. Обращайся на "ты".
    Стиль: короткие фразы, простые слова, игровые элементы, эмодзи.
    Задания должны быть на 1-3 минуты.
    НИКОГДА не используй сложные термины. Объясняй всё через примеры из жизни ребёнка.
    ${mathFormatRule}
    Предмет: ${subject}.
    Отвечай ТОЛЬКО на русском языке.`;
  }

  // Adapt communication style based on class level
  let styleGuide = "";
  if (classLevel && classLevel <= 4) {
    styleGuide = `Ученик — младший школьник (${classLevel} класс, 7-10 лет).
    Обращайся на "ты", дружелюбно, но уважительно. Используй простой язык.
    Объясняй через конкретные примеры. Хвали за правильные шаги.
    НЕ называй ученика "малыш", "малышка" — он уже школьник.`;
  } else if (classLevel && classLevel <= 8) {
    styleGuide = `Ученик — средняя школа (${classLevel} класс, 11-14 лет).
    Обращайся на "ты", по-дружески, но как со взрослеющим человеком.
    Можно использовать более сложную лексику. Поощряй самостоятельное мышление.
    Давай больше контекста и связей между темами.`;
  } else {
    styleGuide = `Ученик — старшеклассник (${classLevel || "9-11"} класс, 15-17 лет).
    Обращайся на "ты", уважительно, как с молодым взрослым.
    Используй академический язык, но объясняй доступно.
    Связывай материал с экзаменами (ОГЭ/ЕГЭ) и реальной жизнью.
    Поощряй критическое мышление и аналитический подход.`;
  }

  // VPR-specific instruction
  let vprInstruction = "";
  if (subject.toLowerCase().includes('впр') || subject.toLowerCase().includes('vpr')) {
    vprInstruction = `
    СПЕЦИАЛЬНЫЕ ИНСТРУКЦИИ ПО ВПР (Всероссийские проверочные работы):
    ВПР проводятся для учеников 4-8 и 10 классов.
    Основные предметы ВПР: русский язык, математика, окружающий мир (4 класс), история, биология, география, обществознание, физика, химия, иностранные языки.
    При подготовке к ВПР:
    - Объясняй типичные задания ВПР и их структуру
    - Давай примеры заданий, аналогичные реальным ВПР
    - Обращай внимание на критерии оценивания
    - Разбирай частые ошибки учеников
    - Давай советы по распределению времени на экзамене
    - Используй актуальные демоверсии и кодификаторы ФИОКО
    Если ученик спрашивает по конкретному предмету — фокусируйся на нём.
    Если вопрос общий — дай обзор структуры ВПР и помоги выбрать предмет для подготовки.`;
  }

  return `Ты — Сократический репетитор.
  ${styleGuide}
  ${vprInstruction}
  НИКОГДА не давай готовый финальный ответ сразу.
  Веди ученика через наводящие вопросы.
  Давай подсказки уровня 1 (намек), 2 (более детально), 3 (почти ответ).
  Проси ученика выполнить шаг, проверяй его и корректируй.
  ${mathFormatRule}
  Предмет: ${subject}. Режим: ${mode}.
  Отвечай ТОЛЬКО на русском языке.
  Если тебе предоставлен дополнительный контекст из интернета, используй его для максимально точного и актуального ответа.`;
}

// ── Web Content Sanitization ──────────────────────────────────────────
function sanitizeWebContent(text: string): string {
  return text
    // Remove script tags and their content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    // Remove style tags and their content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    // Remove all HTML tags
    .replace(/<[^>]+>/g, "")
    // Remove javascript: URLs
    .replace(/javascript:/gi, "")
    // Remove data: URLs
    .replace(/data:[^\s]+/gi, "")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

// ── Web Search ─────────────────────────────────────────────────────────
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

async function searchWebContext(query: string, subject: string): Promise<string> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    console.warn("FIRECRAWL_API_KEY not configured, skipping web search");
    return "";
  }

  try {
    const sanitizedQuery = sanitizeString(query, 200);
    const sanitizedSubject = sanitizeString(subject, 100);
    const searchQuery = `${sanitizedSubject} ${sanitizedQuery} учебник школа`;
    console.log("Searching web for:", searchQuery.substring(0, 80));

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

    const snippets = data.data
      .slice(0, 3)
      .map((result: any) => {
        const title = sanitizeWebContent(result.title || "");
        const rawContent = result.markdown
          ? result.markdown.substring(0, 800)
          : result.description || "";
        const content = sanitizeWebContent(rawContent);
        if (!title && !content) return null;
        return `[${title}]\n${content}`;
      })
      .filter(Boolean)
      .join("\n\n---\n\n");

    return snippets
      ? `\n\n[ДОПОЛНИТЕЛЬНЫЙ КОНТЕКСТ ИЗ ИНТЕРНЕТА — используй для точности ответа]:\n${snippets}`
      : "";
  } catch (error) {
    console.error("Web search error:", error);
    return "";
  }
}

// ── Main Handler ───────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Authentication ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Необходима авторизация" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Недействительный токен авторизации" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // ── Rate Limiting ───────────────────────────────────────────────
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: "Слишком много запросов. Подождите немного и попробуйте снова." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Input Validation ────────────────────────────────────────────
    const body = await req.json();
    const validated = validateInput(body);

    if (typeof validated === "string") {
      return new Response(
        JSON.stringify({ error: validated }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, userType, subject, mode, classLevel } = validated;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Сервис временно недоступен" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build system instruction
    const systemInstruction = getSystemInstruction(userType, subject, mode, classLevel);

    // Get the latest user message
    const lastUserMessage = messages[messages.length - 1]?.content || "";

    // Search web if the question might benefit from it
    let webContext = "";
    if (shouldSearchWeb(lastUserMessage)) {
      console.log("Web search triggered for user:", userId);
      webContext = await searchWebContext(lastUserMessage, subject);
    }

    const fullSystemPrompt = systemInstruction + webContext;

    console.log("Calling AI Gateway for user:", userId, "web context:", webContext ? "yes" : "no");

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
          JSON.stringify({ error: "Сервис временно недоступен." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Сервис временно недоступен" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response for user:", userId);
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat function error:", e);
    return new Response(
      JSON.stringify({ error: "Сервис временно недоступен" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
