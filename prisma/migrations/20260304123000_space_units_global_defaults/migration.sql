-- Add support for unified spaces with quantity (units)
ALTER TABLE "Cabin"
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "units" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS "Cabin_slug_idx" ON "Cabin"("slug");

-- Global defaults for day-to-day reservation rules and pricing
CREATE TABLE IF NOT EXISTS "ReservationGlobalConfig" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "reservableItems" JSONB,
  "priceOverrides" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReservationGlobalConfig_pkey" PRIMARY KEY ("id")
);

-- Singleton default row
INSERT INTO "ReservationGlobalConfig" ("id", "reservableItems", "priceOverrides")
VALUES (
  'default',
  '{"bangalos": true, "sunbeds": true, "restaurantTables": false, "beachTables": false, "dayUse": true}'::jsonb,
  '{}'::jsonb
)
ON CONFLICT ("id") DO NOTHING;
