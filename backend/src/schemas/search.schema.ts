import { z } from 'zod';

// Query schemas
export const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  type: z.enum(['users', 'stories', 'all']).default('all'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const suggestionsQuerySchema = z.object({
  q: z.string().min(1).max(50),
  limit: z.coerce.number().min(1).max(10).default(5),
});

// Response schemas
export const searchUserSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellido: z.string().nullable(),
  avatar: z.string().nullable(),
  bio: z.string().nullable(),
  followersCount: z.number(),
});

export const searchStorySchema = z.object({
  id: z.string(),
  description: z.string(),
  mediaUrl: z.string(),
  mediaType: z.enum(['IMAGE', 'VIDEO']),
  thumbnailUrl: z.string().nullable(),
  location: z.string(),
  likesCount: z.number(),
  createdAt: z.date(),
  user: z.object({
    id: z.string(),
    nombre: z.string(),
    avatar: z.string().nullable(),
  }),
});

export const trendingHashtagSchema = z.object({
  hashtag: z.string(),
  count: z.number(),
});

export const searchResultsSchema = z.object({
  users: z.array(searchUserSchema),
  stories: z.array(searchStorySchema),
  hasMore: z.boolean(),
});

export const trendingResultsSchema = z.object({
  hashtags: z.array(trendingHashtagSchema),
  stories: z.array(searchStorySchema),
});

// Types
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SuggestionsQuery = z.infer<typeof suggestionsQuerySchema>;
export type SearchUser = z.infer<typeof searchUserSchema>;
export type SearchStory = z.infer<typeof searchStorySchema>;
export type TrendingHashtag = z.infer<typeof trendingHashtagSchema>;
export type SearchResults = z.infer<typeof searchResultsSchema>;
export type TrendingResults = z.infer<typeof trendingResultsSchema>;
