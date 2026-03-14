import type {
  ARPoint,
  NearbyPointsResponse,
  CollectPointResponse,
  UserProgressResponse,
  VestimentaCatalogResponse,
  Vestimenta,
  Region,
  ApiResponse,
} from '../types/ar';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

// ============================================================================
// HELPERS
// ============================================================================

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    return { status: res.status, error: errorText };
  }

  try {
    const data: T = await res.json();
    return { status: res.status, data };
  } catch {
    return { status: res.status, error: 'Respuesta no válida del servidor' };
  }
}

// ============================================================================
// AR POINTS
// ============================================================================

/**
 * Fetch AR points near a given position.
 */
export async function fetchNearbyPoints(
  lat: number,
  lng: number,
  radius = 500
): Promise<ApiResponse<NearbyPointsResponse>> {
  const res = await fetch(
    `${API_BASE}/ar/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
  );
  return handleResponse<NearbyPointsResponse>(res);
}

interface FetchAllPointsFilters {
  tipo?: string;
  regionId?: number;
  featured?: boolean;
  active?: boolean;
}

/**
 * Fetch all AR points with optional filters.
 */
export async function fetchAllPoints(
  filters: FetchAllPointsFilters = {}
): Promise<ApiResponse<{ count: number; points: ARPoint[] }>> {
  const params = new URLSearchParams();
  if (filters.tipo) params.set('tipo', filters.tipo);
  if (filters.regionId) params.set('regionId', String(filters.regionId));
  if (filters.featured !== undefined) params.set('featured', String(filters.featured));
  if (filters.active !== undefined) params.set('active', String(filters.active));

  const queryString = params.toString();
  const url = `${API_BASE}/ar/points${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url);
  return handleResponse<{ count: number; points: ARPoint[] }>(res);
}

/**
 * Fetch a single AR point by ID.
 */
export async function fetchPointById(
  id: number
): Promise<ApiResponse<ARPoint & { region?: Region }>> {
  const res = await fetch(`${API_BASE}/ar/points/${id}`);
  return handleResponse<ARPoint & { region?: Region }>(res);
}

/**
 * Collect an AR point for a user.
 */
export async function collectPoint(
  userId: string,
  pointId: number,
  location?: { lat: number; lng: number },
  screenshotUrl?: string
): Promise<ApiResponse<CollectPointResponse>> {
  const res = await fetch(`${API_BASE}/ar/collection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      pointId,
      lat: location?.lat,
      lng: location?.lng,
      screenshotUrl,
    }),
  });
  return handleResponse<CollectPointResponse>(res);
}

// ============================================================================
// USER COLLECTION & PROGRESS
// ============================================================================

/**
 * Fetch the full collection for a user.
 */
export async function fetchUserCollection(
  userId: string
): Promise<
  ApiResponse<{
    collected: (ARPoint & { collectedAt: string; screenshotUrl?: string })[];
    totalPoints: number;
    count: number;
  }>
> {
  const res = await fetch(`${API_BASE}/ar/collection?userId=${userId}`);
  return handleResponse(res);
}

/**
 * Fetch overall progress for a user.
 */
export async function fetchUserProgress(
  userId: string
): Promise<ApiResponse<UserProgressResponse>> {
  const res = await fetch(`${API_BASE}/ar/progress?userId=${userId}`);
  return handleResponse<UserProgressResponse>(res);
}

// ============================================================================
// VESTIMENTAS
// ============================================================================

interface VestimentasFilters {
  region?: string;
  categoria?: string;
  genero?: string;
  featuredOnly?: boolean;
}

/**
 * Fetch the vestimentas catalog with optional filters.
 */
export async function fetchVestimentas(
  filters: VestimentasFilters = {}
): Promise<ApiResponse<VestimentaCatalogResponse>> {
  const params = new URLSearchParams();
  if (filters.region) params.set('region', filters.region);
  if (filters.categoria) params.set('categoria', filters.categoria);
  if (filters.genero) params.set('genero', filters.genero);
  if (filters.featuredOnly) params.set('featured', 'true');

  const queryString = params.toString();
  const url = `${API_BASE}/ar/vestimentas${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url);
  return handleResponse<VestimentaCatalogResponse>(res);
}

/**
 * Fetch a single vestimenta by ID.
 */
export async function fetchVestimentaById(
  id: number
): Promise<ApiResponse<Vestimenta & { region?: Region; modelUrl?: string; modelUrlIos?: string }>> {
  const res = await fetch(`${API_BASE}/ar/vestimentas/${id}`);
  return handleResponse(res);
}

/**
 * Toggle a vestimenta as favorite for a user.
 * Uses POST to add, DELETE to remove.
 */
export async function toggleFavorite(
  userId: string,
  vestimentaId: number,
  screenshotUrl?: string
): Promise<ApiResponse<{ success: boolean; isFavorite: boolean }>> {
  // First, check if already a favorite by attempting delete; 404 means it wasn't — add it.
  // The API contract: POST adds, DELETE removes.
  // We let the caller track state and call with the correct intent via the hook layer.
  const res = await fetch(`${API_BASE}/ar/vestimentas/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, vestimentaId, screenshotUrl }),
  });
  return handleResponse(res);
}

// ============================================================================
// REGIONS
// ============================================================================

/**
 * Fetch all active regions.
 */
export async function fetchRegions(): Promise<ApiResponse<Region[]>> {
  const res = await fetch(`${API_BASE}/ar/regions`);
  return handleResponse<Region[]>(res);
}
