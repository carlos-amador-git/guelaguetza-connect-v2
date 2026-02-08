// Sync Manager - Handles offline action synchronization

import {
  getPendingActions,
  updateActionStatus,
  deleteAction,
  OfflineAction,
} from './indexedDB';

type SyncCallback = (pendingCount: number) => void;

const API_BASE = ((import.meta as any).env.VITE_API_URL || '') + '/api';

let isOnline = navigator.onLine;
let isSyncing = false;
let syncCallbacks: SyncCallback[] = [];
let token: string | null = null;

// Set auth token
export function setSyncToken(authToken: string | null): void {
  token = authToken;
}

// Register callback for sync updates
export function onSyncUpdate(callback: SyncCallback): () => void {
  syncCallbacks.push(callback);
  return () => {
    syncCallbacks = syncCallbacks.filter((cb) => cb !== callback);
  };
}

// Notify callbacks
async function notifyCallbacks(): Promise<void> {
  const pending = await getPendingActions();
  syncCallbacks.forEach((cb) => cb(pending.length));
}

// Check if online
export function isNetworkOnline(): boolean {
  return isOnline;
}

// Initialize sync manager
export function initSyncManager(): void {
  // Listen for online/offline events
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Initial state
  isOnline = navigator.onLine;

  // Try to sync on init if online
  if (isOnline) {
    syncPendingActions();
  }
}

// Cleanup
export function cleanupSyncManager(): void {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
}

// Handle coming online
async function handleOnline(): Promise<void> {
  console.log('Network: Online');
  isOnline = true;

  // Wait a moment for network to stabilize
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Start syncing
  syncPendingActions();
}

// Handle going offline
function handleOffline(): void {
  console.log('Network: Offline');
  isOnline = false;
}

// Sync all pending actions
export async function syncPendingActions(): Promise<void> {
  if (isSyncing || !isOnline || !token) {
    return;
  }

  isSyncing = true;
  console.log('Sync: Starting...');

  try {
    const pending = await getPendingActions();

    for (const action of pending) {
      if (!isOnline) {
        console.log('Sync: Aborted - went offline');
        break;
      }

      // Check if we should retry
      if (action.retryCount >= action.maxRetries) {
        console.log(`Sync: Action ${action.id} exceeded max retries`);
        await updateActionStatus(action.id, 'failed', 'Max retries exceeded');
        continue;
      }

      // Calculate exponential backoff
      if (action.lastAttempt) {
        const backoffTime = Math.min(
          Math.pow(2, action.retryCount) * 1000,
          30000 // Max 30 seconds
        );
        const timeSinceLastAttempt = Date.now() - action.lastAttempt;

        if (timeSinceLastAttempt < backoffTime) {
          console.log(`Sync: Action ${action.id} in backoff period`);
          continue;
        }
      }

      // Try to execute the action
      try {
        await updateActionStatus(action.id, 'syncing');
        await executeAction(action);
        await deleteAction(action.id);
        console.log(`Sync: Action ${action.id} completed`);
      } catch (error) {
        console.error(`Sync: Action ${action.id} failed:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await updateActionStatus(action.id, 'pending', errorMessage);
      }
    }

    await notifyCallbacks();
  } finally {
    isSyncing = false;
    console.log('Sync: Complete');
  }
}

// Execute a single action
async function executeAction(action: OfflineAction): Promise<void> {
  if (!token) {
    throw new Error('No auth token');
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  switch (action.type) {
    case 'like': {
      const { storyId, isLike } = action.payload as { storyId: string; isLike: boolean };
      const response = await fetch(`${API_BASE}/stories/${storyId}/${isLike ? 'like' : 'unlike'}`, {
        method: 'POST',
        headers,
      });
      if (!response.ok) throw new Error('Failed to sync like');
      break;
    }

    case 'comment': {
      const { storyId, text } = action.payload as { storyId: string; text: string };
      const response = await fetch(`${API_BASE}/stories/${storyId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error('Failed to sync comment');
      break;
    }

    case 'follow': {
      const { userId, isFollow } = action.payload as { userId: string; isFollow: boolean };
      const response = await fetch(`${API_BASE}/users/${userId}/${isFollow ? 'follow' : 'unfollow'}`, {
        method: isFollow ? 'POST' : 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to sync follow');
      break;
    }

    case 'community_post': {
      const { communityId, content, imageUrl } = action.payload as {
        communityId: string;
        content: string;
        imageUrl: string | null;
      };
      const response = await fetch(`${API_BASE}/communities/${communityId}/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content, imageUrl }),
      });
      if (!response.ok) throw new Error('Failed to sync community post');
      break;
    }

    default:
      console.warn(`Sync: Unknown action type: ${action.type}`);
  }
}

// Force sync (for manual trigger)
export async function forceSync(): Promise<void> {
  if (!isOnline) {
    console.log('Sync: Cannot force sync - offline');
    return;
  }

  isSyncing = false; // Reset flag
  await syncPendingActions();
}

// Get sync status
export async function getSyncStatus(): Promise<{
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
}> {
  const pending = await getPendingActions();
  return {
    isOnline,
    isSyncing,
    pendingCount: pending.length,
  };
}
