import { z } from 'zod';

// Query schemas
export const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const conversationIdParamsSchema = z.object({
  conversationId: z.string().min(1),
});

export const messageIdParamsSchema = z.object({
  messageId: z.string().min(1),
});

// Body schemas
export const createConversationBodySchema = z.object({
  participantId: z.string().min(1),
});

export const sendMessageBodySchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

// Response schemas
export const directMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  content: z.string(),
  read: z.boolean(),
  createdAt: z.date(),
  sender: z.object({
    id: z.string(),
    nombre: z.string(),
    apellido: z.string().nullable(),
    avatar: z.string().nullable(),
  }),
});

export const conversationSchema = z.object({
  id: z.string(),
  lastMessageAt: z.date().nullable(),
  createdAt: z.date(),
  otherParticipant: z.object({
    id: z.string(),
    nombre: z.string(),
    apellido: z.string().nullable(),
    avatar: z.string().nullable(),
  }),
  lastMessage: z.object({
    content: z.string(),
    senderId: z.string(),
    createdAt: z.date(),
  }).nullable(),
  unreadCount: z.number(),
});

// Types
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type ConversationIdParams = z.infer<typeof conversationIdParamsSchema>;
export type MessageIdParams = z.infer<typeof messageIdParamsSchema>;
export type CreateConversationBody = z.infer<typeof createConversationBodySchema>;
export type SendMessageBody = z.infer<typeof sendMessageBodySchema>;
export type DirectMessage = z.infer<typeof directMessageSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
