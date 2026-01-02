import { z } from 'zod';

// Enums matching Prisma
export const StreamStatusEnum = z.enum([
  'SCHEDULED',
  'LIVE',
  'ENDED',
]);

export const StreamCategoryEnum = z.enum([
  'DANZA',
  'MUSICA',
  'ARTESANIA',
  'COCINA',
  'CHARLA',
  'OTRO',
]);

// Stream schemas
export const CreateStreamSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(2000).optional(),
  thumbnailUrl: z.string().url().optional(),
  category: StreamCategoryEnum,
  scheduledAt: z.string().datetime().optional(),
});

export const UpdateStreamSchema = CreateStreamSchema.partial();

// Query schemas
export const StreamQuerySchema = z.object({
  status: StreamStatusEnum.optional(),
  category: StreamCategoryEnum.optional(),
  userId: z.string().cuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// Message schema
export const StreamMessageSchema = z.object({
  content: z.string().min(1).max(500),
});

// Types
export type CreateStreamInput = z.infer<typeof CreateStreamSchema>;
export type UpdateStreamInput = z.infer<typeof UpdateStreamSchema>;
export type StreamQuery = z.infer<typeof StreamQuerySchema>;
export type StreamMessageInput = z.infer<typeof StreamMessageSchema>;
