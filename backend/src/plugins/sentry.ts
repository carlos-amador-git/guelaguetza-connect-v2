import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import * as Sentry from '@sentry/node';

declare module 'fastify' {
  interface FastifyInstance {
    sentry: typeof Sentry;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    fastify.log.warn('SENTRY_DSN not set, error tracking disabled');
    // Provide a no-op decorator so code can reference fastify.sentry safely
    fastify.decorate('sentry', Sentry);
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Strip sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });

  fastify.decorate('sentry', Sentry);

  // Capture unhandled errors
  fastify.addHook('onError', async (_request, _reply, error) => {
    Sentry.captureException(error);
  });

  fastify.log.info('Sentry error tracking initialized');
});
