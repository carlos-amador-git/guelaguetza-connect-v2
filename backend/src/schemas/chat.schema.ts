import { z } from 'zod';

export const sendMessageSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1, 'El mensaje no puede estar vacío'),
  context: z
    .object({
      location: z.string().optional(),
      currentRoute: z.string().optional(),
    })
    .optional(),
});

export const conversationPaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ConversationPaginationInput = z.infer<typeof conversationPaginationSchema>;
