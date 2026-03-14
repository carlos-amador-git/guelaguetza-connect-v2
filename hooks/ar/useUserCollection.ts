import { useState, useEffect, useCallback, useRef } from 'react';
import type { GeoPosition, CollectPointResponse } from '../../types/ar';
import {
  cacheCollection,
  getCachedCollection,
  addPendingOperation,
} from '../../services/ar-offline';
import { syncPendingOperations } from '../../services/ar-sync';
import { checkOnlineStatus, subscribeToOnlineStatus } from '../../services/pwa';

const API_BASE = ((import.meta as { env: { VITE_API_URL?: string } }).env.VITE_API_URL || 'http://localhost:3001') + '/api';

// ============================================================================
// HOOK: COLECCIÓN DEL USUARIO
// Fetches /api/ar/collection, provides collectPoint function
// Falls back to IndexedDB when offline; queues ops for sync on reconnect
// ============================================================================

interface CollectionData {
  collected: { id: number; [key: string]: unknown }[];
  totalPoints: number;
  count: number;
}

interface UseUserCollectionReturn {
  collected: CollectionData['collected'];
  totalPoints: number;
  count: number;
  collectedIds: Set<number>;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  isStale: boolean;
  collectPoint: (
    pointId: number,
    position?: GeoPosition,
    screenshotUrl?: string
  ) => Promise<CollectPointResponse>;
  refresh: () => void;
}

export function useUserCollection(userId: string | null): UseUserCollectionReturn {
  const [data, setData] = useState<CollectionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isStale, setIsStale] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // ----- Fetch collection -----
  const fetchCollection = useCallback(async () => {
    if (!userId) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);

    // --- Try online ---
    try {
      const res = await fetch(`${API_BASE}/ar/collection?userId=${userId}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

      const json: CollectionData = await res.json();
      setData(json);
      setError(null);
      setIsOffline(false);
      setIsStale(false);

      // Cache in the background
      if (json.collected?.length) {
        const items = json.collected.map((item) => ({
          pointId: item.id,
          collectedAt: (item.collectedAt as string) || new Date().toISOString(),
        }));
        cacheCollection(userId, items).catch((err) => {
          if ((import.meta as { env: { DEV?: boolean } }).env.DEV) console.warn('[useUserCollection] Cache write failed:', err);
        });
      }

      setIsLoading(false);
      return;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      // Fall through to cache
    }

    // --- Try IndexedDB cache ---
    try {
      const cached = await getCachedCollection(userId);

      if (cached.length > 0) {
        setData({
          collected: cached.map((c) => ({ id: c.pointId, collectedAt: c.collectedAt })),
          totalPoints: 0, // not cached granularly
          count: cached.length,
        });
        setError(null);
        setIsOffline(true);
        setIsStale(true);
      } else {
        setError('Sin conexion y sin datos en cache');
        setIsOffline(true);
        setIsStale(false);
      }
    } catch {
      setError('Error al cargar la coleccion');
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refresh = useCallback(() => {
    fetchCollection();
  }, [fetchCollection]);

  // ----- Collect a point (offline-aware) -----
  const collectPoint = useCallback(
    async (
      pointId: number,
      position?: GeoPosition,
      screenshotUrl?: string
    ): Promise<CollectPointResponse> => {
      if (!userId) return { success: false, error: 'Usuario no identificado' };

      const online = checkOnlineStatus();

      // OFFLINE PATH — queue operation and apply optimistically
      if (!online) {
        await addPendingOperation({
          type: 'collect_point',
          payload: {
            userId,
            pointId,
            lat: position?.lat,
            lng: position?.lng,
            screenshotUrl,
          },
          createdAt: new Date().toISOString(),
          retryCount: 0,
        });

        // Optimistic local update
        setData((prev) => {
          if (!prev) {
            return {
              collected: [{ id: pointId, collectedAt: new Date().toISOString() }],
              totalPoints: 0,
              count: 1,
            };
          }

          const alreadyCollected = prev.collected.some((c) => c.id === pointId);
          if (alreadyCollected) return prev;

          return {
            ...prev,
            collected: [
              ...prev.collected,
              { id: pointId, collectedAt: new Date().toISOString() },
            ],
            count: prev.count + 1,
          };
        });

        return {
          success: true,
          pointsEarned: 0, // unknown offline
        };
      }

      // ONLINE PATH
      try {
        const res = await fetch(`${API_BASE}/ar/collection`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            pointId,
            lat: position?.lat,
            lng: position?.lng,
            screenshotUrl,
          }),
        });

        const result: CollectPointResponse = await res.json();

        if (result.success) {
          fetchCollection();
        }

        return result;
      } catch {
        // Network error during collection attempt — queue it
        await addPendingOperation({
          type: 'collect_point',
          payload: {
            userId,
            pointId,
            lat: position?.lat,
            lng: position?.lng,
            screenshotUrl,
          },
          createdAt: new Date().toISOString(),
          retryCount: 0,
        });

        return { success: true, pointsEarned: 0 };
      }
    },
    [userId, fetchCollection]
  );

  // ----- Sync on reconnect -----
  useEffect(() => {
    const unsubscribe = subscribeToOnlineStatus(async (online) => {
      setIsOffline(!online);

      if (online) {
        // Sync pending operations then refresh
        try {
          await syncPendingOperations();
        } catch (err) {
          if ((import.meta as { env: { DEV?: boolean } }).env.DEV) console.warn('[useUserCollection] Sync failed:', err);
        }
        fetchCollection();
      }
    });

    return unsubscribe;
  }, [fetchCollection]);

  // ----- Initial load -----
  useEffect(() => {
    fetchCollection();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchCollection]);

  const collectedIds = new Set<number>(
    data?.collected?.map((item) => item.id) || []
  );

  return {
    collected: data?.collected || [],
    totalPoints: data?.totalPoints || 0,
    count: data?.count || 0,
    collectedIds,
    isLoading,
    error,
    isOffline,
    isStale,
    collectPoint,
    refresh,
  };
}
