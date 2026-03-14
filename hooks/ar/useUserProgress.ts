import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserProgressResponse } from '../../types/ar';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

// ============================================================================
// HOOK: PROGRESO DEL USUARIO
// Fetches /api/ar/progress
// ============================================================================

interface UseUserProgressReturn {
  progress: UserProgressResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useUserProgress(userId: string | null): UseUserProgressReturn {
  const [data, setData] = useState<UserProgressResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!userId) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ar/progress?userId=${userId}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

      const json: UserProgressResponse = await res.json();
      setData(json);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Error al cargar el progreso');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refresh = useCallback(() => {
    fetchProgress();
  }, [fetchProgress]);

  useEffect(() => {
    fetchProgress();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchProgress]);

  return {
    progress: data,
    isLoading,
    error,
    refresh,
  };
}
