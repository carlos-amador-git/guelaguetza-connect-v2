import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';
import { SendMessageInput, ConversationPaginationInput } from '../schemas/chat.schema.js';
import { NotFoundError } from '../utils/errors.js';

const AI_SYSTEM_INSTRUCTION = `
You are "GuelaBot", an expert cultural guide for the Guelaguetza festival in Oaxaca, Mexico.
Your tone is festive, welcoming, and helpful.
You provide information about:
1. Transport (BinniBus routes like RC01, RC02).
2. Cultural history of the dances (Flor de Piña, Danza de la Pluma).
3. Schedule of events.
Keep answers concise (under 80 words) as you are a chat assistant on a mobile app.
If asked about tickets, refer them to the official Ticketmaster page or physical booths.
IMPORTANT: You must only answer in Spanish.
`;

export class ChatService {
  private genai: GoogleGenAI | null = null;

  constructor(private prisma: PrismaClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genai = new GoogleGenAI({ apiKey });
    }
  }

  async sendMessage(userId: string, data: SendMessageInput) {
    let conversation;

    if (data.conversationId) {
      conversation = await this.prisma.conversation.findUnique({
        where: { id: data.conversationId, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) {
        throw new NotFoundError('Conversación no encontrada');
      }
    } else {
      conversation = await this.prisma.conversation.create({
        data: { userId },
        include: { messages: true },
      });
    }

    // Save user message
    const userMessage = await this.prisma.message.create({
      data: {
        role: 'user',
        text: data.message,
        conversationId: conversation.id,
      },
    });

    // Get bot response
    let botResponseText: string;

    if (this.genai) {
      try {
        const history = conversation.messages.map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        }));

        const chat = this.genai.chats.create({
          model: 'gemini-2.0-flash',
          config: {
            systemInstruction: AI_SYSTEM_INSTRUCTION,
          },
          history,
        });

        const result = await chat.sendMessage({ message: data.message });
        botResponseText = result.text || 'Lo siento, no pude procesar tu mensaje.';
      } catch (error) {
        console.error('Gemini API error:', error);
        botResponseText = 'Lo siento, tengo problemas de conexión. Intenta de nuevo más tarde.';
      }
    } else {
      // Fallback responses when no API key
      botResponseText = this.getFallbackResponse(data.message);
    }

    // Save bot message
    const botMessage = await this.prisma.message.create({
      data: {
        role: 'model',
        text: botResponseText,
        conversationId: conversation.id,
      },
    });

    // Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId: conversation.id,
      userMessage: {
        id: userMessage.id,
        text: userMessage.text,
        timestamp: userMessage.createdAt,
      },
      botResponse: {
        id: botMessage.id,
        text: botMessage.text,
        timestamp: botMessage.createdAt,
      },
    };
  }

  async listConversations(userId: string, params: ConversationPaginationInput) {
    const { limit, offset } = params;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { userId },
        skip: offset,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
      this.prisma.conversation.count({ where: { userId } }),
    ]);

    return {
      conversations: conversations.map((c) => ({
        id: c.id,
        startedAt: c.createdAt,
        lastMessage: c.messages[0]
          ? {
              text: c.messages[0].text,
              role: c.messages[0].role,
              timestamp: c.messages[0].createdAt,
            }
          : null,
        messageCount: c._count.messages,
      })),
      total,
    };
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError('Conversación no encontrada');
    }

    return {
      id: conversation.id,
      createdAt: conversation.createdAt,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        text: m.text,
        timestamp: m.createdAt,
      })),
    };
  }

  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundError('Conversación no encontrada');
    }

    await this.prisma.conversation.delete({ where: { id: conversationId } });
    return { success: true };
  }

  private getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('ruta') || lowerMessage.includes('bus') || lowerMessage.includes('transporte')) {
      return 'Las rutas especiales de Guelaguetza incluyen RC01 (Auditorio) y RC02 (Feria del Mezcal). Salen cada 10-15 minutos desde el centro.';
    }

    if (lowerMessage.includes('danza') || lowerMessage.includes('baile') || lowerMessage.includes('pluma')) {
      return 'La Danza de la Pluma representa la conquista de México. Los danzantes usan penachos elaborados que pueden pesar hasta 25 kg.';
    }

    if (lowerMessage.includes('boleto') || lowerMessage.includes('ticket') || lowerMessage.includes('entrada')) {
      return 'Los boletos se pueden comprar en Ticketmaster o en las taquillas del Auditorio Guelaguetza. Te recomiendo comprar con anticipación.';
    }

    if (lowerMessage.includes('mezcal') || lowerMessage.includes('feria')) {
      return 'La Feria del Mezcal se encuentra en el Centro de Convenciones (CCCO). Puedes degustar mezcales artesanales de diferentes regiones de Oaxaca.';
    }

    return '¡Hola! Soy GuelaBot. Puedo ayudarte con información sobre transporte, danzas tradicionales, horarios de eventos y más. ¿Qué te gustaría saber?';
  }
}
