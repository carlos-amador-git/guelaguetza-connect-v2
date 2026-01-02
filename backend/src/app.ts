import Fastify, { FastifyInstance, FastifyError } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import prismaPlugin from './plugins/prisma.js';
import authPlugin from './plugins/auth.js';
import authRoutes from './routes/auth.js';
import storiesRoutes from './routes/stories.js';
import transportRoutes from './routes/transport.js';
import chatRoutes from './routes/chat.js';
import pushRoutes from './routes/push.js';
import socialRoutes from './routes/social.js';
import gamificationRoutes from './routes/gamification.js';
import notificationsRoutes from './routes/notifications.js';
import dmRoutes from './routes/dm.js';
import searchRoutes from './routes/search.js';
import eventsRoutes from './routes/events.js';
import { ZodError } from 'zod';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Register CORS
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Register WebSocket support
  await app.register(websocket);

  // Register plugins
  await app.register(prismaPlugin);
  await app.register(authPlugin);

  // Register routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(storiesRoutes, { prefix: '/api/stories' });
  await app.register(transportRoutes, { prefix: '/api/transport' });
  await app.register(chatRoutes, { prefix: '/api/chat' });
  await app.register(pushRoutes, { prefix: '/api/push' });
  await app.register(socialRoutes, { prefix: '/api' });
  await app.register(gamificationRoutes, { prefix: '/api/gamification' });
  await app.register(notificationsRoutes, { prefix: '/api/notifications' });
  await app.register(dmRoutes, { prefix: '/api/dm' });
  await app.register(searchRoutes, { prefix: '/api/search' });
  await app.register(eventsRoutes, { prefix: '/api/events' });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Root endpoint
  app.get('/', async () => {
    return {
      name: 'Guelaguetza Connect API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        stories: '/api/stories',
        transport: '/api/transport',
        chat: '/api/chat',
        push: '/api/push',
        social: '/api/users, /api/feed',
        gamification: '/api/gamification',
        notifications: '/api/notifications',
        dm: '/api/dm',
        search: '/api/search',
        events: '/api/events',
      },
    };
  });

  // Global error handler
  app.setErrorHandler((error: FastifyError, request, reply) => {
    app.log.error(error);

    // Zod validation errors
    if (error instanceof ZodError) {
      return reply.status(422).send({
        error: 'Error de validación',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    // Default error response
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? 'Error interno del servidor' : error.message;

    return reply.status(statusCode).send({ error: message });
  });

  return app;
}
