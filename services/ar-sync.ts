// ============================================================================
// AR Sync Service — Sprint 1.0
// Syncs pending offline operations to the API when back online
// ============================================================================

import {
  getPendingOperations,
  removePendingOperation,
  type PendingOperation,
} from './ar-offline';

const API_BASE = ((import.meta as { env: { VITE_API_URL?: string } }).env.VITE_API_URL || 'http://localhost:3001') + '/api';

// ============================================================================
// API call dispatch per operation type
// ============================================================================

async function dispatchOperation(op: PendingOperation & { id: number }): Promise<void> {
  switch (op.type) {
    case 'collect_point': {
      const res = await fetch(`${API_BASE}/ar/collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(op.payload),
      });
      if (!res.ok) {
        throw new Error(`collect_point failed: ${res.status} ${res.statusText}`);
      }
      break;
    }

    case 'toggle_favorite': {
      const { vestimentaId, userId, action } = op.payload as {
        vestimentaId: number;
        userId: string;
        action: 'add' | 'remove';
      };

      const method = action === 'add' ? 'POST' : 'DELETE';
      const res = await fetch(`${API_BASE}/ar/vestimentas/${vestimentaId}/favorite`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        throw new Error(`toggle_favorite failed: ${res.status} ${res.statusText}`);
      }
      break;
    }

    default: {
      // Unknown type — remove to avoid blocking the queue
      if ((import.meta as { env: { DEV?: boolean } }).env.DEV) {
        console.warn('[ARSync] Unknown operation type, discarding:', (op as { type: string }).type);
      }
    }
  }
}

// ============================================================================
// Main sync function
// ============================================================================

export async function syncPendingOperations(): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;

  let pending: (PendingOperation & { id: number })[];

  try {
    pending = await getPendingOperations();
  } catch (err) {
    console.error('[ARSync] Could not read pending operations:', err);
    return { synced: 0, failed: 0 };
  }

  if (pending.length === 0) {
    return { synced: 0, failed: 0 };
  }

  if ((import.meta as { env: { DEV?: boolean } }).env.DEV) {
    console.log(`[ARSync] Syncing ${pending.length} pending operations…`);
  }

  for (const op of pending) {
    try {
      await dispatchOperation(op);
      await removePendingOperation(op.id);
      synced++;

      if ((import.meta as { env: { DEV?: boolean } }).env.DEV) {
        console.log(`[ARSync] Synced op ${op.id} (${op.type})`);
      }
    } catch (err) {
      failed++;
      console.error(`[ARSync] Failed to sync op ${op.id} (${op.type}):`, err);
    }
  }

  if ((import.meta as { env: { DEV?: boolean } }).env.DEV) {
    console.log(`[ARSync] Done — synced: ${synced}, failed: ${failed}`);
  }

  return { synced, failed };
}
