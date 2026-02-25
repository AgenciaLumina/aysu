-- Sprint 2.1.1 - Calendario comercial por data
-- Migracao aditiva e segura para producao (sem alteracoes destrutivas)

-- 1) Enum de status para configuracao por data
DO $$
BEGIN
  CREATE TYPE "DayConfigStatus" AS ENUM ('NORMAL', 'EVENT', 'PRIVATE_EVENT', 'BLOCKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- 2) Tabela de configuracao comercial por data
CREATE TABLE IF NOT EXISTS "ReservationDayConfig" (
  "id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "status" "DayConfigStatus" NOT NULL DEFAULT 'NORMAL',
  "reservationsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "title" TEXT,
  "release" TEXT,
  "flyerImageUrl" TEXT,
  "highlightOnHome" BOOLEAN NOT NULL DEFAULT false,
  "priceOverrides" JSONB,
  "ticketLots" JSONB,
  "reservableItems" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReservationDayConfig_pkey" PRIMARY KEY ("id")
);

-- 3) Indices e chave unica
CREATE UNIQUE INDEX IF NOT EXISTS "ReservationDayConfig_date_key" ON "ReservationDayConfig"("date");
CREATE INDEX IF NOT EXISTS "ReservationDayConfig_date_idx" ON "ReservationDayConfig"("date");
CREATE INDEX IF NOT EXISTS "ReservationDayConfig_status_idx" ON "ReservationDayConfig"("status");
CREATE INDEX IF NOT EXISTS "ReservationDayConfig_highlightOnHome_idx" ON "ReservationDayConfig"("highlightOnHome");
