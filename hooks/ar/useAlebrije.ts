import { useState, useEffect, useCallback } from 'react';
import type { ImageTo3DResponse, UserCreation } from '../../types/ar';

// ============================================================================
// HOOK: useAlebrije
// Manages Alebrije generation lifecycle:
//   - generate()    → calls POST /api/ar/alebrije/generate
//   - checkStatus() → calls GET  /api/ar/alebrije/status/:taskId
//   - gallery       → calls GET  /api/ar/alebrije/gallery?userId=X
// Sprint 3.2
// ============================================================================

const API_BASE =
  ((import.meta as { env: { VITE_API_URL?: string } }).env.VITE_API_URL ||
    'http://localhost:3001') + '/api';

export interface UseAlebrijeReturn {
  generate: (image: string, style?: string, name?: string) => Promise<string>;
  checkStatus: (taskId: string) => Promise<ImageTo3DResponse>;
  gallery: UserCreation[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAlebrije(userId: string | null): UseAlebrijeReturn {
  const [gallery, setGallery] = useState<UserCreation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch gallery
  // ---------------------------------------------------------------------------
  const fetchGallery = useCallback(async () => {
    if (!userId) {
      setGallery([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/ar/alebrije/gallery?userId=${encodeURIComponent(userId)}`
      );

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const json: { count: number; creations: UserCreation[] } = await res.json();
      setGallery(json.creations ?? []);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error al cargar la galeria';
      setError(msg);
      // Non-fatal: gallery stays empty but hook is still usable
      setGallery([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refresh = useCallback(() => {
    fetchGallery();
  }, [fetchGallery]);

  // Load gallery on mount / userId change
  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  // ---------------------------------------------------------------------------
  // Generate — POST /api/ar/alebrije/generate
  // Returns the taskId assigned by the server
  // ---------------------------------------------------------------------------
  const generate = useCallback(
    async (image: string, style?: string, name?: string): Promise<string> => {
      setError(null);

      const body: Record<string, string> = { image };
      if (style) body.style = style;
      if (userId) body.userId = userId;
      if (name) body.nombreCreacion = name;

      const res = await fetch(`${API_BASE}/ar/alebrije/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Error ${res.status}: ${text || res.statusText}`);
      }

      const json: { taskId: string } = await res.json();
      return json.taskId;
    },
    [userId]
  );

  // ---------------------------------------------------------------------------
  // Check status — GET /api/ar/alebrije/status/:taskId
  // ---------------------------------------------------------------------------
  const checkStatus = useCallback(
    async (taskId: string): Promise<ImageTo3DResponse> => {
      const res = await fetch(
        `${API_BASE}/ar/alebrije/status/${encodeURIComponent(taskId)}`
      );

      if (!res.ok) {
        return {
          success: false,
          taskId,
          status: 'failed',
          error: `Error ${res.status}`,
        };
      }

      return res.json() as Promise<ImageTo3DResponse>;
    },
    []
  );

  return {
    generate,
    checkStatus,
    gallery,
    isLoading,
    error,
    refresh,
  };
}
