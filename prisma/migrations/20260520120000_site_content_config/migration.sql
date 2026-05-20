CREATE TABLE IF NOT EXISTS "SiteContentConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "content" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteContentConfig_pkey" PRIMARY KEY ("id")
);
