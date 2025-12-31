import { z } from 'zod';

export const createStorySchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  mediaUrl: z.string().url('URL de media inválida'),
  location: z.string().min(1, 'La ubicación es requerida'),
});

export const updateStorySchema = z.object({
  description: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
});

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  offset: z.coerce.number().min(0).default(0),
  location: z.string().optional(),
});

export const commentSchema = z.object({
  text: z.string().min(1, 'El comentario no puede estar vacío'),
});

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
