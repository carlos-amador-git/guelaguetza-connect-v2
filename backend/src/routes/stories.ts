import { FastifyPluginAsync } from 'fastify';
import { StoryService } from '../services/story.service.js';
import { createStorySchema, updateStorySchema, paginationSchema, commentSchema } from '../schemas/story.schema.js';
import { AppError } from '../utils/errors.js';

const storiesRoutes: FastifyPluginAsync = async (fastify) => {
  const storyService = new StoryService(fastify.prisma);

  // List stories (public)
  fastify.get('/', async (request, reply) => {
    try {
      const params = paginationSchema.parse(request.query);
      const result = await storyService.list(params);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  });

  // Create story (authenticated)
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = createStorySchema.parse(request.body);
      const story = await storyService.create(request.user.userId, data);
      return reply.status(201).send(story);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  });

  // Get story by ID (public)
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      // Try to get userId from token if present
      let userId: string | undefined;
      try {
        await request.jwtVerify();
        userId = request.user.userId;
      } catch {
        // Not authenticated, that's fine for public endpoint
      }

      const story = await storyService.getById(request.params.id, userId);
      return reply.send(story);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  });

  // Update story (authenticated, owner only)
  fastify.put<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const data = updateStorySchema.parse(request.body);
        const story = await storyService.update(request.params.id, request.user.userId, data);
        return reply.send(story);
      } catch (error) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // Delete story (authenticated, owner only)
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const result = await storyService.delete(request.params.id, request.user.userId);
        return reply.send(result);
      } catch (error) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // Like/Unlike story (authenticated)
  fastify.post<{ Params: { id: string } }>(
    '/:id/like',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const result = await storyService.toggleLike(request.params.id, request.user.userId);
        return reply.send(result);
      } catch (error) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // Add comment (authenticated)
  fastify.post<{ Params: { id: string } }>(
    '/:id/comment',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const data = commentSchema.parse(request.body);
        const comment = await storyService.addComment(request.params.id, request.user.userId, data);
        return reply.status(201).send(comment);
      } catch (error) {
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        throw error;
      }
    }
  );
};

export default storiesRoutes;
