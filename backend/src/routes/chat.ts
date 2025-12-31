import { FastifyPluginAsync } from 'fastify';
import { ChatService } from '../services/chat.service.js';
import { sendMessageSchema, conversationPaginationSchema } from '../schemas/chat.schema.js';
import { AppError } from '../utils/errors.js';

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  const chatService = new ChatService(fastify.prisma);

  // Send message to GuelaBot (authenticated)
  fastify.post('/messages', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = sendMessageSchema.parse(request.body);
      const result = await chatService.sendMessage(request.user.userId, data);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  });

  // List conversations (authenticated)
  fastify.get('/conversations', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const params = conversationPaginationSchema.parse(request.query);
      const result = await chatService.listConversations(request.user.userId, params);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  });

  // Get conversation by ID (authenticated)
  fastify.get<{ Params: { id: string } }>(
    '/conversations/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const conversation = await chatService.getConversation(
          request.params.id,
          request.user.userId
        );
        return reply.send(conversation);
      } catch (error) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // Delete conversation (authenticated)
  fastify.delete<{ Params: { id: string } }>(
    '/conversations/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const result = await chatService.deleteConversation(
          request.params.id,
          request.user.userId
        );
        return reply.send(result);
      } catch (error) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        throw error;
      }
    }
  );
};

export default chatRoutes;
