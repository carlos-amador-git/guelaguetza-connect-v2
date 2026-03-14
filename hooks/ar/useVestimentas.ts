import { useState, useEffect, useCallback, useRef } from 'react';
import type { Vestimenta, Region, VestimentaCatalogResponse } from '../../types/ar';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

// ============================================================================
// HOOK: CATÁLOGO DE VESTIMENTAS
// Fetches /api/ar/vestimentas with filters
// ============================================================================

interface UseVestimentasOptions {
  region?: string;
  categoria?: string;
  genero?: string;
  featuredOnly?: boolean;
}

interface UseVestimentasReturn {
  vestimentas: (Vestimenta & { region?: Region; modelUrl?: string; modelUrlIos?: string })[];
  count: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useVestimentas(options: UseVestimentasOptions = {}): UseVestimentasReturn {
  const { region, categoria, genero, featuredOnly } = options;

  const [data, setData] = useState<VestimentaCatalogResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (region) params.set('region', region);
    if (categoria) params.set('categoria', categoria);
    if (genero) params.set('genero', genero);
    if (featuredOnly) params.set('featured', 'true');

    const queryString = params.toString();
    return `${API_BASE}/ar/vestimentas${queryString ? `?${queryString}` : ''}`;
  }, [region, categoria, genero, featuredOnly]);

  const fetchVestimentas = useCallback(async () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);

    try {
      const res = await fetch(buildUrl(), { signal: abortControllerRef.current.signal });

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

      const json: VestimentaCatalogResponse = await res.json();
      setData(json);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Error al cargar vestimentas');
    } finally {
      setIsLoading(false);
    }
  }, [buildUrl]);

  const refresh = useCallback(() => {
    fetchVestimentas();
  }, [fetchVestimentas]);

  useEffect(() => {
    fetchVestimentas();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchVestimentas]);

  return {
    vestimentas: data?.vestimentas || [],
    count: data?.count || 0,
    isLoading,
    error,
    refresh,
  };
}
