// ============================================================================
// useOfflineAR — Sprint 1.0
// Generic hook that wraps online/offline logic with IndexedDB fallback
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseOfflineARResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  isStale: boolean;
  refresh: () => void;
}

/**
 * Wraps an async fetch with an IndexedDB cache.
 *
 * Strategy:
 *   1. Try fetchOnline() — on success cache and return fresh data.
 *   2. On network failure — try cacheRead() and return stale cached data.
 *   3. If both fail — return error state.
 *
 * @param fetchOnline  Function that fetches fresh data from the API
 * @param cacheKey     A stable string key (used for deduplication in effects)
 * @param cacheRead    Function that reads from IndexedDB
 * @param cacheWrite   Function that writes to IndexedDB after a fresh fetch
 */
export function useOfflineAR<T>(
  fetchOnline: () => Promise<T>,
  cacheKey: string,
  cacheRead: () => Promise<T | undefined>,
  cacheWrite: (data: T) => Promise<void>
): UseOfflineARResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isStale, setIsStale] = useState(false);

  // Keep latest callbacks in refs to avoid stale closures in the effect
  const fetchOnlineRef = useRef(fetchOnline);
  const cacheReadRef = useRef(cacheRead);
  const cacheWriteRef = useRef(cacheWrite);

  useEffect(() => { fetchOnlineRef.current = fetchOnline; }, [fetchOnline]);
  useEffect(() => { cacheReadRef.current = cacheRead; }, [cacheRead]);
  useEffect(() => { cacheWriteRef.current = cacheWrite; }, [cacheWrite]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // --- Step 1: try online ---
    try {
      const fresh = await fetchOnlineRef.current();
      setData(fresh);
      setIsOffline(false);
      setIsStale(false);

      // Write to cache in the background — do not await to keep UI snappy
      cacheWriteRef.current(fresh).catch((err) => {
        if ((import.meta as { env: { DEV?: boolean } }).env.DEV) console.warn('[useOfflineAR] Cache write failed:', err);
      });

      setIsLoading(false);
      return;
    } catch {
      // Network error or non-2xx — fall through to cache
    }

    // --- Step 2: try IndexedDB cache ---
    try {
      const cached = await cacheReadRef.current();

      if (cached !== undefined) {
        setData(cached);
        setIsOffline(true);
        setIsStale(true);
        setError(null);
      } else {
        setData(null);
        setIsOffline(true);
        setIsStale(false);
        setError('Sin conexion y sin datos en cache');
      }
    } catch (cacheErr) {
      const msg = cacheErr instanceof Error ? cacheErr.message : 'Error al leer cache';
      setError(msg);
      setIsOffline(true);
      setIsStale(false);
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps
  // cacheKey is the only dep that signals "this hook instance changed"

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, isOffline, isStale, refresh: load };
}
