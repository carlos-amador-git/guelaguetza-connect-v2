import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ARPointsService } from '../../src/services/ar-points.service.js';
import { ARVestimentasService } from '../../src/services/ar-vestimentas.service.js';

// ============================================================================
// MOCK PRISMA
// ============================================================================

function makeMockPrisma(rawUnsafeImpl?: () => Promise<unknown[]>) {
  return {
    $queryRawUnsafe: vi.fn().mockImplementation(rawUnsafeImpl ?? (() => Promise.resolve([]))),
  } as any;
}

// ============================================================================
// ARPointsService
// ============================================================================

describe('ARPointsService', () => {
  let mockPrisma: ReturnType<typeof makeMockPrisma>;
  let service: ARPointsService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = makeMockPrisma();
    service = new ARPointsService(mockPrisma);
  });

  // --- Module structure ---

  it('should export ARPointsService as a class', () => {
    expect(ARPointsService).toBeTypeOf('function');
  });

  it('should have all required public methods', () => {
    expect(service.getNearbyPoints).toBeTypeOf('function');
    expect(service.getAllPoints).toBeTypeOf('function');
    expect(service.getPointById).toBeTypeOf('function');
    expect(service.getPointByCodigo).toBeTypeOf('function');
    expect(service.collectPoint).toBeTypeOf('function');
    expect(service.getUserCollection).toBeTypeOf('function');
    expect(service.getCollectedIds).toBeTypeOf('function');
    expect(service.getUserProgress).toBeTypeOf('function');
    expect(service.getAllRegions).toBeTypeOf('function');
  });

  // --- getNearbyPoints ---

  it('getNearbyPoints should call $queryRawUnsafe with longitude first', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

    const result = await service.getNearbyPoints(17.066, -96.716, 300);

    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledOnce();

    // First positional param after the SQL string must be longitude (lng = -96.716)
    const callArgs = mockPrisma.$queryRawUnsafe.mock.calls[0];
    expect(callArgs[1]).toBe(-96.716); // lng / longitude
    expect(callArgs[2]).toBe(17.066);  // lat / latitude
    expect(callArgs[3]).toBe(300);     // radius

    expect(result).toMatchObject({ count: 0, points: [] });
  });

  it('getNearbyPoints should return count and points array', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([
      {
        id: 1,
        uuid: 'abc-uuid',
        codigo: 'OAX-001',
        nombre: 'Test Point',
        tipo: 'monument',
        lat: 17.066,
        lng: -96.716,
        distance_meters: 42,
        activation_radius_meters: 100,
        is_collectible: true,
        points_value: 10,
        active: true,
        featured: false,
        region_id: null,
        tracking_type: 'ground',
      },
    ]);

    const result = await service.getNearbyPoints(17.066, -96.716, 500);

    expect(result.count).toBe(1);
    expect(result.points[0]).toMatchObject({
      codigo: 'OAX-001',
      distanceMeters: 42,
      isWithinActivation: true,
    });
  });

  // --- getAllPoints ---

  it('getAllPoints should return empty array when no rows', async () => {
    const result = await service.getAllPoints();
    expect(result).toEqual([]);
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledOnce();
  });

  it('getAllPoints should pass tipo filter to the query', async () => {
    await service.getAllPoints({ tipo: 'character' });

    const sql = mockPrisma.$queryRawUnsafe.mock.calls[0][0] as string;
    expect(sql).toContain('p.tipo');

    const params = mockPrisma.$queryRawUnsafe.mock.calls[0].slice(1);
    expect(params).toContain('character');
  });

  // --- getPointById ---

  it('getPointById should throw NotFoundError when no rows returned', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

    await expect(service.getPointById(999)).rejects.toThrow('Punto AR no encontrado');
  });

  it('getPointById should return camelCase object on success', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([
      {
        id: 5,
        codigo: 'OAX-005',
        nombre: 'Monte Albán',
        tipo: 'monument',
        tracking_type: 'ground',
        is_collectible: true,
        points_value: 50,
        lat: 17.044,
        lng: -96.767,
        active: true,
        featured: true,
      },
    ]);

    const result = (await service.getPointById(5)) as Record<string, unknown>;

    expect(result['id']).toBe(5);
    expect(result['isCollectible']).toBe(true);
    expect(result['pointsValue']).toBe(50);
  });

  // --- getCollectedIds ---

  it('getCollectedIds should return array of numbers', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([
      { point_id: 1 },
      { point_id: 7 },
      { point_id: 13 },
    ]);

    const ids = await service.getCollectedIds('user-abc');

    expect(ids).toEqual([1, 7, 13]);
    expect(ids.every((n) => typeof n === 'number')).toBe(true);
  });

  // --- collectPoint ---

  it('collectPoint should call $queryRawUnsafe with userId and pointId', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([
      { collect_point: { success: true, pointsEarned: 10, totalCollected: 5 } },
    ]);

    const result = await service.collectPoint('user-123', { pointId: 7 });

    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledOnce();
    const params = mockPrisma.$queryRawUnsafe.mock.calls[0].slice(1);
    expect(params).toContain('user-123');
    expect(params).toContain(7);

    expect(result).toMatchObject({ success: true, pointsEarned: 10 });
  });

  // --- getUserProgress ---

  it('getUserProgress should return default zeros when user has no data', async () => {
    mockPrisma.$queryRawUnsafe
      .mockResolvedValueOnce([]) // v_user_progress returns empty
      .mockResolvedValueOnce([]); // region progress returns empty

    const progress = await service.getUserProgress('new-user');

    expect(progress).toMatchObject({
      userId: 'new-user',
      totalCollected: 0,
      totalAvailable: 0,
      percentageComplete: 0,
      totalPoints: 0,
      achievementsUnlocked: 0,
      collectionByRegion: [],
    });
  });

  // --- getAllRegions ---

  it('getAllRegions should return mapped camelCase regions', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([
      {
        id: 1,
        codigo: 'VALLES',
        nombre: 'Valles Centrales',
        color_primario: '#E65100',
        orden_display: 1,
        active: true,
        point_count: '8',
      },
    ]);

    const regions = (await service.getAllRegions()) as Record<string, unknown>[];

    expect(regions).toHaveLength(1);
    expect(regions[0]['colorPrimario']).toBe('#E65100');
    expect(regions[0]['pointCount']).toBe('8');
  });
});

// ============================================================================
// ARVestimentasService
// ============================================================================

describe('ARVestimentasService', () => {
  let mockPrisma: ReturnType<typeof makeMockPrisma>;
  let service: ARVestimentasService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = makeMockPrisma();
    service = new ARVestimentasService(mockPrisma);
  });

  it('should export ARVestimentasService as a class', () => {
    expect(ARVestimentasService).toBeTypeOf('function');
  });

  it('should have all required public methods', () => {
    expect(service.getVestimentasCatalog).toBeTypeOf('function');
    expect(service.getVestimentaById).toBeTypeOf('function');
    expect(service.getVestimentaByCodigo).toBeTypeOf('function');
    expect(service.getVestimentaSet).toBeTypeOf('function');
    expect(service.getUserFavorites).toBeTypeOf('function');
    expect(service.addToFavorites).toBeTypeOf('function');
    expect(service.removeFromFavorites).toBeTypeOf('function');
    expect(service.getCategoriasConConteo).toBeTypeOf('function');
  });

  // --- getVestimentasCatalog ---

  it('getVestimentasCatalog should return count and vestimentas array', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([
      {
        id: 1,
        uuid: 'vest-uuid',
        codigo: 'VES-001',
        nombre: 'Traje de Tehuana',
        categoria: 'traje_completo',
        genero: 'femenino',
        tracking_type: 'full_body',
        tiene_fisica_tela: true,
        rigidez: 0.5,
        es_set_completo: false,
        active: true,
        featured: true,
        region_id: 1,
        region_codigo: 'ISTMO',
        region_nombre: 'Istmo de Tehuantepec',
        region_color: '#C62828',
      },
    ]);

    const result = await service.getVestimentasCatalog();

    expect(result.count).toBe(1);
    expect(result.vestimentas[0]).toMatchObject({ codigo: 'VES-001' });
    expect(result.vestimentas[0]).toHaveProperty('region');
  });

  it('getVestimentasCatalog should include region object when regionId is present', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([
      {
        id: 2,
        codigo: 'VES-002',
        nombre: 'Huipil',
        categoria: 'torso',
        region_id: 3,
        region_codigo: 'SIERRA',
        region_nombre: 'Sierra Juárez',
        region_color: '#1B5E20',
      },
    ]);

    const result = await service.getVestimentasCatalog({ region: 'SIERRA' });
    const vestimenta = result.vestimentas[0] as Record<string, unknown>;
    const region = vestimenta['region'] as Record<string, unknown>;

    expect(region).toBeDefined();
    expect(region['codigo']).toBe('SIERRA');
    expect(region['colorPrimario']).toBe('#1B5E20');
  });

  // --- getVestimentaById ---

  it('getVestimentaById should throw NotFoundError when not found', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

    await expect(service.getVestimentaById(404)).rejects.toThrow('Vestimenta no encontrada');
  });

  // --- addToFavorites ---

  it('addToFavorites should return true on success', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

    const result = await service.addToFavorites('user-xyz', { vestimentaId: 5 });

    expect(result).toBe(true);
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledOnce();
  });

  it('addToFavorites should return false when query throws', async () => {
    mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('DB error'));

    const result = await service.addToFavorites('user-xyz', { vestimentaId: 5 });

    expect(result).toBe(false);
  });

  // --- removeFromFavorites ---

  it('removeFromFavorites should return true on success', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([]);

    const result = await service.removeFromFavorites('user-xyz', 5);

    expect(result).toBe(true);
  });

  // --- getCategoriasConConteo ---

  it('getCategoriasConConteo should parse count as number', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([
      { categoria: 'cabeza', count: '3' },
      { categoria: 'torso', count: '7' },
    ]);

    const result = await service.getCategoriasConConteo();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ categoria: 'cabeza', count: 3 });
    expect(result[1]).toEqual({ categoria: 'torso', count: 7 });
    expect(typeof result[0].count).toBe('number');
  });
});
