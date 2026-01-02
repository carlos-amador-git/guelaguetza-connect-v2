import { PrismaClient, DirectMessage, DirectConversation } from '@prisma/client';
import { WebSocket } from 'ws';
import { NotificationService } from './notification.service.js';

interface PaginationInput {
  page: number;
  limit: number;
}

interface ConversationResponse {
  id: string;
  lastMessageAt: Date | null;
  createdAt: Date;
  otherParticipant: {
    id: string;
    nombre: string;
    apellido: string | null;
    avatar: string | null;
  };
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: Date;
  } | null;
  unreadCount: number;
}

interface DirectMessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: Date;
  sender: {
    id: string;
    nombre: string;
    apellido: string | null;
    avatar: string | null;
  };
}

// Store active WebSocket connections for DM
const dmConnections = new Map<string, WebSocket>();

export class DMService {
  constructor(
    private prisma: PrismaClient,
    private notificationService?: NotificationService
  ) {}

  // Register WebSocket connection for DM
  registerConnection(userId: string, ws: WebSocket): void {
    const existing = dmConnections.get(userId);
    if (existing && existing.readyState === WebSocket.OPEN) {
      existing.close();
    }
    dmConnections.set(userId, ws);
  }

  // Unregister WebSocket connection
  unregisterConnection(userId: string): void {
    dmConnections.delete(userId);
  }

  // Send message via WebSocket
  sendRealtime(userId: string, message: DirectMessageResponse): void {
    const ws = dmConnections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'message',
        data: message,
      }));
    }
  }

  // Get or create conversation between two users
  async getOrCreateConversation(userId: string, participantId: string): Promise<DirectConversation> {
    // Check if conversation exists (in either direction)
    let conversation = await this.prisma.directConversation.findFirst({
      where: {
        OR: [
          { participant1Id: userId, participant2Id: participantId },
          { participant1Id: participantId, participant2Id: userId },
        ],
      },
    });

    if (!conversation) {
      // Create new conversation (always store with lower ID first for consistency)
      const [p1, p2] = userId < participantId
        ? [userId, participantId]
        : [participantId, userId];

      conversation = await this.prisma.directConversation.create({
        data: {
          participant1Id: p1,
          participant2Id: p2,
        },
      });
    }

    return conversation;
  }

  // Get user's conversations
  async getConversations(
    userId: string,
    pagination: PaginationInput
  ): Promise<{ conversations: ConversationResponse[]; total: number }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.prisma.directConversation.findMany({
        where: {
          OR: [
            { participant1Id: userId },
            { participant2Id: userId },
          ],
        },
        include: {
          participant1: {
            select: { id: true, nombre: true, apellido: true, avatar: true },
          },
          participant2: {
            select: { id: true, nombre: true, apellido: true, avatar: true },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        skip,
        take: limit,
      }),
      this.prisma.directConversation.count({
        where: {
          OR: [
            { participant1Id: userId },
            { participant2Id: userId },
          ],
        },
      }),
    ]);

    // Get unread counts for each conversation
    const unreadCounts = await Promise.all(
      conversations.map((conv) =>
        this.prisma.directMessage.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            read: false,
          },
        })
      )
    );

    return {
      conversations: conversations.map((conv, index) => ({
        id: conv.id,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
        otherParticipant:
          conv.participant1Id === userId ? conv.participant2 : conv.participant1,
        lastMessage: conv.messages[0]
          ? {
              content: conv.messages[0].content,
              senderId: conv.messages[0].senderId,
              createdAt: conv.messages[0].createdAt,
            }
          : null,
        unreadCount: unreadCounts[index],
      })),
      total,
    };
  }

  // Get messages for a conversation
  async getMessages(
    userId: string,
    conversationId: string,
    pagination: PaginationInput
  ): Promise<{ messages: DirectMessageResponse[]; hasMore: boolean }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Verify user is participant
    const conversation = await this.prisma.directConversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
    });

    if (!conversation) {
      throw new Error('Conversación no encontrada');
    }

    const [messages, total] = await Promise.all([
      this.prisma.directMessage.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: { id: true, nombre: true, apellido: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit + 1, // Get one extra to check hasMore
      }),
      this.prisma.directMessage.count({ where: { conversationId } }),
    ]);

    const hasMore = messages.length > limit;
    const messagesResult = hasMore ? messages.slice(0, limit) : messages;

    return {
      messages: messagesResult.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        content: m.content,
        read: m.read,
        createdAt: m.createdAt,
        sender: m.sender,
      })),
      hasMore,
    };
  }

  // Send a message
  async sendMessage(
    userId: string,
    conversationId: string,
    content: string
  ): Promise<DirectMessageResponse> {
    // Verify user is participant and get other participant
    const conversation = await this.prisma.directConversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
    });

    if (!conversation) {
      throw new Error('Conversación no encontrada');
    }

    const recipientId =
      conversation.participant1Id === userId
        ? conversation.participant2Id
        : conversation.participant1Id;

    // Create message and update conversation
    const [message] = await Promise.all([
      this.prisma.directMessage.create({
        data: {
          conversationId,
          senderId: userId,
          content,
        },
        include: {
          sender: {
            select: { id: true, nombre: true, apellido: true, avatar: true },
          },
        },
      }),
      this.prisma.directConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    const messageResponse: DirectMessageResponse = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      read: message.read,
      createdAt: message.createdAt,
      sender: message.sender,
    };

    // Send real-time to recipient
    this.sendRealtime(recipientId, messageResponse);

    // Create notification for recipient
    if (this.notificationService) {
      await this.notificationService.create(recipientId, {
        type: 'DIRECT_MESSAGE',
        title: 'Nuevo mensaje',
        body: `${message.sender.nombre}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        data: { conversationId, senderId: userId, senderAvatar: message.sender.avatar },
      });
    }

    return messageResponse;
  }

  // Mark message as read
  async markAsRead(userId: string, messageId: string): Promise<void> {
    await this.prisma.directMessage.updateMany({
      where: {
        id: messageId,
        conversation: {
          OR: [
            { participant1Id: userId },
            { participant2Id: userId },
          ],
        },
        senderId: { not: userId }, // Can only mark received messages as read
      },
      data: { read: true },
    });
  }

  // Mark all messages in conversation as read
  async markConversationAsRead(userId: string, conversationId: string): Promise<void> {
    await this.prisma.directMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        read: false,
      },
      data: { read: true },
    });
  }

  // Get total unread count
  async getUnreadCount(userId: string): Promise<number> {
    // Get all user's conversations
    const conversations = await this.prisma.directConversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      select: { id: true },
    });

    return this.prisma.directMessage.count({
      where: {
        conversationId: { in: conversations.map((c) => c.id) },
        senderId: { not: userId },
        read: false,
      },
    });
  }
}
