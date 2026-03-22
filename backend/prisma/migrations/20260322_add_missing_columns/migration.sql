-- Add missing embedUrl column to LiveStream
ALTER TABLE "LiveStream" ADD COLUMN IF NOT EXISTS "embedUrl" TEXT;
