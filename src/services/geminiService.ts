
import { GoogleGenAI } from "@google/genai";
import { UserType, LearningMode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getSystemInstruction = (
  userType: UserType, 
  subject: string, 
  mode: string, 
  classLevel?: number
) => {
  if (userType === UserType.PRESCHOOLER) {
    return `Ты — дружелюбный AI-репетитор для дошкольника. 
    Тон: очень добрый, поддерживающий, частая похвала. 
    Стиль: короткие фразы, простые слова, игровые элементы. 
    Задания должны быть на 1-3 минуты. 
    Предмет: ${subject}.`;
  }

  const socraticBase = `Ты — Сократический репетитор. 
  НИКОГДА не давай готовый финальный ответ сразу. 
  Веди ученика через наводящие вопросы. 
  Давай подсказки уровня 1 (намек), 2 (более детально), 3 (почти ответ). 
  Проси ученика выполнить шаг, проверяй его и корректируй. 
  Ученик учится в ${classLevel || 'школьном'} классе. 
  Предмет: ${subject}. Режим: ${mode}.`;

  return socraticBase;
};

export async function* sendMessageStream(
  message: string, 
  systemInstruction: string,
  history: { role: 'user' | 'model', parts: { text: string }[] }[] = []
) {
  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    for await (const chunk of response) {
      yield chunk.text || "";
    }
  } catch (error) {
    console.error("Gemini stream error:", error);
    yield "Извините, произошла ошибка при связи с AI. Попробуйте еще раз позже.";
  }
}
