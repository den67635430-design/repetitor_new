import { UserType } from "../types";
import { supabase } from "../integrations/supabase/client";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

type Message = { role: "user" | "assistant"; content: string; imageUrl?: string };

interface StreamChatParams {
  messages: Message[];
  userType: string;
  subject: string;
  mode: string;
  classLevel?: number;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return session.access_token;
  }
  // Fallback to anon key if no session (should not happen with proper auth)
  return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
}

export async function streamChat({
  messages,
  userType,
  subject,
  mode,
  classLevel,
  onDelta,
  onDone,
  onError,
}: StreamChatParams) {
  try {
    const token = await getAuthToken();
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages, userType, subject, mode, classLevel }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({ error: "Ошибка сервера" }));
      
      if (resp.status === 429) {
        onError("Слишком много запросов. Подождите немного и попробуйте снова.");
        return;
      }
      if (resp.status === 402) {
        onError("Необходимо пополнить баланс AI-кредитов.");
        return;
      }
      
      onError(errorData.error || "Произошла ошибка");
      return;
    }

    if (!resp.body) {
      onError("Пустой ответ от сервера");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final buffer flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch { /* ignore partial leftovers */ }
      }
    }

    onDone();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Stream chat error:", error);
    }
    onError("Ошибка подключения. Проверьте интернет и попробуйте снова.");
  }
}
