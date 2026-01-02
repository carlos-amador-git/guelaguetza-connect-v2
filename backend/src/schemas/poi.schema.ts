import { z } from 'zod';

// Enums matching Prisma
export const POICategoryEnum = z.enum([
  'CULTURAL',
  'GASTRONOMIA',
  'ARTESANIA',
  'EVENTO',
  'TRANSPORTE',
  'NATURALEZA',
]);

// POI schemas
export const CreatePOISchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  imageUrl: z.string().url().optional(),
  arModelUrl: z.string().url().optional(),
  category: POICategoryEnum,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().max(200).optional(),
});

export const UpdatePOISchema = CreatePOISchema.partial().extend({
  isVerified: z.boolean().optional(),
});

// Query schemas
export const POIQuerySchema = z.object({
  category: POICategoryEnum.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const NearbyPOIQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().default(5), // km
  category: POICategoryEnum.optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

// Review schema
export const CreatePOIReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// Types
export type CreatePOIInput = z.infer<typeof CreatePOISchema>;
export type UpdatePOIInput = z.infer<typeof UpdatePOISchema>;
export type POIQuery = z.infer<typeof POIQuerySchema>;
export type NearbyPOIQuery = z.infer<typeof NearbyPOIQuerySchema>;
export type CreatePOIReviewInput = z.infer<typeof CreatePOIReviewSchema>;
