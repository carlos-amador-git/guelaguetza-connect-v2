import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { MarketplaceService } from '../services/marketplace.service.js';
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductQuerySchema,
  CreateProductReviewSchema,
  CreateSellerProfileSchema,
  UpdateSellerProfileSchema,
} from '../schemas/marketplace.schema.js';

const marketplaceRoutes: FastifyPluginAsync = async (fastify) => {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const marketplaceService = new MarketplaceService(fastify.prisma, fastify.cache, fastify.eventBus);

  // ============================================
  // PRODUCTS (Public)
  // ============================================

  // List products
  app.get(
    '/products',
    {
      schema: {
        querystring: ProductQuerySchema,
      },
    },
    async (request) => {
      return marketplaceService.getProducts(request.query);
    }
  );

  // Get product detail
  app.get(
    '/products/:id',
    {
      schema: {
        params: z.object({ id: z.string().cuid() }),
      },
    },
    async (request) => {
      const { id } = request.params;
      return marketplaceService.getProductById(id);
    }
  );

  // ============================================
  // PRODUCTS (Seller)
  // ============================================

  // Create product
  app.post(
    '/products',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: CreateProductSchema,
      },
    },
    async (request, reply) => {
      const product = await marketplaceService.createProduct(
        request.user.userId,
        request.body
      );
      return reply.status(201).send(product);
    }
  );

  // Update product
  app.put(
    '/products/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: z.object({ id: z.string().cuid() }),
        body: UpdateProductSchema,
      },
    },
    async (request) => {
      const { id } = request.params;
      return marketplaceService.updateProduct(id, request.user.userId, request.body);
    }
  );

  // Delete product
  app.delete(
    '/products/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: z.object({ id: z.string().cuid() }),
      },
    },
    async (request) => {
      const { id } = request.params;
      return marketplaceService.deleteProduct(id, request.user.userId);
    }
  );

  // ============================================
  // SELLER PROFILE
  // ============================================

  // Get my seller profile
  app.get(
    '/seller/profile',
    {
      onRequest: [fastify.authenticate],
    },
    async (request) => {
      return marketplaceService.getSellerProfile(request.user.userId);
    }
  );

  // Create seller profile
  app.post(
    '/seller/profile',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: CreateSellerProfileSchema,
      },
    },
    async (request, reply) => {
      const profile = await marketplaceService.createSellerProfile(
        request.user.userId,
        request.body
      );
      return reply.status(201).send(profile);
    }
  );

  // Update seller profile
  app.put(
    '/seller/profile',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: UpdateSellerProfileSchema,
      },
    },
    async (request) => {
      return marketplaceService.updateSellerProfile(
        request.user.userId,
        request.body
      );
    }
  );

  // ============================================
  // REVIEWS
  // ============================================

  // Create product review
  app.post(
    '/products/:id/reviews',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: z.object({ id: z.string().cuid() }),
        body: CreateProductReviewSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const review = await marketplaceService.createProductReview(
        request.user.userId,
        id,
        request.body
      );
      return reply.status(201).send(review);
    }
  );
};

export default marketplaceRoutes;
