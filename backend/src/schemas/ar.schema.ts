import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const PointTypeEnum = z.enum([
  'character',
  'monument',
  'quest_item',
  'info',
  'easter_egg',
  'event',
]);

export const TrackingTypeEnum = z.enum([
  'head',
  'face',
  'upper_body',
  'full_body',
  'hand',
  'ground',
  'vertical',
]);

export const VestimentaCategoriaEnum = z.enum([
  'traje_completo',
  'cabeza',
  'torso',
  'falda',
  'accesorio',
  'calzado',
  'mano',
]);

export const AchievementTypeEnum = z.enum([
  'collect_count',
  'collect_all',
  'collect_region',
  'complete_quest',
  'first_action',
  'time_based',
  'creation',
]);

// ============================================================================
// REGION
// ============================================================================

export const RegionSchema = z.object({
  id: z.number().int(),
  codigo: z.string(),
  nombre: z.string(),
  nombreCorto: z.string().optional().nullable(),
  descripcion: z.string().optional().nullable(),
  colorPrimario: z.string(),
  colorSecundario: z.string().optional().nullable(),
  imagenUrl: z.string().url().optional().nullable(),
  escudoUrl: z.string().url().optional().nullable(),
  iconoUrl: z.string().url().optional().nullable(),
  ordenDisplay: z.number().int(),
  active: z.boolean(),
});

// ============================================================================
// AR POINT
// ============================================================================

export const ARPointSchema = z.object({
  id: z.number().int(),
  uuid: z.string().uuid(),
  codigo: z.string(),
  nombre: z.string(),
  nombreCorto: z.string().optional().nullable(),
  descripcion: z.string().optional().nullable(),
  narrativa: z.string().optional().nullable(),
  tipo: PointTypeEnum,
  regionId: z.number().int().optional().nullable(),
  questId: z.number().int().optional().nullable(),
  questOrden: z.number().int().optional().nullable(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  altitudeMeters: z.number().optional().nullable(),
  activationRadiusMeters: z.number().int().positive(),
  trackingType: TrackingTypeEnum,
  vpsAnchorId: z.string().optional().nullable(),
  assetPrincipalId: z.number().int().optional().nullable(),
  assetAudioId: z.number().int().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  isCollectible: z.boolean(),
  pointsValue: z.number().int(),
  color: z.string().optional().nullable(),
  emoji: z.string().optional().nullable(),
  active: z.boolean(),
  featured: z.boolean(),
});

export const ARPointWithDistanceSchema = ARPointSchema.extend({
  distanceMeters: z.number(),
  isWithinActivation: z.boolean(),
  region: RegionSchema.optional().nullable(),
  modelUrl: z.string().url().optional().nullable(),
  modelUrlIos: z.string().url().optional().nullable(),
});

// ============================================================================
// QUEST
// ============================================================================

export const QuestSchema = z.object({
  id: z.number().int(),
  codigo: z.string(),
  nombre: z.string(),
  descripcion: z.string().optional().nullable(),
  narrativa: z.string().optional().nullable(),
  totalItems: z.number().int(),
  ordenRequerido: z.boolean(),
  tiempoLimiteMinutos: z.number().int().optional().nullable(),
  rewardPoints: z.number().int(),
  rewardDescription: z.string().optional().nullable(),
  iconoUrl: z.string().url().optional().nullable(),
  imagenPortadaUrl: z.string().url().optional().nullable(),
  fechaInicio: z.string().optional().nullable(),
  fechaFin: z.string().optional().nullable(),
  active: z.boolean(),
});

// ============================================================================
// VESTIMENTA
// ============================================================================

export const VestimentaSchema = z.object({
  id: z.number().int(),
  uuid: z.string().uuid(),
  codigo: z.string(),
  nombre: z.string(),
  nombreTradicional: z.string().optional().nullable(),
  descripcion: z.string().optional().nullable(),
  datosCulturales: z.string().optional().nullable(),
  regionId: z.number().int().optional().nullable(),
  categoria: VestimentaCategoriaEnum,
  genero: z.enum(['masculino', 'femenino', 'unisex']),
  assetId: z.number().int().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  previewGifUrl: z.string().url().optional().nullable(),
  trackingType: TrackingTypeEnum,
  tieneFisicaTela: z.boolean(),
  rigidez: z.number(),
  notasTecnicas: z.string().optional().nullable(),
  artesanoNombre: z.string().optional().nullable(),
  artesanoComunidad: z.string().optional().nullable(),
  artesanoUrl: z.string().url().optional().nullable(),
  precioAproximado: z.number().optional().nullable(),
  esSetCompleto: z.boolean(),
  setItems: z.array(z.number().int()).optional().nullable(),
  active: z.boolean(),
  featured: z.boolean(),
});

// ============================================================================
// ACHIEVEMENT
// ============================================================================

export const AchievementSchema = z.object({
  id: z.number().int(),
  codigo: z.string(),
  nombre: z.string(),
  descripcion: z.string().optional().nullable(),
  tipo: AchievementTypeEnum,
  requisitos: z.record(z.unknown()),
  pointsReward: z.number().int(),
  badgeUrl: z.string().url().optional().nullable(),
  rewardAssetId: z.number().int().optional().nullable(),
  categoria: z.string().optional().nullable(),
  dificultad: z.enum(['facil', 'normal', 'dificil']),
  active: z.boolean(),
});

// ============================================================================
// USER COLLECTION
// ============================================================================

export const UserCollectionSchema = z.object({
  id: z.number().int(),
  userId: z.string(),
  pointId: z.number().int(),
  collectedAt: z.string(),
  screenshotUrl: z.string().url().optional().nullable(),
  point: ARPointSchema.optional().nullable(),
});

// ============================================================================
// USER PROGRESS
// ============================================================================

export const UserProgressSchema = z.object({
  userId: z.string(),
  totalCollected: z.number().int(),
  totalAvailable: z.number().int(),
  percentageComplete: z.number(),
  totalPoints: z.number().int(),
  achievementsUnlocked: z.number().int(),
  firstCollection: z.string().optional().nullable(),
  lastCollection: z.string().optional().nullable(),
  collectionByRegion: z.array(
    z.object({
      regionId: z.number().int(),
      regionNombre: z.string(),
      regionColor: z.string(),
      collected: z.number().int(),
      total: z.number().int(),
    })
  ),
});

// ============================================================================
// LEADERBOARD
// ============================================================================

export const LeaderboardEntrySchema = z.object({
  userId: z.string(),
  displayName: z.string().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  itemsCollected: z.number().int(),
  totalPoints: z.number().int(),
  achievements: z.number().int(),
  ranking: z.number().int(),
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

export const NearbyPointsResponseSchema = z.object({
  count: z.number().int(),
  points: z.array(ARPointWithDistanceSchema),
});

export const CollectPointResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  pointsEarned: z.number().int().optional(),
  totalCollected: z.number().int().optional(),
  newAchievements: z.array(AchievementSchema).optional(),
  questProgress: z
    .object({
      questId: z.number().int(),
      itemsCollected: z.number().int(),
      totalItems: z.number().int(),
      completed: z.boolean(),
    })
    .optional(),
});

export const VestimentaCatalogResponseSchema = z.object({
  count: z.number().int(),
  vestimentas: z.array(
    VestimentaSchema.extend({
      region: RegionSchema.optional().nullable(),
      modelUrl: z.string().url().optional().nullable(),
      modelUrlIos: z.string().url().optional().nullable(),
    })
  ),
});

// ============================================================================
// REQUEST QUERY / BODY SCHEMAS
// ============================================================================

export const NearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(10).max(5000).default(500),
});

export const PointsQuerySchema = z.object({
  tipo: PointTypeEnum.optional(),
  region: z.string().optional(),
  quest: z.coerce.number().int().positive().optional(),
  collectible: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

export const CollectPointBodySchema = z.object({
  pointId: z.number().int().positive(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  screenshotUrl: z.string().url().optional(),
});

export const VestimentasQuerySchema = z.object({
  region: z.string().optional(),
  categoria: VestimentaCategoriaEnum.optional(),
  genero: z.enum(['masculino', 'femenino', 'unisex']).optional(),
  trackingType: TrackingTypeEnum.optional(),
  featured: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

export const FavoriteBodySchema = z.object({
  vestimentaId: z.number().int().positive(),
  screenshotUrl: z.string().url().optional(),
});

export const ProgressQuerySchema = z.object({
  userId: z.string().min(1),
});

export const CollectionQuerySchema = z.object({
  userId: z.string().min(1),
  idsOnly: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type NearbyQuery = z.infer<typeof NearbyQuerySchema>;
export type PointsQuery = z.infer<typeof PointsQuerySchema>;
export type CollectPointBody = z.infer<typeof CollectPointBodySchema>;
export type VestimentasQuery = z.infer<typeof VestimentasQuerySchema>;
export type FavoriteBody = z.infer<typeof FavoriteBodySchema>;
export type ProgressQuery = z.infer<typeof ProgressQuerySchema>;
export type CollectionQuery = z.infer<typeof CollectionQuerySchema>;
