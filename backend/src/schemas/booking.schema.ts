import { z } from 'zod';

// Enums matching Prisma
export const ExperienceCategoryEnum = z.enum([
  'TOUR',
  'TALLER',
  'DEGUSTACION',
  'CLASE',
  'VISITA',
]);

export const BookingStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
]);

// Experience schemas
export const CreateExperienceSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).optional().default([]),
  category: ExperienceCategoryEnum,
  price: z.number().positive(),
  duration: z.number().int().positive(), // minutes
  maxCapacity: z.number().int().positive(),
  location: z.string().min(3).max(200),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  includes: z.array(z.string()).optional().default([]),
  languages: z.array(z.string()).optional().default(['Español']),
});

export const UpdateExperienceSchema = CreateExperienceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Time slot schemas
export const CreateTimeSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  startTime: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  capacity: z.number().int().positive().optional(),
});

export const CreateMultipleTimeSlotsSchema = z.object({
  slots: z.array(CreateTimeSlotSchema).min(1),
});

// Booking schemas
export const CreateBookingSchema = z.object({
  experienceId: z.string().cuid(),
  timeSlotId: z.string().cuid(),
  guestCount: z.number().int().positive().default(1),
  specialRequests: z.string().max(500).optional(),
});

export const UpdateBookingStatusSchema = z.object({
  status: BookingStatusEnum,
});

// Query schemas
export const ExperienceQuerySchema = z.object({
  category: ExperienceCategoryEnum.optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export const TimeSlotQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const BookingQuerySchema = z.object({
  status: BookingStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

// Review schema
export const CreateExperienceReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// Types
export type CreateExperienceInput = z.infer<typeof CreateExperienceSchema>;
export type UpdateExperienceInput = z.infer<typeof UpdateExperienceSchema>;
export type CreateTimeSlotInput = z.infer<typeof CreateTimeSlotSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type ExperienceQuery = z.infer<typeof ExperienceQuerySchema>;
export type TimeSlotQuery = z.infer<typeof TimeSlotQuerySchema>;
export type BookingQuery = z.infer<typeof BookingQuerySchema>;
export type CreateExperienceReviewInput = z.infer<typeof CreateExperienceReviewSchema>;
