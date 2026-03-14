import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../utils/errors.js';
import type {
  CollectPointBody,
  PointsQuery,
} from '../schemas/ar.schema.js';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Converts snake_case keys from raw DB rows to camelCase.
 * Works recursively for nested objects.
 */
function toCamelCase(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    result[camelKey] = row[key];
  }
  return result;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class ARPointsService {
  constructor(private prisma: PrismaClient) {}

  // --------------------------------------------------------------------------
  // NEARBY POINTS
  // --------------------------------------------------------------------------

  /**
   * Returns AR points within `radiusMeters` of (lat, lng).
   * Uses PostGIS ST_DWithin + ST_Distance on the ar.points table.
   *
   * IMPORTANT: PostGIS ST_MakePoint takes (longitude, latitude).
   */
  async getNearbyPoints(lat: number, lng: number, radiusMeters: number = 500) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `
      SELECT
        p.id,
        p.uuid,
        p.codigo,
        p.nombre,
        p.nombre_corto,
        p.descripcion,
        p.narrativa,
        p.tipo,
        p.region_id,
        p.quest_id,
        p.quest_orden,
        p.activation_radius_meters,
        p.tracking_type,
        p.is_collectible,
        p.points_value,
        p.color,
        p.emoji,
        p.thumbnail_url,
        p.active,
        p.featured,
        ST_Y(p.location::geometry) AS lat,
        ST_X(p.location::geometry) AS lng,
        ST_Distance(
          p.location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) AS distance_meters,
        r.codigo AS region_codigo,
        r.nombre AS region_nombre,
        r.color_primario AS region_color,
        a.url_glb  AS model_url,
        a.url_usdz AS model_url_ios,
        a.url_thumbnail AS asset_thumbnail
      FROM ar.points p
      LEFT JOIN ar.regiones r ON p.region_id = r.id
      LEFT JOIN ar.assets  a ON p.asset_principal_id = a.id
      WHERE ST_DWithin(
        p.location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      AND p.active = true
      ORDER BY distance_meters
      `,
      lng,   // $1 — longitude first for ST_MakePoint
      lat,   // $2
      radiusMeters  // $3
    );

    const points = rows.map((row) => {
      const p = toCamelCase(row);
      const distanceMeters = Math.round(Number(p['distanceMeters']) || 0);
      const activationRadiusMeters = Number(p['activationRadiusMeters']) || 0;

      return {
        ...p,
        lat: Number(p['lat']),
        lng: Number(p['lng']),
        distanceMeters,
        isWithinActivation: distanceMeters <= activationRadiusMeters,
        region: p['regionId']
          ? {
              id: p['regionId'],
              codigo: p['regionCodigo'],
              nombre: p['regionNombre'],
              colorPrimario: p['regionColor'],
            }
          : undefined,
      };
    });

    return { count: points.length, points };
  }

  // --------------------------------------------------------------------------
  // ALL POINTS (with filters)
  // --------------------------------------------------------------------------

  async getAllPoints(filters?: PointsQuery) {
    const whereConditions: string[] = ['p.active = true'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters?.tipo) {
      whereConditions.push(`p.tipo = $${paramIndex}`);
      params.push(filters.tipo);
      paramIndex++;
    }

    if (filters?.region) {
      whereConditions.push(`r.codigo = $${paramIndex}`);
      params.push(filters.region);
      paramIndex++;
    }

    if (filters?.quest) {
      whereConditions.push(`p.quest_id = $${paramIndex}`);
      params.push(filters.quest);
      paramIndex++;
    }

    if (filters?.collectible) {
      whereConditions.push('p.is_collectible = true');
    }

    const sql = `
      SELECT
        p.*,
        ST_Y(p.location::geometry) AS lat,
        ST_X(p.location::geometry) AS lng,
        r.codigo AS region_codigo,
        r.nombre AS region_nombre,
        r.color_primario AS region_color,
        a.url_glb AS model_url
      FROM ar.points p
      LEFT JOIN ar.regiones r ON p.region_id = r.id
      LEFT JOIN ar.assets  a ON p.asset_principal_id = a.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY p.orden_display, r.orden_display, p.nombre
    `;

    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(sql, ...params);
    return rows.map((row) => toCamelCase(row));
  }

  // --------------------------------------------------------------------------
  // SINGLE POINT
  // --------------------------------------------------------------------------

  async getPointById(id: number) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `
      SELECT
        p.*,
        ST_Y(p.location::geometry) AS lat,
        ST_X(p.location::geometry) AS lng,
        r.codigo AS region_codigo,
        r.nombre AS region_nombre,
        r.color_primario AS region_color,
        r.descripcion AS region_descripcion,
        a.url_glb  AS model_url,
        a.url_usdz AS model_url_ios,
        audio.url_glb AS audio_url
      FROM ar.points p
      LEFT JOIN ar.regiones r     ON p.region_id       = r.id
      LEFT JOIN ar.assets a       ON p.asset_principal_id = a.id
      LEFT JOIN ar.assets audio   ON p.asset_audio_id  = audio.id
      WHERE p.id = $1 AND p.active = true
      `,
      id
    );

    if (!rows.length) throw new NotFoundError('Punto AR no encontrado');
    return toCamelCase(rows[0]);
  }

  async getPointByCodigo(codigo: string) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `
      SELECT
        p.*,
        ST_Y(p.location::geometry) AS lat,
        ST_X(p.location::geometry) AS lng,
        r.codigo AS region_codigo,
        r.nombre AS region_nombre,
        r.color_primario AS region_color,
        a.url_glb  AS model_url,
        a.url_usdz AS model_url_ios
      FROM ar.points p
      LEFT JOIN ar.regiones r ON p.region_id       = r.id
      LEFT JOIN ar.assets  a ON p.asset_principal_id = a.id
      WHERE p.codigo = $1 AND p.active = true
      `,
      codigo
    );

    if (!rows.length) throw new NotFoundError('Punto AR no encontrado');
    return toCamelCase(rows[0]);
  }

  // --------------------------------------------------------------------------
  // COLLECT POINT
  // --------------------------------------------------------------------------

  /**
   * Calls the ar.collect_point() PostgreSQL function.
   * Location uses (longitude, latitude) order for ST_MakePoint.
   */
  async collectPoint(
    userId: string,
    data: CollectPointBody
  ) {
    const { pointId, lat, lng, screenshotUrl } = data;

    let sql: string;
    let params: unknown[];

    if (lat !== undefined && lng !== undefined) {
      sql = `
        SELECT ar.collect_point($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5) AS collect_point
      `;
      params = [userId, pointId, lng, lat, screenshotUrl ?? null];
    } else {
      sql = `
        SELECT ar.collect_point($1, $2, NULL::geography, $3) AS collect_point
      `;
      params = [userId, pointId, screenshotUrl ?? null];
    }

    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ collect_point: Record<string, unknown> }>
    >(sql, ...params);

    return rows[0]?.collect_point ?? { success: false, error: 'Error desconocido' };
  }

  // --------------------------------------------------------------------------
  // USER COLLECTION
  // --------------------------------------------------------------------------

  async getUserCollection(userId: string) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `
      SELECT
        uc.collected_at,
        uc.screenshot_url,
        p.id,
        p.codigo,
        p.nombre,
        p.tipo,
        p.points_value,
        p.color,
        p.emoji,
        p.thumbnail_url,
        ST_Y(p.location::geometry) AS lat,
        ST_X(p.location::geometry) AS lng,
        r.nombre         AS region_nombre,
        r.color_primario AS region_color
      FROM ar.user_collections uc
      JOIN  ar.points   p ON uc.point_id  = p.id
      LEFT JOIN ar.regiones r ON p.region_id = r.id
      WHERE uc.user_id = $1
      ORDER BY uc.collected_at DESC
      `,
      userId
    );

    const collected = rows.map((row) => toCamelCase(row));
    const totalPoints = collected.reduce(
      (sum, item) => sum + (Number(item['pointsValue']) || 0),
      0
    );

    return { collected, totalPoints, count: collected.length };
  }

  async getCollectedIds(userId: string): Promise<number[]> {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ point_id: number }>>(
      `SELECT point_id FROM ar.user_collections WHERE user_id = $1`,
      userId
    );
    return rows.map((r) => Number(r.point_id));
  }

  // --------------------------------------------------------------------------
  // USER PROGRESS
  // --------------------------------------------------------------------------

  async getUserProgress(userId: string) {
    const [progressRows, regionRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT * FROM ar.v_user_progress WHERE user_id = $1`,
        userId
      ),
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `
        SELECT
          r.id   AS region_id,
          r.nombre AS region_nombre,
          r.color_primario AS region_color,
          COUNT(DISTINCT CASE WHEN uc.id IS NOT NULL THEN p.id END) AS collected,
          COUNT(DISTINCT p.id) AS total
        FROM ar.regiones r
        LEFT JOIN ar.points p
          ON p.region_id = r.id AND p.is_collectible = true AND p.active = true
        LEFT JOIN ar.user_collections uc
          ON uc.point_id = p.id AND uc.user_id = $1
        WHERE r.active = true
        GROUP BY r.id, r.nombre, r.color_primario, r.orden_display
        ORDER BY r.orden_display
        `,
        userId
      ),
    ]);

    const collectionByRegion = regionRows.map((row) => toCamelCase(row));

    if (!progressRows.length) {
      return {
        userId,
        totalCollected: 0,
        totalAvailable: 0,
        percentageComplete: 0,
        totalPoints: 0,
        achievementsUnlocked: 0,
        collectionByRegion,
      };
    }

    return {
      ...toCamelCase(progressRows[0]),
      collectionByRegion,
    };
  }

  // --------------------------------------------------------------------------
  // QUESTS
  // --------------------------------------------------------------------------

  /** Returns all active quests. */
  async getQuests() {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `
      SELECT
        q.*,
        COUNT(p.id) AS items_count
      FROM ar.quests q
      LEFT JOIN ar.points p ON p.quest_id = q.id AND p.active = true
      WHERE q.active = true
      GROUP BY q.id
      ORDER BY q.id
      `
    );
    return { quests: rows.map((r) => toCamelCase(r)), count: rows.length };
  }

  /** Returns a quest with its collectible item points. */
  async getQuestById(id: number) {
    const [questRows, itemRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT * FROM ar.quests WHERE id = $1 AND active = true`,
        id
      ),
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `
        SELECT
          p.*,
          ST_Y(p.location::geometry) AS lat,
          ST_X(p.location::geometry) AS lng,
          r.nombre AS region_nombre,
          r.color_primario AS region_color
        FROM ar.points p
        LEFT JOIN ar.regiones r ON p.region_id = r.id
        WHERE p.quest_id = $1 AND p.active = true
        ORDER BY p.quest_orden NULLS LAST, p.nombre
        `,
        id
      ),
    ]);

    if (!questRows.length) throw new NotFoundError('Quest no encontrada');

    return {
      ...toCamelCase(questRows[0]),
      items: itemRows.map((r) => toCamelCase(r)),
    };
  }

  /** Returns user progress on a specific quest. */
  async getQuestProgress(questId: number, userId: string) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `
      SELECT
        uqp.*,
        q.nombre AS quest_nombre,
        q.total_items,
        q.reward_points
      FROM ar.user_quest_progress uqp
      JOIN ar.quests q ON uqp.quest_id = q.id
      WHERE uqp.quest_id = $1 AND uqp.user_id = $2
      `,
      questId,
      userId
    );

    if (!rows.length) {
      return { started: false, questId, userId, itemsCollected: 0, itemsFound: [] };
    }

    return { started: true, ...toCamelCase(rows[0]) };
  }

  /** Starts a quest for the given user (idempotent). */
  async startQuest(questId: number, userId: string) {
    // Verify quest exists
    const questRows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, nombre FROM ar.quests WHERE id = $1 AND active = true`,
      questId
    );
    if (!questRows.length) throw new NotFoundError('Quest no encontrada');

    await this.prisma.$queryRawUnsafe(
      `
      INSERT INTO ar.user_quest_progress (user_id, quest_id, items_collected, items_found)
      VALUES ($1, $2, 0, '{}')
      ON CONFLICT (user_id, quest_id) DO NOTHING
      `,
      userId,
      questId
    );

    return { success: true, questId, userId, started: true };
  }

  // --------------------------------------------------------------------------
  // ACHIEVEMENTS
  // --------------------------------------------------------------------------

  /** Returns all active achievements. */
  async getAchievements() {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `
      SELECT * FROM ar.achievements
      WHERE active = true
      ORDER BY dificultad, nombre
      `
    );
    return { achievements: rows.map((r) => toCamelCase(r)), count: rows.length };
  }

  /** Returns the achievements a specific user has unlocked. */
  async getUserAchievements(userId: string) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `
      SELECT
        ua.user_id,
        ua.achievement_id,
        ua.unlocked_at,
        ua.notified,
        a.codigo,
        a.nombre,
        a.descripcion,
        a.tipo,
        a.points_reward,
        a.badge_url,
        a.categoria,
        a.dificultad
      FROM ar.user_achievements ua
      JOIN ar.achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = $1
      ORDER BY ua.unlocked_at DESC
      `,
      userId
    );
    return { achievements: rows.map((r) => toCamelCase(r)), count: rows.length };
  }

  // --------------------------------------------------------------------------
  // LEADERBOARD
  // --------------------------------------------------------------------------

  /** Returns the top users from the ar.v_leaderboard view. */
  async getLeaderboard(limit: number = 10) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM ar.v_leaderboard LIMIT $1`,
      limit
    );
    return { entries: rows.map((r) => toCamelCase(r)), count: rows.length };
  }

  // --------------------------------------------------------------------------
  // USER AR PROFILE
  // --------------------------------------------------------------------------

  /** Returns combined AR profile: progress + achievements + quest progress. */
  async getUserARProfile(userId: string) {
    const [progressData, achievementsData, questsData] = await Promise.all([
      this.getUserProgress(userId),
      this.getUserAchievements(userId),
      this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `
        SELECT
          uqp.*,
          q.nombre AS quest_nombre,
          q.total_items,
          q.reward_points,
          q.icono_url
        FROM ar.user_quest_progress uqp
        JOIN ar.quests q ON uqp.quest_id = q.id
        WHERE uqp.user_id = $1
        ORDER BY uqp.started_at DESC
        `,
        userId
      ),
    ]);

    // Get rank from leaderboard view
    const rankRows = await this.prisma.$queryRawUnsafe<Array<{ ranking: number }>>(
      `SELECT ranking FROM ar.v_leaderboard WHERE user_id = $1`,
      userId
    );

    return {
      userId,
      ...progressData,
      ranking: rankRows[0]?.ranking ?? null,
      achievements: achievementsData.achievements,
      questProgress: questsData.map((r) => toCamelCase(r)),
    };
  }

  // --------------------------------------------------------------------------
  // REGIONS
  // --------------------------------------------------------------------------

  async getAllRegions() {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `
      SELECT
        r.*,
        ST_Y(r.centroide::geometry) AS lat,
        ST_X(r.centroide::geometry) AS lng,
        COUNT(p.id) FILTER (WHERE p.is_collectible = true) AS point_count
      FROM ar.regiones r
      LEFT JOIN ar.points p ON p.region_id = r.id AND p.active = true
      WHERE r.active = true
      GROUP BY r.id
      ORDER BY r.orden_display
      `
    );
    return rows.map((row) => toCamelCase(row));
  }

  // --------------------------------------------------------------------------
  // WIFI ZONES
  // --------------------------------------------------------------------------

  /**
   * Returns all active WiFi zones from ar.wifi_zones.
   * Falls back to seed data if the table does not exist yet.
   */
  async getWifiZones() {
    try {
      const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `
        SELECT
          id,
          nombre,
          tipo,
          horario,
          velocidad_mbps,
          direccion,
          ST_Y(ubicacion::geometry) AS lat,
          ST_X(ubicacion::geometry) AS lng,
          active
        FROM ar.wifi_zones
        WHERE active = true
        ORDER BY nombre
        `
      );
      return rows.map((row) => toCamelCase(row));
    } catch {
      // Table may not exist yet — return seed data
      return WIFI_ZONES_SEED;
    }
  }

  // --------------------------------------------------------------------------
  // ANALYTICS EVENTS
  // --------------------------------------------------------------------------

  /**
   * Batch-inserts analytics events into ar.analytics_events.
   * Silently ignores DB errors (table may not exist yet).
   */
  async trackEvents(
    events: Array<{
      eventType: string;
      userId?: string;
      pointId?: number;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<void> {
    if (events.length === 0) return;

    try {
      // Build a multi-row insert for efficiency
      const valuesClauses = events.map(
        (_, i) =>
          `($${i * 4 + 1}, $${i * 4 + 2}::integer, $${i * 4 + 3}, $${i * 4 + 4}::jsonb, NOW())`
      );
      const params: unknown[] = events.flatMap((e) => [
        e.eventType,
        e.pointId ?? null,
        e.userId ?? null,
        e.metadata ? JSON.stringify(e.metadata) : '{}',
      ]);

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO ar.analytics_events (event_type, point_id, user_id, metadata, created_at)
         VALUES ${valuesClauses.join(', ')}`,
        ...params
      );
    } catch {
      // Table may not exist yet — silently ignore
    }
  }
}

// ============================================================================
// WIFI ZONES SEED DATA
// Used as fallback when ar.wifi_zones table does not exist.
// ============================================================================

const WIFI_ZONES_SEED = [
  {
    id: 1,
    nombre: 'Zocalo de Oaxaca',
    tipo: 'publico',
    horario: '06:00 - 23:00',
    velocidadMbps: 10,
    direccion: 'Plaza de la Constitución, Centro Historico',
    lat: 17.0604,
    lng: -96.7245,
    active: true,
  },
  {
    id: 2,
    nombre: 'Mercado Benito Juarez',
    tipo: 'comercial',
    horario: '08:00 - 20:00',
    velocidadMbps: 25,
    direccion: 'Las Casas s/n, Centro',
    lat: 17.0618,
    lng: -96.7232,
    active: true,
  },
  {
    id: 3,
    nombre: 'Museo de las Culturas de Oaxaca',
    tipo: 'cultural',
    horario: '10:00 - 18:00',
    velocidadMbps: 50,
    direccion: 'Macedonio Alcala, Ex-Convento de Santo Domingo',
    lat: 17.0643,
    lng: -96.7249,
    active: true,
  },
  {
    id: 4,
    nombre: 'Andador Turistico',
    tipo: 'publico',
    horario: '00:00 - 23:59',
    velocidadMbps: 15,
    direccion: 'Macedonio Alcala entre Independencia y M. Bravo',
    lat: 17.063,
    lng: -96.7248,
    active: true,
  },
  {
    id: 5,
    nombre: 'Centro Cultural San Pablo',
    tipo: 'cultural',
    horario: '09:00 - 19:00',
    velocidadMbps: 30,
    direccion: '5 de Mayo 202, Centro Historico',
    lat: 17.0637,
    lng: -96.724,
    active: true,
  },
];
