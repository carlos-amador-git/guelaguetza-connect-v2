import { api } from './api';

// Types
export type POICategory = 'CULTURAL' | 'GASTRONOMIA' | 'ARTESANIA' | 'EVENTO' | 'TRANSPORTE' | 'NATURALEZA';

export interface PointOfInterest {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  arModelUrl: string | null;
  category: POICategory;
  latitude: number;
  longitude: number;
  address: string | null;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  createdAt: string;
  distance?: number;
  isFavorite?: boolean;
  hasCheckedIn?: boolean;
  _count?: {
    reviews: number;
    favorites: number;
    checkIns: number;
  };
}

export interface POIReview {
  id: string;
  userId: string;
  poiId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    nombre: string;
    avatar: string | null;
  };
}

export interface POICheckIn {
  id: string;
  userId: string;
  poiId: string;
  createdAt: string;
  poi: PointOfInterest;
}

export interface POIQuery {
  category?: POICategory;
  search?: string;
  page?: number;
  limit?: number;
}

export interface NearbyPOIQuery {
  latitude: number;
  longitude: number;
  radius?: number;
  category?: POICategory;
  limit?: number;
}

// API Functions
export async function getPOIs(query: POIQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });

  const response = await api.get<{
    pois: PointOfInterest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/poi?${params}`);
  return response;
}

export async function getNearbyPOIs(query: NearbyPOIQuery) {
  const params = new URLSearchParams({
    latitude: String(query.latitude),
    longitude: String(query.longitude),
  });
  if (query.radius) params.append('radius', String(query.radius));
  if (query.category) params.append('category', query.category);
  if (query.limit) params.append('limit', String(query.limit));

  const response = await api.get<PointOfInterest[]>(`/poi/nearby?${params}`);
  return response;
}

export async function getPOI(id: string) {
  const response = await api.get<PointOfInterest & { reviews: POIReview[] }>(`/poi/${id}`);
  return response;
}

export async function toggleFavorite(poiId: string) {
  const response = await api.post<{ isFavorite: boolean }>(`/poi/${poiId}/favorite`, {});
  return response;
}

export async function checkIn(poiId: string) {
  const response = await api.post<POICheckIn>(`/poi/${poiId}/checkin`, {});
  return response;
}

export async function createPOIReview(poiId: string, data: { rating: number; comment?: string }) {
  const response = await api.post<POIReview>(`/poi/${poiId}/reviews`, data);
  return response;
}

export async function getUserFavorites() {
  const response = await api.get<PointOfInterest[]>('/poi/user/favorites');
  return response;
}

export async function getUserCheckIns() {
  const response = await api.get<POICheckIn[]>('/poi/user/checkins');
  return response;
}

// Helpers
export const CATEGORY_LABELS: Record<POICategory, string> = {
  CULTURAL: 'Cultural',
  GASTRONOMIA: 'Gastronomia',
  ARTESANIA: 'Artesania',
  EVENTO: 'Evento',
  TRANSPORTE: 'Transporte',
  NATURALEZA: 'Naturaleza',
};

export const CATEGORY_ICONS: Record<POICategory, string> = {
  CULTURAL: 'landmark',
  GASTRONOMIA: 'utensils',
  ARTESANIA: 'palette',
  EVENTO: 'calendar',
  TRANSPORTE: 'bus',
  NATURALEZA: 'tree',
};

export const CATEGORY_COLORS: Record<POICategory, string> = {
  CULTURAL: '#8B5CF6',
  GASTRONOMIA: '#F59E0B',
  ARTESANIA: '#EC4899',
  EVENTO: '#10B981',
  TRANSPORTE: '#3B82F6',
  NATURALEZA: '#22C55E',
};

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}
