import { useState, useEffect, useCallback, useRef } from 'react';
import type { Achievement, UserAchievement, LeaderboardEntry } from '../../types/ar';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

// ============================================================================
// HOOK: ACHIEVEMENTS
// Fetches all achievements and user-specific unlocked achievements
// ============================================================================

interface UseAchievementsReturn {
  allAchievements: Achievement[];
  userAchievements: UserAchievement[];
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  isUnlocked: (achievementId: number) => boolean;
  refresh: () => void;
}

export function useAchievements(userId: string | null): UseAchievementsReturn {
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAll = useCallback(async () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setError(null);

    try {
      const requests: Promise<Response>[] = [
        fetch(`${API_BASE}/ar/achievements`, { signal }),
        fetch(`${API_BASE}/ar/leaderboard`, { signal }),
      ];

      if (userId) {
        requests.push(fetch(`${API_BASE}/ar/achievements/${userId}`, { signal }));
      }

      const [achievementsRes, leaderboardRes, userAchievementsRes] = await Promise.all(requests);

      if (!achievementsRes.ok) throw new Error(`Error ${achievementsRes.status}`);
      const achievementsData = await achievementsRes.json();
      setAllAchievements(achievementsData.achievements ?? []);

      if (!leaderboardRes.ok) throw new Error(`Error ${leaderboardRes.status}`);
      const leaderboardData = await leaderboardRes.json();
      setLeaderboard(leaderboardData.entries ?? []);

      if (userAchievementsRes && userAchievementsRes.ok) {
        const userData = await userAchievementsRes.json();
        setUserAchievements(userData.achievements ?? []);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Error al cargar logros');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refresh = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchAll]);

  const isUnlocked = useCallback(
    (achievementId: number): boolean => {
      return userAchievements.some((ua) => ua.achievementId === achievementId);
    },
    [userAchievements]
  );

  return {
    allAchievements,
    userAchievements,
    leaderboard,
    isLoading,
    error,
    isUnlocked,
    refresh,
  };
}
