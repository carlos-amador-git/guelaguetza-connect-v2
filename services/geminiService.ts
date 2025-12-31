import { GoogleGenAI } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION } from "../constants";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    // In a real production app, this key should be proxied or handled securely.
    // Assuming process.env.API_KEY is available as per instructions.
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return client;
};

export const sendMessageToGemini = async (message: string, history: { role: string; parts: { text: string }[] }[] = []) => {
  try {
    const ai = getClient();
    const model = 'gemini-3-flash-preview'; 

    // Transform history to format expected by @google/genai if necessary, 
    // or use the Chat session feature. Here we use a fresh generateContent for simplicity
    // with system instructions, but for chat history, creating a chat session is better.
    
    // Using Chat Session for context
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: AI_SYSTEM_INSTRUCTION,
      },
      history: history.map(h => ({
        role: h.role,
        parts: h.parts
      })),
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Lo siento, tengo problemas de conexión con los espíritus zapotecos en este momento. Intenta de nuevo más tarde.";
  }
};
