import { FastifyPluginAsync } from 'fastify';
import { SearchService } from '../services/search.service.js';
import {
  searchQuerySchema,
  suggestionsQuerySchema,
  SearchQuery,
  SuggestionsQuery,
} from '../schemas/search.schema.js';

const searchRoutes: FastifyPluginAsync = async (fastify) => {
  const searchService = new SearchService(fastify.prisma);

  // Search users and stories
  fastify.get<{ Querystring: SearchQuery }>(
    '/',
    {
      schema: {
        querystring: searchQuerySchema,
      },
    },
    async (request, reply) => {
      const query = request.query;

      const result = await searchService.search(query);
      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  // Get trending content
  fastify.get(
    '/trending',
    async (request, reply) => {
      const [hashtags, stories] = await Promise.all([
        searchService.getTrendingHashtags(10),
        searchService.getTrendingStories(10),
      ]);

      return reply.send({
        success: true,
        data: { hashtags, stories },
      });
    }
  );

  // Get search suggestions (autocomplete)
  fastify.get<{ Querystring: SuggestionsQuery }>(
    '/suggestions',
    {
      schema: {
        querystring: suggestionsQuerySchema,
      },
    },
    async (request, reply) => {
      const { q, limit } = request.query;

      const suggestions = await searchService.getSuggestions(q, limit);
      return reply.send({
        success: true,
        data: { suggestions },
      });
    }
  );
};

export default searchRoutes;
