// Offline Cache Service - LocalStorage based caching for offline support
import type { Story } from '../types';

const CACHE_KEYS = {
  STORIES: 'guelaguetza-stories-v1',
  USER_ACTIONS: 'guelaguetza-pending-actions-v1',
};

interface CachedData<T> {
  data: T;
  timestamp: number;
}

interface PendingAction {
  id: string;
  type: 'like' | 'comment' | 'story';
  payload: Record<string, unknown>;
  timestamp: number;
}

// Stories cache
export function cacheStories(stories: Story[]): void {
  try {
    const cached: CachedData<Story[]> = {
      data: stories,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEYS.STORIES, JSON.stringify(cached));
  } catch (error) {
    console.error('[OfflineCache] Error caching stories:', error);
  }
}

export function getCachedStories(maxAgeMs: number = 24 * 60 * 60 * 1000): Story[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.STORIES);
    if (!cached) return null;

    const { data, timestamp }: CachedData<Story[]> = JSON.parse(cached);

    if (Date.now() - timestamp > maxAgeMs) {
      localStorage.removeItem(CACHE_KEYS.STORIES);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function clearStoriesCache(): void {
  localStorage.removeItem(CACHE_KEYS.STORIES);
}

// Note: Schedule data is static and defined in ProgramView.tsx
// It's always available offline since it's bundled with the app

// Pending actions queue for sync when online
export function queuePendingAction(action: Omit<PendingAction, 'id' | 'timestamp'>): void {
  const pending = getPendingActions();
  const newAction: PendingAction = {
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  pending.push(newAction);
  localStorage.setItem(CACHE_KEYS.USER_ACTIONS, JSON.stringify(pending));
}

export function getPendingActions(): PendingAction[] {
  try {
    const data = localStorage.getItem(CACHE_KEYS.USER_ACTIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function clearPendingAction(id: string): void {
  const pending = getPendingActions().filter((a) => a.id !== id);
  localStorage.setItem(CACHE_KEYS.USER_ACTIONS, JSON.stringify(pending));
}

export function clearAllPendingActions(): void {
  localStorage.removeItem(CACHE_KEYS.USER_ACTIONS);
}

export async function syncPendingActions(apiBase: string, token?: string): Promise<void> {
  const actions = getPendingActions();
  if (actions.length === 0) return;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  for (const action of actions) {
    try {
      let endpoint = '';
      let method = 'POST';

      switch (action.type) {
        case 'like':
          endpoint = `${apiBase}/stories/${action.payload.storyId}/like`;
          break;
        case 'comment':
          endpoint = `${apiBase}/stories/${action.payload.storyId}/comment`;
          break;
        case 'story':
          endpoint = `${apiBase}/stories`;
          break;
        default:
          continue;
      }

      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(action.payload),
      });

      if (response.ok) {
        clearPendingAction(action.id);
        if (import.meta.env.DEV) console.log(`[OfflineCache] Synced action: ${action.type}`);
      }
    } catch (error) {
      console.error(`[OfflineCache] Error syncing action ${action.id}:`, error);
    }
  }
}
