-- Additive change: existing reservations retain their amounts and one inventory unit.
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "participantCount" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "unitNumber" INTEGER;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "consumptionCredit" DECIMAL(10,2);
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "bookingConditions" JSONB;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "requestId" TEXT;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "receiptToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Reservation_requestId_key" ON "Reservation"("requestId");
CREATE UNIQUE INDEX IF NOT EXISTS "Reservation_receiptToken_key" ON "Reservation"("receiptToken");
ALTER TABLE "ReservationDayConfig" ADD COLUMN IF NOT EXISTS "commercialConditions" JSONB;
ALTER TABLE "ReservationGlobalConfig" ADD COLUMN IF NOT EXISTS "commercialConditions" JSONB;

ALTER TABLE "ReservationDayConfig" ADD COLUMN IF NOT EXISTS "commercialPeriodId" TEXT;
