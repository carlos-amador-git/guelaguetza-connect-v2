import { FastifyPluginAsync } from 'fastify';
import { TransportService } from '../services/transport.service.js';
import { AppError } from '../utils/errors.js';

const transportRoutes: FastifyPluginAsync = async (fastify) => {
  const transportService = new TransportService(fastify.prisma);

  // List all routes
  fastify.get('/routes', async (request, reply) => {
    try {
      const routes = await transportService.listRoutes();
      return reply.send({ routes });
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  });

  // Get route by ID
  fastify.get<{ Params: { id: string } }>('/routes/:id', async (request, reply) => {
    try {
      const route = await transportService.getRouteById(request.params.id);
      return reply.send(route);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  });

  // Get route by code (e.g., RC01, T01)
  fastify.get<{ Params: { code: string } }>('/routes/code/:code', async (request, reply) => {
    try {
      const route = await transportService.getRouteByCode(request.params.code);
      return reply.send(route);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  });

  // Get realtime position for a route
  fastify.get<{ Params: { id: string } }>('/routes/:id/realtime', async (request, reply) => {
    try {
      const position = await transportService.getRealtimePosition(request.params.id);
      return reply.send(position);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  });

  // Get stop by ID
  fastify.get<{ Params: { id: string } }>('/stops/:id', async (request, reply) => {
    try {
      const stop = await transportService.getStopById(request.params.id);
      return reply.send(stop);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  });

  // WebSocket for realtime updates
  fastify.get<{ Params: { id: string } }>('/routes/:id/ws', { websocket: true }, (socket, request) => {
    const routeId = request.params.id;
    let intervalId: ReturnType<typeof setInterval>;

    const sendUpdate = async () => {
      try {
        const position = await transportService.getRealtimePosition(routeId);
        socket.send(JSON.stringify(position));
      } catch (error) {
        socket.send(JSON.stringify({ error: 'Error getting position' }));
      }
    };

    // Send initial position
    sendUpdate();

    // Send updates every 5 seconds
    intervalId = setInterval(sendUpdate, 5000);

    socket.on('close', () => {
      clearInterval(intervalId);
    });

    socket.on('error', () => {
      clearInterval(intervalId);
    });
  });
};

export default transportRoutes;
