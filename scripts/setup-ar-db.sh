#!/usr/bin/env bash
# setup-ar-db.sh — Prepares the AR PostgreSQL schema
# Usage: bash scripts/setup-ar-db.sh

set -euo pipefail

CONTAINER="guelaguetza-postgres"
DB="guelaguetza_db"
USER="postgres"
MIGRATION_FILE="backend/prisma/migrations/ar_module/ar_migration_complete.sql"

# ── 1. Check container is running ────────────────────────────────────────────
echo "Checking PostgreSQL container..."
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "ERROR: Container '${CONTAINER}' is not running."
  echo "Start it with: npm run docker:up"
  exit 1
fi
echo "  OK: container is running."

# ── 2. Check PostGIS extension ───────────────────────────────────────────────
echo "Checking PostGIS extension..."
HAS_POSTGIS=$(docker exec "${CONTAINER}" psql -U "${USER}" -d "${DB}" -tAc \
  "SELECT COUNT(*) FROM pg_extension WHERE extname = 'postgis';" 2>/dev/null || echo "0")

if [ "${HAS_POSTGIS}" = "0" ]; then
  echo "  Installing PostGIS extension..."
  docker exec "${CONTAINER}" psql -U "${USER}" -d "${DB}" -c "CREATE EXTENSION IF NOT EXISTS postgis;"
  echo "  OK: PostGIS installed."
else
  echo "  OK: PostGIS already installed."
fi

# ── 3. Run AR migration ──────────────────────────────────────────────────────
echo "Running AR migration: ${MIGRATION_FILE}"
if [ ! -f "${MIGRATION_FILE}" ]; then
  echo "ERROR: Migration file not found: ${MIGRATION_FILE}"
  exit 1
fi

docker exec -i "${CONTAINER}" psql -U "${USER}" -d "${DB}" < "${MIGRATION_FILE}"
echo "  OK: migration applied."

# ── 4. Verify with test query ────────────────────────────────────────────────
echo "Verifying AR schema..."
POINT_COUNT=$(docker exec "${CONTAINER}" psql -U "${USER}" -d "${DB}" -tAc \
  "SELECT COUNT(*) FROM ar.points;" 2>/dev/null || echo "ERROR")

if [ "${POINT_COUNT}" = "ERROR" ] || [ -z "${POINT_COUNT}" ]; then
  echo "WARNING: Could not verify ar.points table. Migration may have had issues."
  exit 1
fi

echo "  OK: ar.points has ${POINT_COUNT} rows."
echo ""
echo "AR database setup complete."
