import { FastifyPluginAsync } from 'fastify';
import { DMService } from '../services/dm.service.js';
import { NotificationService } from '../services/notification.service.js';
import {
  paginationQuerySchema,
  conversationIdParamsSchema,
  messageIdParamsSchema,
  createConversationBodySchema,
  sendMessageBodySchema,
  PaginationQuery,
  ConversationIdParams,
  MessageIdParams,
  CreateConversationBody,
  SendMessageBody,
} from '../schemas/dm.schema.js';

const dmRoutes: FastifyPluginAsync = async (fastify) => {
  const notificationService = new NotificationService(fastify.prisma);
  const dmService = new DMService(fastify.prisma, notificationService);

  // WebSocket connection for real-time DMs
  fastify.get(
    '/ws',
    { websocket: true },
    async (socket, request) => {
      const token = (request.query as { token?: string }).token;

      if (!token) {
        socket.close(4001, 'Token required');
        return;
      }

      try {
        const decoded = fastify.jwt.verify<{ userId: string }>(token);
        const userId = decoded.userId;

        // Register connection
        dmService.registerConnection(userId, socket);

        // Send unread count on connect
        const unreadCount = await dmService.getUnreadCount(userId);
        socket.send(JSON.stringify({
          type: 'connected',
          data: { unreadCount },
        }));

        // Handle disconnect
        socket.on('close', () => {
          dmService.unregisterConnection(userId);
        });

        // Handle incoming messages
        socket.on('message', async (message: Buffer) => {
          try {
            const data = JSON.parse(message.toString());

            if (data.type === 'markRead' && data.conversationId) {
              await dmService.markConversationAsRead(userId, data.conversationId);
            }
          } catch {
            // Ignore malformed messages
          }
        });
      } catch {
        socket.close(4002, 'Invalid token');
      }
    }
  );

  // Get user's conversations
  fastify.get<{ Querystring: PaginationQuery }>(
    '/conversations',
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: paginationQuerySchema,
      },
    },
    async (request, reply) => {
      const userId = request.user.userId;
      const pagination = request.query;

      const result = await dmService.getConversations(userId, pagination);
      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // Create or get conversation with user
  fastify.post<{ Body: CreateConversationBody }>(
    '/conversations',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: createConversationBodySchema,
      },
    },
    async (request, reply) => {
      const userId = request.user.userId;
      const { participantId } = request.body;

      if (userId === participantId) {
        return reply.status(400).send({
          success: false,
          error: 'No puedes crear una conversación contigo mismo',
        });
      }

      // Verify participant exists
      const participant = await fastify.prisma.user.findUnique({
        where: { id: participantId },
        select: { id: true, nombre: true, apellido: true, avatar: true },
      });

      if (!participant) {
        return reply.status(404).send({
          success: false,
          error: 'Usuario no encontrado',
        });
      }

      const conversation = await dmService.getOrCreateConversation(userId, participantId);

      return reply.send({
        success: true,
        data: {
          id: conversation.id,
          otherParticipant: participant,
        },
      });
    }
  );

  // Get messages for a conversation
  fastify.get<{ Params: ConversationIdParams; Querystring: PaginationQuery }>(
    '/conversations/:conversationId/messages',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: conversationIdParamsSchema,
        querystring: paginationQuerySchema,
      },
    },
    async (request, reply) => {
      const userId = request.user.userId;
      const { conversationId } = request.params;
      const pagination = request.query;

      try {
        const result = await dmService.getMessages(userId, conversationId, pagination);

        // Mark messages as read when fetching
        await dmService.markConversationAsRead(userId, conversationId);

        return reply.send({
          success: true,
          data: result,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          error: 'Conversación no encontrada',
        });
      }
    }
  );

  // Send a message
  fastify.post<{ Body: SendMessageBody }>(
    '/messages',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: sendMessageBodySchema,
      },
    },
    async (request, reply) => {
      const userId = request.user.userId;
      const { conversationId, content } = request.body;

      try {
        const message = await dmService.sendMessage(userId, conversationId, content);
        return reply.send({
          success: true,
          data: message,
        });
      } catch (error) {
        return reply.status(404).send({
          success: false,
          error: 'Conversación no encontrada',
        });
      }
    }
  );

  // Mark message as read
  fastify.put<{ Params: MessageIdParams }>(
    '/messages/:messageId/read',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: messageIdParamsSchema,
      },
    },
    async (request, reply) => {
      const userId = request.user.userId;
      const { messageId } = request.params;

      await dmService.markAsRead(userId, messageId);
      return reply.send({
        success: true,
        message: 'Mensaje marcado como leído',
      });
    }
  );

  // Get unread count
  fastify.get(
    '/unread-count',
    {
      onRequest: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.userId;
      const count = await dmService.getUnreadCount(userId);

      return reply.send({
        success: true,
        data: { count },
      });
    }
  );
};

export default dmRoutes;
