import { GoogleGenAI } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION } from "../constants";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    // TODO: This key should be proxied through the backend, not used directly in the client.
    // For now, read from VITE_GEMINI_API_KEY in .env (only set in local dev, never committed).
    // Do NOT use process.env here — that requires a vite `define` entry which embeds secrets
    // into the bundle at build time.
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY is not set. Configure a backend proxy for production.');
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
};

export const sendMessageToGemini = async (message: string, history: { role: string; parts: { text: string }[] }[] = []) => {
  try {
    const ai = getClient();
    const model = 'gemini-2.0-flash';

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
