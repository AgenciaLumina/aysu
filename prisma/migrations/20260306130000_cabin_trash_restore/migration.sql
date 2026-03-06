ALTER TABLE "Cabin"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedOriginalName" TEXT,
  ADD COLUMN IF NOT EXISTS "deletedVisibilityStatus" "CabinVisibilityStatus";

CREATE INDEX IF NOT EXISTS "Cabin_deletedAt_idx" ON "Cabin"("deletedAt");
CREATE INDEX IF NOT EXISTS "Cabin_deletedOriginalName_idx" ON "Cabin"("deletedOriginalName");
CREATE INDEX IF NOT EXISTS "Cabin_deletedVisibilityStatus_idx" ON "Cabin"("deletedVisibilityStatus");
