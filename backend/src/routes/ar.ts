import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ARPointsService } from '../services/ar-points.service.js';
import { ARVestimentasService } from '../services/ar-vestimentas.service.js';
import {
  NearbyQuerySchema,
  PointsQuerySchema,
  CollectPointBodySchema,
  CollectionQuerySchema,
  ProgressQuerySchema,
  VestimentasQuerySchema,
  FavoriteBodySchema,
} from '../schemas/ar.schema.js';

// Shared query schema for userId
const UserIdQuerySchema = z.object({ userId: z.string().min(1) });

const arRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  const pointsService = new ARPointsService(fastify.prisma);
  const vestimentasService = new ARVestimentasService(fastify.prisma);

  // ============================================================================
  // NEARBY POINTS (Public)
  // ============================================================================

  /**
   * GET /api/ar/nearby?lat=X&lng=Y&radius=Z
   * Returns AR points within radius of the provided coordinates.
   */
  app.get(
    '/nearby',
    {
      schema: {
        querystring: NearbyQuerySchema,
      },
    },
    async (request) => {
      const { lat, lng, radius } = request.query;
      return pointsService.getNearbyPoints(lat, lng, radius);
    }
  );

  // ============================================================================
  // POINTS (Public)
  // ============================================================================

  /**
   * GET /api/ar/points?tipo=X&region=X&quest=X&collectible=true
   * Returns all AR points with optional filters.
   */
  app.get(
    '/points',
    {
      schema: {
        querystring: PointsQuerySchema,
      },
    },
    async (request) => {
      const points = await pointsService.getAllPoints(request.query);
      return { count: points.length, points };
    }
  );

  /**
   * GET /api/ar/points/:id
   * Returns a single AR point by numeric ID.
   */
  app.get(
    '/points/:id',
    {
      schema: {
        params: z.object({ id: z.coerce.number().int().positive() }),
      },
    },
    async (request) => {
      const { id } = request.params;
      return pointsService.getPointById(id);
    }
  );

  // ============================================================================
  // COLLECTION (Authenticated)
  // ============================================================================

  /**
   * POST /api/ar/collection
   * Registers a point collection for the authenticated user.
   */
  app.post(
    '/collection',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: CollectPointBodySchema,
      },
    },
    async (request, reply) => {
      const result = await pointsService.collectPoint(request.user.userId, request.body);

      if (result && typeof result === 'object' && 'success' in result && !(result as any).success) {
        return reply.status(400).send({
          error: (result as any).error || 'Error al colectar punto',
        });
      }

      return reply.status(201).send(result);
    }
  );

  /**
   * GET /api/ar/collection?userId=X&idsOnly=true
   * Returns the collection (or only IDs) for the given user.
   */
  app.get(
    '/collection',
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: CollectionQuerySchema,
      },
    },
    async (request) => {
      const { userId, idsOnly } = request.query;

      if (idsOnly) {
        const collectedIds = await pointsService.getCollectedIds(userId);
        return { collectedIds };
      }

      return pointsService.getUserCollection(userId);
    }
  );

  // ============================================================================
  // PROGRESS (Authenticated)
  // ============================================================================

  /**
   * GET /api/ar/progress?userId=X
   * Returns the full AR progress for the given user.
   */
  app.get(
    '/progress',
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: ProgressQuerySchema,
      },
    },
    async (request) => {
      const { userId } = request.query;
      return pointsService.getUserProgress(userId);
    }
  );

  // ============================================================================
  // REGIONS (Public)
  // ============================================================================

  /**
   * GET /api/ar/regions
   * Returns all active regions with point counts.
   */
  app.get('/regions', async () => {
    return pointsService.getAllRegions();
  });

  // ============================================================================
  // VESTIMENTAS (Public)
  // ============================================================================

  /**
   * GET /api/ar/vestimentas?region=X&categoria=X&genero=X&trackingType=X&featured=true
   * Returns the vestimentas catalog with optional filters.
   */
  app.get(
    '/vestimentas',
    {
      schema: {
        querystring: VestimentasQuerySchema,
      },
    },
    async (request) => {
      return vestimentasService.getVestimentasCatalog(request.query);
    }
  );

  /**
   * GET /api/ar/vestimentas/:id
   * Returns a single vestimenta by numeric ID.
   */
  app.get(
    '/vestimentas/:id',
    {
      schema: {
        params: z.object({ id: z.coerce.number().int().positive() }),
      },
    },
    async (request) => {
      const { id } = request.params;
      return vestimentasService.getVestimentaById(id);
    }
  );

  /**
   * GET /api/ar/vestimentas/set/:setId
   * Returns all items of a vestimenta set.
   */
  app.get(
    '/vestimentas/set/:setId',
    {
      schema: {
        params: z.object({ setId: z.coerce.number().int().positive() }),
      },
    },
    async (request) => {
      const { setId } = request.params;
      return vestimentasService.getVestimentaSet(setId);
    }
  );

  /**
   * GET /api/ar/vestimentas/categorias
   * Returns vestimenta categories with item counts.
   */
  app.get('/vestimentas/categorias', async () => {
    return vestimentasService.getCategoriasConConteo();
  });

  // ============================================================================
  // FAVORITES (Authenticated)
  // ============================================================================

  /**
   * GET /api/ar/vestimentas/favorites
   * Returns the authenticated user's favorite vestimentas.
   */
  app.get(
    '/vestimentas/favorites',
    {
      onRequest: [fastify.authenticate],
    },
    async (request) => {
      return vestimentasService.getUserFavorites(request.user.userId);
    }
  );

  /**
   * POST /api/ar/vestimentas/favorites
   * Adds a vestimenta to the authenticated user's favorites.
   */
  app.post(
    '/vestimentas/favorites',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: FavoriteBodySchema,
      },
    },
    async (request, reply) => {
      const success = await vestimentasService.addToFavorites(
        request.user.userId,
        request.body
      );

      if (!success) {
        return reply.status(500).send({ error: 'Error al agregar favorito' });
      }

      return reply.status(201).send({ success: true });
    }
  );

  /**
   * DELETE /api/ar/vestimentas/favorites
   * Removes a vestimenta from the authenticated user's favorites.
   */
  app.delete(
    '/vestimentas/favorites',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: z.object({ vestimentaId: z.number().int().positive() }),
      },
    },
    async (request, reply) => {
      const success = await vestimentasService.removeFromFavorites(
        request.user.userId,
        request.body.vestimentaId
      );

      if (!success) {
        return reply.status(500).send({ error: 'Error al eliminar favorito' });
      }

      return { success: true };
    }
  );
  // ============================================================================
  // QUESTS (Public + Authenticated)
  // ============================================================================

  /**
   * GET /api/ar/quests
   * Returns all active quests.
   */
  app.get('/quests', async () => {
    return pointsService.getQuests();
  });

  /**
   * GET /api/ar/quests/:id
   * Returns a quest with its collectible items.
   */
  app.get(
    '/quests/:id',
    {
      schema: {
        params: z.object({ id: z.coerce.number().int().positive() }),
      },
    },
    async (request) => {
      const { id } = request.params;
      return pointsService.getQuestById(id);
    }
  );

  /**
   * GET /api/ar/quests/:id/progress?userId=X
   * Returns the user's progress on a specific quest.
   */
  app.get(
    '/quests/:id/progress',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: z.object({ id: z.coerce.number().int().positive() }),
        querystring: UserIdQuerySchema,
      },
    },
    async (request) => {
      const { id } = request.params;
      const { userId } = request.query;
      return pointsService.getQuestProgress(id, userId);
    }
  );

  /**
   * POST /api/ar/quests/:id/start
   * Starts a quest for the authenticated user.
   */
  app.post(
    '/quests/:id/start',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: z.object({ id: z.coerce.number().int().positive() }),
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const result = await pointsService.startQuest(id, request.user.userId);
      return reply.status(201).send(result);
    }
  );

  // ============================================================================
  // ACHIEVEMENTS (Public + Authenticated)
  // ============================================================================

  /**
   * GET /api/ar/achievements
   * Returns all active achievements.
   */
  app.get('/achievements', async () => {
    return pointsService.getAchievements();
  });

  /**
   * GET /api/ar/achievements/:userId
   * Returns achievements unlocked by a specific user.
   */
  app.get(
    '/achievements/:userId',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: z.object({ userId: z.string().min(1) }),
      },
    },
    async (request) => {
      const { userId } = request.params;
      return pointsService.getUserAchievements(userId);
    }
  );

  // ============================================================================
  // LEADERBOARD (Public)
  // ============================================================================

  // ============================================================================
  // WIFI ZONES (Public)
  // ============================================================================

  /**
   * GET /api/ar/wifi-zones
   * Returns all active WiFi zones from ar.wifi_zones (with seed fallback).
   */
  app.get('/wifi-zones', async () => {
    return pointsService.getWifiZones();
  });

  // ============================================================================
  // ANALYTICS EVENTS (Public — batched)
  // ============================================================================

  const AnalyticsEventSchema = z.object({
    eventType: z.string().min(1),
    userId: z.string().optional(),
    pointId: z.number().int().positive().optional(),
    metadata: z.record(z.unknown()).optional(),
  });

  /**
   * POST /api/ar/analytics
   * Batch-inserts AR analytics events.
   * Body: { events: [{ eventType, userId?, pointId?, metadata? }] }
   */
  app.post(
    '/analytics',
    {
      schema: {
        body: z.object({
          events: z.array(AnalyticsEventSchema).min(1).max(100),
        }),
      },
    },
    async (request, reply) => {
      await pointsService.trackEvents(request.body.events);
      return reply.status(202).send({ success: true, queued: request.body.events.length });
    }
  );

  /**
   * GET /api/ar/leaderboard
   * Returns the top users ranked by total points.
   */
  app.get(
    '/leaderboard',
    {
      schema: {
        querystring: z.object({
          limit: z.coerce.number().int().min(1).max(100).default(10),
        }),
      },
    },
    async (request) => {
      const { limit } = request.query;
      return pointsService.getLeaderboard(limit);
    }
  );

  // ============================================================================
  // USER AR PROFILE (Authenticated)
  // ============================================================================

  /**
   * GET /api/ar/user/profile?userId=X
   * Returns the full AR profile (stats + achievements + quests) for a user.
   */
  app.get(
    '/user/profile',
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: UserIdQuerySchema,
      },
    },
    async (request) => {
      const { userId } = request.query;
      return pointsService.getUserARProfile(userId);
    }
  );

  // ============================================================================
  // ALEBRIJE — Image-to-3D (Sprint 3.2)
  // These are stubs: no real AI service is connected yet.
  // The generate endpoint creates a user_creations record (when the table
  // exists) and returns a mock taskId; status returns 'completed' after a
  // short simulated delay.
  // ============================================================================

  const AlebrijeGenerateBodySchema = z.object({
    image: z.string().min(1, 'image is required (base64)'),
    style: z.enum(['realistic', 'cartoon', 'stylized']).optional(),
    userId: z.string().optional(),
    nombreCreacion: z.string().max(120).optional(),
  });

  /**
   * POST /api/ar/alebrije/generate
   * Stub: saves intent + returns a mock taskId.
   */
  app.post(
    '/alebrije/generate',
    {
      schema: {
        body: AlebrijeGenerateBodySchema,
      },
    },
    async (request, reply) => {
      const { userId, nombreCreacion } = request.body;

      // Generate a deterministic-ish mock taskId
      const taskId = `alebrije-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Attempt to persist to user_creations — silently ignore if table absent
      try {
        await fastify.prisma.$executeRawUnsafe(
          `INSERT INTO ar.user_creations
             (uuid, user_id, nombre_creacion, ai_task_id, status, created_at)
           VALUES ($1, $2, $3, $4, 'pending', NOW())
           ON CONFLICT DO NOTHING`,
          taskId,
          userId ?? null,
          nombreCreacion ?? 'Mi Alebrije',
          taskId
        );
      } catch {
        // Table may not exist yet — stub still works
      }

      return reply.status(202).send({
        success: true,
        taskId,
        status: 'pending',
      });
    }
  );

  /**
   * GET /api/ar/alebrije/status/:taskId
   * Stub: always returns 'completed' with a placeholder GLB URL.
   */
  app.get(
    '/alebrije/status/:taskId',
    {
      schema: {
        params: z.object({ taskId: z.string().min(1) }),
      },
    },
    async (request) => {
      const { taskId } = request.params;

      // Simulate processing: tasks created less than 5 s ago are still 'processing'
      const createdMs = parseInt(taskId.split('-')[1] ?? '0', 10);
      const elapsedMs = Date.now() - createdMs;
      const isReady = elapsedMs >= 5_000;

      return {
        success: true,
        taskId,
        status: isReady ? 'completed' : 'processing',
        modelUrl: isReady
          ? 'https://modelviewer.dev/shared-assets/models/Astronaut.glb'
          : undefined,
        modelUrlUsdz: isReady
          ? 'https://modelviewer.dev/shared-assets/models/Astronaut.usdz'
          : undefined,
        thumbnailUrl: isReady
          ? 'https://modelviewer.dev/shared-assets/models/Astronaut.webp'
          : undefined,
      };
    }
  );

  /**
   * GET /api/ar/alebrije/gallery?userId=X
   * Returns all alebrijes created by the given user (reads user_creations).
   */
  app.get(
    '/alebrije/gallery',
    {
      schema: {
        querystring: z.object({ userId: z.string().min(1) }),
      },
    },
    async (request) => {
      const { userId } = request.query;

      try {
        const rows = await fastify.prisma.$queryRawUnsafe<
          {
            uuid: string;
            nombre_creacion: string | null;
            model_url_glb: string | null;
            model_url_usdz: string | null;
            thumbnail_url: string | null;
            status: string;
            created_at: Date;
          }[]
        >(
          `SELECT uuid, nombre_creacion, model_url_glb, model_url_usdz,
                  thumbnail_url, status, created_at
           FROM ar.user_creations
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT 50`,
          userId
        );

        return {
          count: rows.length,
          creations: rows.map((r) => ({
            uuid: r.uuid,
            nombreCreacion: r.nombre_creacion ?? 'Mi Alebrije',
            modelUrlGlb: r.model_url_glb,
            modelUrlUsdz: r.model_url_usdz,
            thumbnailUrl: r.thumbnail_url,
            status: r.status,
            createdAt: r.created_at,
          })),
        };
      } catch {
        // Table absent — return empty gallery
        return { count: 0, creations: [] };
      }
    }
  );
};

export default arRoutes;
