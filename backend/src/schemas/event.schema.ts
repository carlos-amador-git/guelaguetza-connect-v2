import { z } from 'zod';

// Enums
export const eventCategoryEnum = z.enum([
  'DANZA',
  'MUSICA',
  'GASTRONOMIA',
  'ARTESANIA',
  'CEREMONIA',
  'DESFILE',
  'OTRO',
]);

// Query schemas
export const eventsQuerySchema = z.object({
  category: eventCategoryEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const eventIdParamsSchema = z.object({
  eventId: z.string().min(1),
});

// Body schemas
export const createReminderBodySchema = z.object({
  remindAt: z.coerce.date(),
});

// Response schemas
export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().nullable(),
  location: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  startDate: z.date(),
  endDate: z.date().nullable(),
  category: eventCategoryEnum,
  isOfficial: z.boolean(),
  rsvpCount: z.number(),
  hasRSVP: z.boolean().optional(),
  hasReminder: z.boolean().optional(),
});

export const eventDetailSchema = eventSchema.extend({
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const eventListResponseSchema = z.object({
  events: z.array(eventSchema),
  hasMore: z.boolean(),
  total: z.number(),
});

export const myRSVPsResponseSchema = z.object({
  events: z.array(eventSchema),
  total: z.number(),
});

// Types
export type EventCategory = z.infer<typeof eventCategoryEnum>;
export type EventsQuery = z.infer<typeof eventsQuerySchema>;
export type EventIdParams = z.infer<typeof eventIdParamsSchema>;
export type CreateReminderBody = z.infer<typeof createReminderBodySchema>;
export type Event = z.infer<typeof eventSchema>;
export type EventDetail = z.infer<typeof eventDetailSchema>;
export type EventListResponse = z.infer<typeof eventListResponseSchema>;
export type MyRSVPsResponse = z.infer<typeof myRSVPsResponseSchema>;
