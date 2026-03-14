import { useState, useEffect, useCallback, useRef } from 'react';
import type { Quest, UserQuestProgress } from '../../types/ar';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

// ============================================================================
// HOOK: QUESTS
// Fetches /api/ar/quests and manages quest progress per user
// ============================================================================

interface QuestWithProgress extends Quest {
  progress?: UserQuestProgress;
}

interface UseQuestsReturn {
  quests: Quest[];
  isLoading: boolean;
  error: string | null;
  getProgress: (questId: number) => UserQuestProgress | null;
  startQuest: (questId: number) => Promise<boolean>;
  refresh: () => void;
}

export function useQuests(userId: string | null): UseQuestsReturn {
  const [quests, setQuests] = useState<QuestWithProgress[]>([]);
  const [progressMap, setProgressMap] = useState<Map<number, UserQuestProgress>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchQuests = useCallback(async () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/ar/quests`, { signal });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

      const json: { quests: Quest[]; count: number } = await res.json();
      setQuests(json.quests);

      // If we have a userId, fetch progress for each quest in parallel
      if (userId && json.quests.length > 0) {
        const progressResults = await Promise.allSettled(
          json.quests.map((q) =>
            fetch(`${API_BASE}/ar/quests/${q.id}/progress?userId=${userId}`, { signal }).then(
              (r) => (r.ok ? r.json() : null)
            )
          )
        );

        const newMap = new Map<number, UserQuestProgress>();
        progressResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value?.started) {
            newMap.set(json.quests[index].id, result.value as UserQuestProgress);
          }
        });
        setProgressMap(newMap);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Error al cargar quests');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refresh = useCallback(() => {
    fetchQuests();
  }, [fetchQuests]);

  useEffect(() => {
    fetchQuests();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchQuests]);

  const getProgress = useCallback(
    (questId: number): UserQuestProgress | null => {
      return progressMap.get(questId) ?? null;
    },
    [progressMap]
  );

  const startQuest = useCallback(
    async (questId: number): Promise<boolean> => {
      if (!userId) return false;

      try {
        const res = await fetch(`${API_BASE}/ar/quests/${questId}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) return false;

        // Optimistically add empty progress entry
        setProgressMap((prev) => {
          const next = new Map(prev);
          if (!next.has(questId)) {
            next.set(questId, {
              id: 0,
              userId: userId,
              questId,
              itemsCollected: 0,
              startedAt: new Date().toISOString(),
              itemsFound: [],
            });
          }
          return next;
        });

        return true;
      } catch {
        return false;
      }
    },
    [userId]
  );

  return {
    quests,
    isLoading,
    error,
    getProgress,
    startQuest,
    refresh,
  };
}
