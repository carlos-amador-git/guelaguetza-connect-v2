#!/bin/sh
# ============================================
# Docker Entrypoint Script - Backend
# ============================================
# Este script se ejecuta al iniciar el contenedor
# Maneja migraciones, seed y health checks
# ============================================

set -e

echo "================================================"
echo "🚀 Guelaguetza Connect - Backend Starting..."
echo "================================================"

# Reconstruct DATABASE_URL safely if components are present
if [ -n "$POSTGRES_PASSWORD" ] && [ -n "$POSTGRES_HOST" ]; then
    echo "🔄 Reconstructing DATABASE_URL safely..."
    export DATABASE_URL=$(node -e 'console.log(`postgresql://${process.env.POSTGRES_USER}:${encodeURIComponent(process.env.POSTGRES_PASSWORD)}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}?schema=public`)')
fi

# Colores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# FUNCIÓN: Wait for database
# ============================================
wait_for_db() {
    echo "${YELLOW}⏳ Waiting for PostgreSQL...${NC}"
    
    MAX_RETRIES=30
    RETRY_COUNT=0
    
    until echo "SELECT 1" | npx prisma db execute --url="$DATABASE_URL" --stdin > /tmp/prisma_db_check.log 2>&1 || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "   Attempt $RETRY_COUNT/$MAX_RETRIES..."
        if [ -s /tmp/prisma_db_check.log ]; then
            echo "   Last Error: $(head -n 1 /tmp/prisma_db_check.log)"
        fi
        sleep 2
    done
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "${RED}❌ Could not connect to database after $MAX_RETRIES attempts${NC}"
        echo "${YELLOW}Last error log:${NC}"
        cat /tmp/prisma_db_check.log
        exit 1
    fi
    
    echo "${GREEN}✅ PostgreSQL is ready!${NC}"
}

# ============================================
# FUNCIÓN: Wait for Redis
# ============================================
wait_for_redis() {
    if [ -n "$REDIS_URL" ]; then
        echo "${YELLOW}⏳ Waiting for Redis...${NC}"
        
        # Extract host and port from REDIS_URL (redis://host:port or redis://:password@host:port)
        REDIS_HOST=$(echo $REDIS_URL | sed 's|redis://[^@]*@||' | sed 's|redis://||' | cut -d: -f1)
        REDIS_PORT=$(echo $REDIS_URL | sed 's|redis://[^@]*@||' | sed 's|redis://||' | cut -d: -f2 | cut -d/ -f1)
        
        MAX_RETRIES=30
        RETRY_COUNT=0
        
        # Check TCP connection using Node.js to avoid HTTP headers (which trigger Redis security warnings)
        until node -e "const net = require('net'); const client = new net.Socket(); client.on('error', (err) => process.exit(1)); client.connect($REDIS_PORT, '$REDIS_HOST', () => { client.end(); process.exit(0); });" > /dev/null 2>&1 || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
            RETRY_COUNT=$((RETRY_COUNT + 1))
            echo "   Attempt $RETRY_COUNT/$MAX_RETRIES..."
            sleep 1
        done
        
        if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
            echo "${YELLOW}⚠️  Could not connect to Redis, continuing anyway...${NC}"
        else
            echo "${GREEN}✅ Redis is ready!${NC}"
        fi
    fi
}

# ============================================
# FUNCIÓN: Run migrations
# ============================================
run_migrations() {
    echo "${YELLOW}📦 Running database migrations...${NC}"
    
    if npx prisma migrate deploy; then
        echo "${GREEN}✅ Migrations completed successfully!${NC}"
    else
        echo "${RED}❌ Migration failed!${NC}"
        exit 1
    fi
}

# ============================================
# FUNCIÓN: Seed database (opcional)
# ============================================
seed_database() {
    if [ "$AUTO_SEED" = "true" ]; then
        echo "${YELLOW}🌱 Seeding database...${NC}"
        
        if npm run db:seed; then
            echo "${GREEN}✅ Database seeded successfully!${NC}"
        else
            echo "${YELLOW}⚠️  Seed failed or already exists, continuing...${NC}"
        fi
    fi
}

# ============================================
# FUNCIÓN: Health check
# ============================================
health_check() {
    echo "${YELLOW}🏥 Running health check...${NC}"
    
    # Verificar que Prisma Client esté generado
    if [ ! -d "node_modules/.prisma/client" ]; then
        echo "${YELLOW}⚙️  Generating Prisma Client...${NC}"
        npx prisma generate
    fi
    
    echo "${GREEN}✅ Health check passed!${NC}"
}

# ============================================
# MAIN EXECUTION
# ============================================

# Wait for dependencies
wait_for_db
wait_for_redis

# Run migrations
run_migrations

# Optional: Seed database
seed_database

# Health check
health_check

echo "================================================"
echo "${GREEN}✅ Initialization complete!${NC}"
echo "${GREEN}🚀 Starting Fastify server...${NC}"
echo "================================================"

# Start the application
exec node dist/index.js
