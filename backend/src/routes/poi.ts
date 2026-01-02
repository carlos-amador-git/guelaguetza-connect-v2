import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { POIService } from '../services/poi.service.js';
import {
  CreatePOISchema,
  UpdatePOISchema,
  POIQuerySchema,
  NearbyPOIQuerySchema,
  CreatePOIReviewSchema,
} from '../schemas/poi.schema.js';

const poiRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const poiService = new POIService(fastify.prisma);

  // ============================================
  // PUBLIC ROUTES
  // ============================================

  // List all POIs
  app.get(
    '/',
    {
      schema: {
        querystring: POIQuerySchema,
      },
    },
    async (request) => {
      return poiService.getPOIs(request.query);
    }
  );

  // Get nearby POIs
  app.get(
    '/nearby',
    {
      schema: {
        querystring: NearbyPOIQuerySchema,
      },
    },
    async (request) => {
      return poiService.getNearbyPOIs(request.query);
    }
  );

  // Get POI detail
  app.get(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string().cuid() }),
      },
    },
    async (request) => {
      const { id } = request.params;
      // Try to get user ID if authenticated
      let userId: string | undefined;
      try {
        await request.jwtVerify();
        userId = request.user?.userId;
      } catch {
        // Not authenticated, that's ok
      }
      return poiService.getPOIById(id, userId);
    }
  );

  // ============================================
  // AUTHENTICATED ROUTES
  // ============================================

  // Toggle favorite
  app.post(
    '/:id/favorite',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: z.object({ id: z.string().cuid() }),
      },
    },
    async (request) => {
      const { id } = request.params;
      return poiService.toggleFavorite(request.user.userId, id);
    }
  );

  // Check-in at POI
  app.post(
    '/:id/checkin',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: z.object({ id: z.string().cuid() }),
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const checkIn = await poiService.checkIn(request.user.userId, id);
      return reply.status(201).send(checkIn);
    }
  );

  // Create review
  app.post(
    '/:id/reviews',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: z.object({ id: z.string().cuid() }),
        body: CreatePOIReviewSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const review = await poiService.createReview(request.user.userId, id, request.body);
      return reply.status(201).send(review);
    }
  );

  // Get user's favorites
  app.get(
    '/user/favorites',
    {
      onRequest: [fastify.authenticate],
    },
    async (request) => {
      return poiService.getUserFavorites(request.user.userId);
    }
  );

  // Get user's check-ins
  app.get(
    '/user/checkins',
    {
      onRequest: [fastify.authenticate],
    },
    async (request) => {
      return poiService.getUserCheckIns(request.user.userId);
    }
  );

  // ============================================
  // ADMIN ROUTES
  // ============================================

  // Create POI (admin only)
  app.post(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: CreatePOISchema,
      },
    },
    async (request, reply) => {
      // TODO: Check admin role
      const poi = await poiService.createPOI(request.body);
      return reply.status(201).send(poi);
    }
  );

  // Update POI (admin only)
  app.put(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: z.object({ id: z.string().cuid() }),
        body: UpdatePOISchema,
      },
    },
    async (request) => {
      const { id } = request.params;
      // TODO: Check admin role
      return poiService.updatePOI(id, request.body);
    }
  );

  // Delete POI (admin only)
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
      // TODO: Check admin role
      return poiService.deletePOI(id);
    }
  );
};

export default poiRoutes;
