// ============================================================================
// AR Offline Service — Sprint 1.0
// IndexedDB wrapper using `idb` for offline AR data persistence
// ============================================================================

import { openDB, type IDBPDatabase } from 'idb';
import type {
  ARPoint,
  Vestimenta,
  Region,
  UserProgressResponse,
} from '../types/ar';

// ============================================================================
// DB SCHEMA
// ============================================================================

export interface PendingOperation {
  id?: number; // autoIncrement
  type: 'collect_point' | 'toggle_favorite';
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
}

// We use a plain record approach for idb's DBSchema — define as const for
// createObjectStore, and rely on types for reads/writes.

const DB_NAME = 'guelaguetza-ar-v1';
const DB_VERSION = 1;

type ARDBType = IDBPDatabase<{
  'ar-points': {
    key: number;
    value: ARPoint;
    indexes: { 'by-tipo': string; 'by-region': number };
  };
  'ar-vestimentas': {
    key: number;
    value: Vestimenta;
    indexes: { 'by-region': number; 'by-categoria': string };
  };
  'ar-regions': {
    key: number;
    value: Region;
  };
  'ar-collection': {
    key: string; // `${userId}:${pointId}`
    value: { pointId: number; collectedAt: string; userId: string };
  };
  'ar-progress': {
    key: string; // userId
    value: UserProgressResponse;
  };
  'ar-favorites': {
    key: string; // `${userId}:${vestimentaId}`
    value: { vestimentaId: number; userId: string };
  };
  'ar-pending-ops': {
    key: number;
    value: PendingOperation;
  };
}>;

// Singleton
let dbInstance: ARDBType | null = null;

export async function getARDB(): Promise<ARDBType> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<{
    'ar-points': {
      key: number;
      value: ARPoint;
      indexes: { 'by-tipo': string; 'by-region': number };
    };
    'ar-vestimentas': {
      key: number;
      value: Vestimenta;
      indexes: { 'by-region': number; 'by-categoria': string };
    };
    'ar-regions': {
      key: number;
      value: Region;
    };
    'ar-collection': {
      key: string;
      value: { pointId: number; collectedAt: string; userId: string };
    };
    'ar-progress': {
      key: string;
      value: UserProgressResponse;
    };
    'ar-favorites': {
      key: string;
      value: { vestimentaId: number; userId: string };
    };
    'ar-pending-ops': {
      key: number;
      value: PendingOperation;
    };
  }>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // AR Points
      if (!db.objectStoreNames.contains('ar-points')) {
        const pointsStore = db.createObjectStore('ar-points', { keyPath: 'id' });
        pointsStore.createIndex('by-tipo', 'tipo', { unique: false });
        pointsStore.createIndex('by-region', 'regionId', { unique: false });
      }

      // Vestimentas
      if (!db.objectStoreNames.contains('ar-vestimentas')) {
        const vestStore = db.createObjectStore('ar-vestimentas', { keyPath: 'id' });
        vestStore.createIndex('by-region', 'regionId', { unique: false });
        vestStore.createIndex('by-categoria', 'categoria', { unique: false });
      }

      // Regions
      if (!db.objectStoreNames.contains('ar-regions')) {
        db.createObjectStore('ar-regions', { keyPath: 'id' });
      }

      // Collection — out-of-line key: `userId:pointId`
      if (!db.objectStoreNames.contains('ar-collection')) {
        db.createObjectStore('ar-collection');
      }

      // Progress — key is userId
      if (!db.objectStoreNames.contains('ar-progress')) {
        db.createObjectStore('ar-progress');
      }

      // Favorites — key is `userId:vestimentaId`
      if (!db.objectStoreNames.contains('ar-favorites')) {
        db.createObjectStore('ar-favorites');
      }

      // Pending operations — autoIncrement
      if (!db.objectStoreNames.contains('ar-pending-ops')) {
        db.createObjectStore('ar-pending-ops', { autoIncrement: true });
      }
    },
  });

  return dbInstance;
}

// ============================================================================
// AR POINTS
// ============================================================================

export async function cachePoints(points: ARPoint[]): Promise<void> {
  const db = await getARDB();
  const tx = db.transaction('ar-points', 'readwrite');
  await Promise.all([
    ...points.map((p) => tx.store.put(p)),
    tx.done,
  ]);
}

export interface PointFilters {
  tipo?: string;
  regionId?: number;
}

export async function getCachedPoints(filters?: PointFilters): Promise<ARPoint[]> {
  const db = await getARDB();
  const tx = db.transaction('ar-points', 'readonly');

  if (filters?.tipo) {
    return tx.store.index('by-tipo').getAll(filters.tipo);
  }

  if (filters?.regionId !== undefined) {
    return tx.store.index('by-region').getAll(filters.regionId);
  }

  return tx.store.getAll();
}

// ============================================================================
// VESTIMENTAS
// ============================================================================

export async function cacheVestimentas(vestimentas: Vestimenta[]): Promise<void> {
  const db = await getARDB();
  const tx = db.transaction('ar-vestimentas', 'readwrite');
  await Promise.all([
    ...vestimentas.map((v) => tx.store.put(v)),
    tx.done,
  ]);
}

export interface VestimentaFilters {
  regionId?: number;
  categoria?: string;
}

export async function getCachedVestimentas(filters?: VestimentaFilters): Promise<Vestimenta[]> {
  const db = await getARDB();
  const tx = db.transaction('ar-vestimentas', 'readonly');

  if (filters?.regionId !== undefined) {
    return tx.store.index('by-region').getAll(filters.regionId);
  }

  if (filters?.categoria) {
    return tx.store.index('by-categoria').getAll(filters.categoria);
  }

  return tx.store.getAll();
}

// ============================================================================
// REGIONS
// ============================================================================

export async function cacheRegions(regions: Region[]): Promise<void> {
  const db = await getARDB();
  const tx = db.transaction('ar-regions', 'readwrite');
  await Promise.all([
    ...regions.map((r) => tx.store.put(r)),
    tx.done,
  ]);
}

export async function getCachedRegions(): Promise<Region[]> {
  const db = await getARDB();
  return db.getAll('ar-regions');
}

// ============================================================================
// COLLECTION
// ============================================================================

export async function cacheCollection(
  userId: string,
  collection: { pointId: number; collectedAt: string }[]
): Promise<void> {
  const db = await getARDB();
  const tx = db.transaction('ar-collection', 'readwrite');

  await Promise.all([
    ...collection.map((item) =>
      tx.store.put({ userId, pointId: item.pointId, collectedAt: item.collectedAt }, `${userId}:${item.pointId}`)
    ),
    tx.done,
  ]);
}

export async function getCachedCollection(
  userId: string
): Promise<{ pointId: number; collectedAt: string; userId: string }[]> {
  const db = await getARDB();
  const all = await db.getAll('ar-collection');
  return all.filter((item) => item.userId === userId);
}

// ============================================================================
// PROGRESS
// ============================================================================

export async function cacheProgress(userId: string, progress: UserProgressResponse): Promise<void> {
  const db = await getARDB();
  await db.put('ar-progress', progress, userId);
}

export async function getCachedProgress(userId: string): Promise<UserProgressResponse | undefined> {
  const db = await getARDB();
  return db.get('ar-progress', userId);
}

// ============================================================================
// PENDING OPERATIONS
// ============================================================================

export async function addPendingOperation(op: Omit<PendingOperation, 'id'>): Promise<number> {
  const db = await getARDB();
  const key = await db.add('ar-pending-ops', op as PendingOperation);
  return key as number;
}

export async function getPendingOperations(): Promise<(PendingOperation & { id: number })[]> {
  const db = await getARDB();
  const tx = db.transaction('ar-pending-ops', 'readonly');
  const all = await tx.store.getAll();
  const keys = await tx.store.getAllKeys();
  return all.map((op, i) => ({ ...op, id: keys[i] as number }));
}

export async function removePendingOperation(id: number): Promise<void> {
  const db = await getARDB();
  await db.delete('ar-pending-ops', id);
}

// ============================================================================
// NUCLEAR OPTION
// ============================================================================

export async function clearAllARCache(): Promise<void> {
  const db = await getARDB();
  const stores = [
    'ar-points',
    'ar-vestimentas',
    'ar-regions',
    'ar-collection',
    'ar-progress',
    'ar-favorites',
    'ar-pending-ops',
  ] as const;

  const tx = db.transaction(stores, 'readwrite');
  await Promise.all([
    ...stores.map((s) => tx.objectStore(s).clear()),
    tx.done,
  ]);
}
