import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { StreamService } from '../services/stream.service.js';
import {
  CreateStreamSchema,
  UpdateStreamSchema,
  StreamQuerySchema,
  StreamMessageSchema,
} from '../schemas/stream.schema.js';

const streamsRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const streamService = new StreamService(fastify.prisma);

  // WebSocket connections map for chat
  const streamViewers = new Map<string, Set<WebSocket>>();

  // ============================================
  // PUBLIC ROUTES
  // ============================================

  // List streams
  app.get(
    '/',
    {
      schema: {
        querystring: StreamQuerySchema,
      },
    },
    async (request) => {
      return streamService.getStreams(request.query);
    }
  );

  // Get live streams
  app.get('/live', async () => {
    return streamService.getLiveStreams();
  });

  // Get upcoming streams
  app.get('/upcoming', async () => {
    return streamService.getUpcomingStreams();
  });

  // Get stream detail
  app.get(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().cuid() }),
      },
    },
    async (request) => {
      const { id } = request.params;
      return streamService.getStreamById(id);
    }
  );

  // ============================================
  // AUTHENTICATED ROUTES
  // ============================================

  // Create stream
  app.post(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: CreateStreamSchema,
      },
    },
    async (request, reply) => {
      const stream = await streamService.createStream(
        request.user.userId,
        request.body
      );
      return reply.status(201).send(stream);
    }
  );

  // Update stream
  app.put(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: z.object({ id: z.string().cuid() }),
        body: UpdateStreamSchema,
      },
    },
    async (request) => {
      const { id } = request.params;
      return streamService.updateStream(id, request.user.userId, request.body);
    }
  );

  // Delete stream
  app.delete(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: z.object({ id: z.string().cuid() }),
      },
    },
    async (request) => {
      const { id } = request.params;
      return streamService.deleteStream(id, request.user.userId);
    }
  );

  // Start stream
  app.post(
    '/:id/start',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: z.object({ id: z.string().cuid() }),
      },
    },
    async (request) => {
      const { id } = request.params;
      return streamService.startStream(id, request.user.userId);
    }
  );

  // End stream
  app.post(
    '/:id/end',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: z.object({ id: z.string().cuid() }),
      },
    },
    async (request) => {
      const { id } = request.params;
      return streamService.endStream(id, request.user.userId);
    }
  );

  // Get my streams
  app.get(
    '/user/my-streams',
    {
      onRequest: [fastify.authenticate],
    },
    async (request) => {
      return streamService.getMyStreams(request.user.userId);
    }
  );

  // ============================================
  // CHAT MESSAGES
  // ============================================

  // Get recent messages
  app.get(
    '/:id/messages',
    {
      schema: {
        params: z.object({ id: z.string().cuid() }),
      },
    },
    async (request) => {
      const { id } = request.params;
      return streamService.getRecentMessages(id);
    }
  );

  // Send message
  app.post(
    '/:id/messages',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: z.object({ id: z.string().cuid() }),
        body: StreamMessageSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const message = await streamService.createMessage(
        id,
        request.user.userId,
        request.body.content
      );
      return reply.status(201).send(message);
    }
  );

  // ============================================
  // WEBSOCKET FOR LIVE CHAT
  // ============================================

  app.get(
    '/:id/ws',
    {
      websocket: true,
      schema: {
        params: z.object({ id: z.string().cuid() }),
      },
    },
    async (socket, request) => {
      const { id: streamId } = request.params as { id: string };

      // Add to viewers set
      if (!streamViewers.has(streamId)) {
        streamViewers.set(streamId, new Set());
      }
      const viewers = streamViewers.get(streamId)!;
      viewers.add(socket as unknown as WebSocket);

      // Increment viewer count
      await streamService.incrementViewerCount(streamId);

      // Broadcast viewer count update
      const viewerCountMessage = JSON.stringify({
        type: 'viewer_count',
        count: viewers.size,
      });
      viewers.forEach((ws) => {
        if ((ws as unknown as { readyState: number }).readyState === 1) {
          (ws as unknown as { send: (msg: string) => void }).send(viewerCountMessage);
        }
      });

      // Handle incoming messages
      socket.on('message', async (rawMessage: Buffer) => {
        try {
          const data = JSON.parse(rawMessage.toString());

          if (data.type === 'chat_message' && data.token) {
            // Verify token and get user
            try {
              const decoded = fastify.jwt.verify(data.token) as { userId: string };
              const message = await streamService.createMessage(
                streamId,
                decoded.userId,
                data.content
              );

              // Broadcast message to all viewers
              const broadcastMessage = JSON.stringify({
                type: 'chat_message',
                message,
              });

              viewers.forEach((ws) => {
                if ((ws as unknown as { readyState: number }).readyState === 1) {
                  (ws as unknown as { send: (msg: string) => void }).send(broadcastMessage);
                }
              });
            } catch {
              socket.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
            }
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      // Handle disconnect
      socket.on('close', async () => {
        viewers.delete(socket as unknown as WebSocket);
        await streamService.decrementViewerCount(streamId);

        // Broadcast updated viewer count
        const viewerCountMessage = JSON.stringify({
          type: 'viewer_count',
          count: viewers.size,
        });
        viewers.forEach((ws) => {
          if ((ws as unknown as { readyState: number }).readyState === 1) {
            (ws as unknown as { send: (msg: string) => void }).send(viewerCountMessage);
          }
        });

        // Clean up empty sets
        if (viewers.size === 0) {
          streamViewers.delete(streamId);
        }
      });
    }
  );
};

export default streamsRoutes;
