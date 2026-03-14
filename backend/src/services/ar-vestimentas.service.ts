import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../utils/errors.js';
import type { VestimentasQuery, FavoriteBody } from '../schemas/ar.schema.js';

// ============================================================================
// HELPERS
// ============================================================================

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

export class ARVestimentasService {
  constructor(private prisma: PrismaClient) {}

  // --------------------------------------------------------------------------
  // CATALOG
  // --------------------------------------------------------------------------

  async getVestimentasCatalog(filters?: VestimentasQuery) {
    const whereConditions: string[] = ['v.active = true'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters?.region) {
      whereConditions.push(`r.codigo = $${paramIndex}`);
      params.push(filters.region);
      paramIndex++;
    }

    if (filters?.categoria) {
      whereConditions.push(`v.categoria = $${paramIndex}`);
      params.push(filters.categoria);
      paramIndex++;
    }

    if (filters?.genero) {
      whereConditions.push(`(v.genero = $${paramIndex} OR v.genero = 'unisex')`);
      params.push(filters.genero);
      paramIndex++;
    }

    if (filters?.trackingType) {
      whereConditions.push(`v.tracking_type = $${paramIndex}`);
      params.push(filters.trackingType);
      paramIndex++;
    }

    if (filters?.featured) {
      whereConditions.push('v.featured = true');
    }

    const sql = `
      SELECT
        v.*,
        r.id             AS region_id,
        r.codigo         AS region_codigo,
        r.nombre         AS region_nombre,
        r.color_primario AS region_color,
        a.url_glb        AS model_url,
        a.url_usdz       AS model_url_ios,
        a.url_thumbnail  AS asset_thumbnail,
        a.url_preview    AS asset_preview
      FROM ar.vestimentas v
      LEFT JOIN ar.regiones r ON v.region_id = r.id
      LEFT JOIN ar.assets   a ON v.asset_id  = a.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY v.featured DESC, r.orden_display, v.categoria, v.orden_display, v.nombre
    `;

    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(sql, ...params);

    const vestimentas = rows.map((row) => {
      const item = toCamelCase(row);
      return {
        ...item,
        region: item['regionId']
          ? {
              id: item['regionId'],
              codigo: item['regionCodigo'],
              nombre: item['regionNombre'],
              colorPrimario: item['regionColor'],
            }
          : undefined,
      };
    });

    return { count: vestimentas.length, vestimentas };
  }

  // --------------------------------------------------------------------------
  // SINGLE VESTIMENTA
  // --------------------------------------------------------------------------

  async getVestimentaById(id: number) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `
      SELECT
        v.*,
        r.codigo         AS region_codigo,
        r.nombre         AS region_nombre,
        r.color_primario AS region_color,
        r.descripcion    AS region_descripcion,
        a.url_glb        AS model_url,
        a.url_usdz       AS model_url_ios,
        a.url_thumbnail  AS asset_thumbnail,
        a.polycount      AS asset_polycount
      FROM ar.vestimentas v
      LEFT JOIN ar.regiones r ON v.region_id = r.id
      LEFT JOIN ar.assets   a ON v.asset_id  = a.id
      WHERE v.id = $1 AND v.active = true
      `,
      id
    );

    if (!rows.length) throw new NotFoundError('Vestimenta no encontrada');
    return toCamelCase(rows[0]);
  }

  async getVestimentaByCodigo(codigo: string) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `
      SELECT
        v.*,
        r.codigo         AS region_codigo,
        r.nombre         AS region_nombre,
        r.color_primario AS region_color,
        a.url_glb        AS model_url,
        a.url_usdz       AS model_url_ios
      FROM ar.vestimentas v
      LEFT JOIN ar.regiones r ON v.region_id = r.id
      LEFT JOIN ar.assets   a ON v.asset_id  = a.id
      WHERE v.codigo = $1 AND v.active = true
      `,
      codigo
    );

    if (!rows.length) throw new NotFoundError('Vestimenta no encontrada');
    return toCamelCase(rows[0]);
  }

  // --------------------------------------------------------------------------
  // VESTIMENTA SET
  // --------------------------------------------------------------------------

  async getVestimentaSet(setId: number) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `
      SELECT
        v.*,
        r.codigo         AS region_codigo,
        r.nombre         AS region_nombre,
        r.color_primario AS region_color,
        a.url_glb        AS model_url,
        a.url_usdz       AS model_url_ios
      FROM ar.vestimentas v
      LEFT JOIN ar.regiones r ON v.region_id = r.id
      LEFT JOIN ar.assets   a ON v.asset_id  = a.id
      WHERE v.id = $1 AND v.active = true
      `,
      setId
    );

    if (!rows.length) return [];

    const setItem = toCamelCase(rows[0]);

    // If not a complete set or no set items, return just this item
    const setItems = setItem['setItems'];
    if (!setItem['esSetCompleto'] || !Array.isArray(setItems) || setItems.length === 0) {
      return [setItem];
    }

    // Fetch all items in the set
    const placeholders = (setItems as number[]).map((_, i) => `$${i + 1}`).join(', ');
    const memberRows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `
      SELECT
        v.*,
        r.codigo         AS region_codigo,
        r.nombre         AS region_nombre,
        r.color_primario AS region_color,
        a.url_glb        AS model_url,
        a.url_usdz       AS model_url_ios
      FROM ar.vestimentas v
      LEFT JOIN ar.regiones r ON v.region_id = r.id
      LEFT JOIN ar.assets   a ON v.asset_id  = a.id
      WHERE v.id IN (${placeholders}) AND v.active = true
      ORDER BY
        CASE v.categoria
          WHEN 'cabeza'       THEN 1
          WHEN 'torso'        THEN 2
          WHEN 'falda'        THEN 3
          WHEN 'accesorio'    THEN 4
          WHEN 'mano'         THEN 5
          ELSE 6
        END
      `,
      ...(setItems as number[])
    );

    return memberRows.map((row) => toCamelCase(row));
  }

  // --------------------------------------------------------------------------
  // FAVORITES
  // --------------------------------------------------------------------------

  async getUserFavorites(userId: string) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `
      SELECT
        v.*,
        uf.saved_at,
        uf.screenshot_url AS favorite_screenshot,
        r.codigo         AS region_codigo,
        r.nombre         AS region_nombre,
        r.color_primario AS region_color,
        a.url_glb        AS model_url,
        a.url_usdz       AS model_url_ios,
        a.url_thumbnail  AS asset_thumbnail
      FROM ar.user_favorites uf
      JOIN  ar.vestimentas v ON uf.vestimenta_id = v.id
      LEFT JOIN ar.regiones r ON v.region_id = r.id
      LEFT JOIN ar.assets   a ON v.asset_id  = a.id
      WHERE uf.user_id = $1 AND v.active = true
      ORDER BY uf.saved_at DESC
      `,
      userId
    );

    return rows.map((row) => toCamelCase(row));
  }

  async addToFavorites(userId: string, data: FavoriteBody): Promise<boolean> {
    try {
      await this.prisma.$queryRawUnsafe(
        `
        INSERT INTO ar.user_favorites (user_id, vestimenta_id, screenshot_url)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, vestimenta_id) DO NOTHING
        `,
        userId,
        data.vestimentaId,
        data.screenshotUrl ?? null
      );
      return true;
    } catch (err) {
      return false;
    }
  }

  async removeFromFavorites(userId: string, vestimentaId: number): Promise<boolean> {
    try {
      await this.prisma.$queryRawUnsafe(
        `DELETE FROM ar.user_favorites WHERE user_id = $1 AND vestimenta_id = $2`,
        userId,
        vestimentaId
      );
      return true;
    } catch (err) {
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------------------------------

  async getCategoriasConConteo() {
    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ categoria: string; count: string | number }>
    >(
      `
      SELECT
        categoria,
        COUNT(*) AS count
      FROM ar.vestimentas
      WHERE active = true
      GROUP BY categoria
      ORDER BY
        CASE categoria
          WHEN 'traje_completo' THEN 1
          WHEN 'cabeza'         THEN 2
          WHEN 'torso'          THEN 3
          WHEN 'falda'          THEN 4
          WHEN 'accesorio'      THEN 5
          WHEN 'calzado'        THEN 6
          WHEN 'mano'           THEN 7
        END
      `
    );

    return rows.map((row) => ({
      categoria: row.categoria,
      count: Number(row.count),
    }));
  }
}
