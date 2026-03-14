// ============================================================================
// ar-offline.test.ts — Sprint 1.0
// Tests for IndexedDB wrapper and pending operations queue
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';

// Import after fake-indexeddb has patched globalThis.indexedDB
import {
  getARDB,
  cachePoints,
  getCachedPoints,
  cacheVestimentas,
  getCachedVestimentas,
  cacheRegions,
  getCachedRegions,
  cacheCollection,
  getCachedCollection,
  cacheProgress,
  getCachedProgress,
  addPendingOperation,
  getPendingOperations,
  removePendingOperation,
  clearAllARCache,
} from './ar-offline';

import type { ARPoint, Vestimenta, Region, UserProgressResponse } from '../types/ar';

// ============================================================================
// FIXTURES
// ============================================================================

const mockPoint = (id: number): ARPoint => ({
  id,
  uuid: `uuid-${id}`,
  codigo: `POINT-${id}`,
  nombre: `Punto ${id}`,
  tipo: 'monument',
  regionId: 1,
  lat: 17.06,
  lng: -96.72,
  activationRadiusMeters: 50,
  trackingType: 'ground',
  isCollectible: true,
  pointsValue: 10,
  active: true,
  featured: false,
});

const mockVestimenta = (id: number): Vestimenta => ({
  id,
  uuid: `vest-uuid-${id}`,
  codigo: `VEST-${id}`,
  nombre: `Vestimenta ${id}`,
  categoria: 'traje_completo',
  genero: 'femenino',
  regionId: 2,
  trackingType: 'full_body',
  tieneFisicaTela: true,
  rigidez: 0.5,
  esSetCompleto: false,
  active: true,
  featured: false,
});

const mockRegion = (id: number): Region => ({
  id,
  codigo: `REG-${id}`,
  nombre: `Region ${id}`,
  colorPrimario: '#FF5733',
  ordenDisplay: id,
  active: true,
});

const mockProgress = (userId: string): UserProgressResponse => ({
  userId,
  totalCollected: 5,
  totalAvailable: 20,
  percentageComplete: 25,
  totalPoints: 50,
  achievementsUnlocked: 2,
  collectionByRegion: [],
});

// ============================================================================
// TESTS
// ============================================================================

describe('AR Offline — IndexedDB wrapper', () => {
  beforeEach(async () => {
    // Clear all stores between tests
    await clearAllARCache();
  });

  // --- AR Points ---

  it('caches and retrieves AR points', async () => {
    const points = [mockPoint(1), mockPoint(2), mockPoint(3)];
    await cachePoints(points);

    const retrieved = await getCachedPoints();
    expect(retrieved).toHaveLength(3);
    expect(retrieved.map((p) => p.id).sort()).toEqual([1, 2, 3]);
  });

  it('retrieves AR points filtered by tipo', async () => {
    const p1 = { ...mockPoint(10), tipo: 'monument' as const };
    const p2 = { ...mockPoint(11), tipo: 'character' as const };
    const p3 = { ...mockPoint(12), tipo: 'monument' as const };

    await cachePoints([p1, p2, p3]);

    const monuments = await getCachedPoints({ tipo: 'monument' });
    expect(monuments).toHaveLength(2);
    expect(monuments.every((p) => p.tipo === 'monument')).toBe(true);
  });

  it('retrieves AR points filtered by regionId', async () => {
    const p1 = { ...mockPoint(20), regionId: 1 };
    const p2 = { ...mockPoint(21), regionId: 2 };
    const p3 = { ...mockPoint(22), regionId: 1 };

    await cachePoints([p1, p2, p3]);

    const region1Points = await getCachedPoints({ regionId: 1 });
    expect(region1Points).toHaveLength(2);
    expect(region1Points.every((p) => p.regionId === 1)).toBe(true);
  });

  // --- Vestimentas ---

  it('caches and retrieves vestimentas', async () => {
    const vestimentas = [mockVestimenta(1), mockVestimenta(2)];
    await cacheVestimentas(vestimentas);

    const retrieved = await getCachedVestimentas();
    expect(retrieved).toHaveLength(2);
  });

  it('retrieves vestimentas filtered by categoria', async () => {
    const v1 = { ...mockVestimenta(30), categoria: 'traje_completo' as const };
    const v2 = { ...mockVestimenta(31), categoria: 'cabeza' as const };

    await cacheVestimentas([v1, v2]);

    const trajes = await getCachedVestimentas({ categoria: 'traje_completo' });
    expect(trajes).toHaveLength(1);
    expect(trajes[0].id).toBe(30);
  });

  // --- Regions ---

  it('caches and retrieves all regions', async () => {
    const regions = [mockRegion(1), mockRegion(2), mockRegion(3)];
    await cacheRegions(regions);

    const retrieved = await getCachedRegions();
    expect(retrieved).toHaveLength(3);
  });

  // --- Collection ---

  it('caches and retrieves user collection', async () => {
    const userId = 'user-abc';
    const collection = [
      { pointId: 1, collectedAt: '2026-01-01T00:00:00Z' },
      { pointId: 2, collectedAt: '2026-01-02T00:00:00Z' },
    ];

    await cacheCollection(userId, collection);

    const retrieved = await getCachedCollection(userId);
    expect(retrieved).toHaveLength(2);
    expect(retrieved.every((c) => c.userId === userId)).toBe(true);
    expect(retrieved.map((c) => c.pointId).sort()).toEqual([1, 2]);
  });

  it('isolates collection by userId', async () => {
    await cacheCollection('user-1', [{ pointId: 10, collectedAt: '2026-01-01T00:00:00Z' }]);
    await cacheCollection('user-2', [{ pointId: 20, collectedAt: '2026-01-01T00:00:00Z' }]);

    const user1Collection = await getCachedCollection('user-1');
    expect(user1Collection).toHaveLength(1);
    expect(user1Collection[0].pointId).toBe(10);
  });

  // --- Progress ---

  it('caches and retrieves user progress', async () => {
    const userId = 'user-xyz';
    const progress = mockProgress(userId);

    await cacheProgress(userId, progress);

    const retrieved = await getCachedProgress(userId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.userId).toBe(userId);
    expect(retrieved?.totalCollected).toBe(5);
  });

  it('returns undefined for uncached progress', async () => {
    const retrieved = await getCachedProgress('nonexistent-user');
    expect(retrieved).toBeUndefined();
  });

  // --- Pending Operations ---

  it('adds and retrieves pending operations', async () => {
    const op1 = {
      type: 'collect_point' as const,
      payload: { userId: 'u1', pointId: 42 },
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };
    const op2 = {
      type: 'toggle_favorite' as const,
      payload: { userId: 'u1', vestimentaId: 7, action: 'add' },
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    const id1 = await addPendingOperation(op1);
    const id2 = await addPendingOperation(op2);

    const pending = await getPendingOperations();
    expect(pending).toHaveLength(2);
    expect(pending.map((p) => p.id).sort()).toEqual([id1, id2].sort());
  });

  it('removes a pending operation by id', async () => {
    const id = await addPendingOperation({
      type: 'collect_point',
      payload: { userId: 'u1', pointId: 99 },
      createdAt: new Date().toISOString(),
      retryCount: 0,
    });

    await removePendingOperation(id);

    const pending = await getPendingOperations();
    expect(pending.find((p) => p.id === id)).toBeUndefined();
  });

  it('clears all AR cache', async () => {
    await cachePoints([mockPoint(1)]);
    await cacheRegions([mockRegion(1)]);
    await addPendingOperation({
      type: 'collect_point',
      payload: {},
      createdAt: new Date().toISOString(),
      retryCount: 0,
    });

    await clearAllARCache();

    const points = await getCachedPoints();
    const regions = await getCachedRegions();
    const pending = await getPendingOperations();

    expect(points).toHaveLength(0);
    expect(regions).toHaveLength(0);
    expect(pending).toHaveLength(0);
  });
});

// ============================================================================
// Sync logic tests (mocking fetch)
// ============================================================================

describe('AR Sync — pending operations', () => {
  beforeEach(async () => {
    await clearAllARCache();
    vi.restoreAllMocks();
  });

  it('sync removes operations that succeed', async () => {
    // We import here so the vi.mock scope applies
    const { syncPendingOperations } = await import('./ar-sync');

    // Seed a pending op
    await addPendingOperation({
      type: 'collect_point',
      payload: { userId: 'u1', pointId: 5 },
      createdAt: new Date().toISOString(),
      retryCount: 0,
    });

    // Mock fetch to succeed
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const result = await syncPendingOperations();

    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);

    const remaining = await getPendingOperations();
    expect(remaining).toHaveLength(0);
  });

  it('sync keeps operations that fail', async () => {
    const { syncPendingOperations } = await import('./ar-sync');

    await addPendingOperation({
      type: 'collect_point',
      payload: { userId: 'u1', pointId: 6 },
      createdAt: new Date().toISOString(),
      retryCount: 0,
    });

    // Mock fetch to fail
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

    const result = await syncPendingOperations();

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);

    const remaining = await getPendingOperations();
    expect(remaining).toHaveLength(1);
  });

  it('sync returns 0/0 when queue is empty', async () => {
    const { syncPendingOperations } = await import('./ar-sync');

    global.fetch = vi.fn();

    const result = await syncPendingOperations();

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
