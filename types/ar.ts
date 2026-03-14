// ============================================================================
// AR MODULE TYPES — Sprint 0.2
// Reflects the PostgreSQL database schema for the AR module
// ============================================================================

import type React from 'react';

// Enums matching PostgreSQL types
export type PointType = 'character' | 'monument' | 'quest_item' | 'info' | 'easter_egg' | 'event';
export type AssetType = 'model_3d' | 'audio' | 'image' | 'video' | 'animation';
export type VestimentaCategoria = 'traje_completo' | 'cabeza' | 'torso' | 'falda' | 'accesorio' | 'calzado' | 'mano';
export type TrackingType = 'head' | 'face' | 'upper_body' | 'full_body' | 'hand' | 'ground' | 'vertical';
export type AchievementType = 'collect_count' | 'collect_all' | 'collect_region' | 'complete_quest' | 'first_action' | 'time_based' | 'creation';

// ============================================================================
// MAIN INTERFACES
// ============================================================================

export interface Region {
  id: number;
  codigo: string;
  nombre: string;
  nombreCorto?: string;
  descripcion?: string;
  colorPrimario: string;
  colorSecundario?: string;
  imagenUrl?: string;
  escudoUrl?: string;
  iconoUrl?: string;
  ordenDisplay: number;
  active: boolean;
}

export interface Asset {
  id: number;
  uuid: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: AssetType;
  urlGlb?: string;
  urlUsdz?: string;
  urlThumbnail?: string;
  urlPreview?: string;
  sizeBytes?: number;
  polycount?: number;
  isEssential: boolean;
  isPremium: boolean;
  active: boolean;
}

export interface ARPoint {
  id: number;
  uuid: string;
  codigo: string;
  nombre: string;
  nombreCorto?: string;
  descripcion?: string;
  narrativa?: string;
  tipo: PointType;
  regionId?: number;
  questId?: number;
  questOrden?: number;
  // Coordinates (extracted from PostGIS)
  lat: number;
  lng: number;
  altitudeMeters?: number;
  // Configuration
  activationRadiusMeters: number;
  trackingType: TrackingType;
  vpsAnchorId?: string;
  // Assets
  assetPrincipalId?: number;
  assetAudioId?: number;
  thumbnailUrl?: string;
  // Gamification
  isCollectible: boolean;
  pointsValue: number;
  // Visual
  color?: string;
  emoji?: string;
  // State
  active: boolean;
  featured: boolean;
}

export interface Quest {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  narrativa?: string;
  totalItems: number;
  ordenRequerido: boolean;
  tiempoLimiteMinutos?: number;
  rewardPoints: number;
  rewardDescription?: string;
  iconoUrl?: string;
  imagenPortadaUrl?: string;
  fechaInicio?: string;
  fechaFin?: string;
  active: boolean;
}

export interface Vestimenta {
  id: number;
  uuid: string;
  codigo: string;
  nombre: string;
  nombreTradicional?: string;
  descripcion?: string;
  datosCulturales?: string;
  regionId?: number;
  categoria: VestimentaCategoria;
  genero: 'masculino' | 'femenino' | 'unisex';
  assetId?: number;
  thumbnailUrl?: string;
  previewGifUrl?: string;
  trackingType: TrackingType;
  tieneFisicaTela: boolean;
  rigidez: number;
  notasTecnicas?: string;
  artesanoNombre?: string;
  artesanoComunidad?: string;
  artesanoUrl?: string;
  precioAproximado?: number;
  esSetCompleto: boolean;
  setItems?: number[];
  active: boolean;
  featured: boolean;
}

export interface Artesania {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  regionId?: number;
  comunidadOrigen?: string;
  assetId?: number;
  imagenOriginalUrl?: string;
  thumbnailUrl?: string;
  aiPrompt?: string;
  aiStyle?: string;
  usoEnApp?: string;
  artesanoNombre?: string;
  artesanoUrl?: string;
  active: boolean;
}

export interface Achievement {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: AchievementType;
  requisitos: Record<string, unknown>;
  pointsReward: number;
  badgeUrl?: string;
  rewardAssetId?: number;
  categoria?: string;
  dificultad: 'facil' | 'normal' | 'dificil';
  active: boolean;
}

export interface WifiZone {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: 'publico' | 'comercial' | 'cultural';
  lat: number;
  lng: number;
  direccion?: string;
  horario?: string;
  velocidadEstimada?: 'alta' | 'media' | 'baja';
  requierePassword: boolean;
  verificado: boolean;
  active: boolean;
}

// ============================================================================
// USER INTERFACES
// ============================================================================

export interface UserProfile {
  id: number;
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  preferencias: Record<string, unknown>;
  idioma: string;
  totalPoints: number;
  totalCollected: number;
  totalAchievements: number;
  createdAt: string;
  lastActiveAt?: string;
}

export interface UserCollection {
  id: number;
  userId: string;
  pointId: number;
  collectedAt: string;
  screenshotUrl?: string;
  // Point data (joined)
  point?: ARPoint;
}

export interface UserQuestProgress {
  id: number;
  userId: string;
  questId: number;
  itemsCollected: number;
  startedAt: string;
  completedAt?: string;
  itemsFound: number[];
  // Quest data (joined)
  quest?: Quest;
}

export interface UserAchievement {
  userId: string;
  achievementId: number;
  unlockedAt: string;
  notified: boolean;
  // Achievement data (joined)
  achievement?: Achievement;
}

export interface UserCreation {
  id: number;
  uuid: string;
  userId?: string;
  imagenOriginalUrl?: string;
  modelUrlGlb?: string;
  modelUrlUsdz?: string;
  thumbnailUrl?: string;
  aiService?: string;
  aiTaskId?: string;
  generationTimeSeconds?: number;
  nombreCreacion?: string;
  esPublico: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

export interface NearbyPointsResponse {
  count: number;
  points: (ARPoint & {
    distanceMeters: number;
    isWithinActivation: boolean;
    region?: Region;
    modelUrl?: string;
  })[];
}

export interface CollectPointResponse {
  success: boolean;
  error?: string;
  pointsEarned?: number;
  totalCollected?: number;
  newAchievements?: Achievement[];
  questProgress?: {
    questId: number;
    itemsCollected: number;
    totalItems: number;
    completed: boolean;
  };
}

export interface UserProgressResponse {
  userId: string;
  totalCollected: number;
  totalAvailable: number;
  percentageComplete: number;
  totalPoints: number;
  achievementsUnlocked: number;
  firstCollection?: string;
  lastCollection?: string;
  collectionByRegion: {
    regionId: number;
    regionNombre: string;
    regionColor: string;
    collected: number;
    total: number;
  }[];
}

export interface LeaderboardEntry {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  itemsCollected: number;
  totalPoints: number;
  achievements: number;
  ranking: number;
}

export interface VestimentaCatalogResponse {
  count: number;
  vestimentas: (Vestimenta & {
    region?: Region;
    modelUrl?: string;
    modelUrlIos?: string;
  })[];
}

export interface ImageTo3DRequest {
  image: string; // Base64
  style?: 'realistic' | 'cartoon' | 'stylized';
  userId?: string;
  nombreCreacion?: string;
}

export interface ImageTo3DResponse {
  success: boolean;
  taskId?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  modelUrl?: string;
  modelUrlUsdz?: string;
  thumbnailUrl?: string;
  error?: string;
}

// ============================================================================
// LOCAL STATE INTERFACES
// ============================================================================

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading?: number;
  timestamp: number;
}

export interface ARState {
  // User position
  position: GeoPosition | null;
  positionError: string | null;
  isWatching: boolean;

  // Nearby points
  nearbyPoints: ARPoint[];
  activePoint: ARPoint | null;

  // User collection
  collectedIds: Set<number>;
  totalPoints: number;

  // UI State
  isARActive: boolean;
  isLoading: boolean;

  // Offline
  isOffline: boolean;
  cachedAssets: string[];
}

export interface TryOnState {
  selectedVestimenta: Vestimenta | null;
  selectedItems: Vestimenta[];
  isTrackingActive: boolean;
  capturedPhotos: string[];
}

// ============================================================================
// COMPONENT PROP INTERFACES
// ============================================================================

export interface ModelViewerProps {
  src: string;
  iosSrc?: string;
  poster?: string;
  alt: string;
  autoRotate?: boolean;
  cameraControls?: boolean;
  ar?: boolean;
  arModes?: string;
  onARStart?: () => void;
  onAREnd?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export interface ARPointCardProps {
  point: ARPoint & { distanceMeters?: number; region?: Region };
  isCollected: boolean;
  onSelect?: (point: ARPoint) => void;
  compact?: boolean;
}

export interface VestimentaCardProps {
  vestimenta: Vestimenta & { region?: Region };
  isFavorite?: boolean;
  onSelect?: (vestimenta: Vestimenta) => void;
  onToggleFavorite?: (vestimenta: Vestimenta) => void;
}

export interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};

export type WithRegion<T> = T & { region?: Region };
export type WithAsset<T> = T & { asset?: Asset };
export type WithDistance<T> = T & { distanceMeters: number };
