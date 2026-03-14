import { useState, useEffect, useCallback, useRef } from 'react';
import type { Vestimenta } from '../../types/ar';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

// ============================================================================
// HOOK: FAVORITOS DE VESTIMENTAS
// Fetches /api/ar/vestimentas/favorites, toggle function
// ============================================================================

interface UseFavoritesReturn {
  favorites: Vestimenta[];
  favoriteIds: Set<number>;
  isLoading: boolean;
  error: string | null;
  toggleFavorite: (vestimentaId: number, screenshotUrl?: string) => Promise<boolean>;
  refresh: () => void;
}

export function useFavorites(userId: string | null): UseFavoritesReturn {
  const [data, setData] = useState<Vestimenta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchFavorites = useCallback(async () => {
    if (!userId) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ar/vestimentas/favorites?userId=${userId}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

      const json: Vestimenta[] = await res.json();
      setData(json);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Error al cargar favoritos');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refresh = useCallback(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const favoriteIds = new Set<number>(data.map((item) => item.id));

  const toggleFavorite = useCallback(
    async (vestimentaId: number, screenshotUrl?: string): Promise<boolean> => {
      if (!userId) return false;

      const isFav = favoriteIds.has(vestimentaId);
      const method = isFav ? 'DELETE' : 'POST';

      try {
        await fetch(`${API_BASE}/ar/vestimentas/favorites`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, vestimentaId, screenshotUrl }),
        });

        fetchFavorites();
        return true;
      } catch {
        return false;
      }
    },
    [userId, favoriteIds, fetchFavorites]
  );

  useEffect(() => {
    fetchFavorites();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchFavorites]);

  return {
    favorites: data,
    favoriteIds,
    isLoading,
    error,
    toggleFavorite,
    refresh,
  };
}
