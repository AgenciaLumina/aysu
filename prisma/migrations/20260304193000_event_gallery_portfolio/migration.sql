-- Galeria de Eventos (portfolio de eventos realizados)
-- Migração aditiva e segura

CREATE TABLE IF NOT EXISTS "EventGallery" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "eventDate" DATE,
  "shortDescription" TEXT,
  "description" TEXT,
  "coverImageUrl" TEXT,
  "ctaText" TEXT,
  "ctaHref" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventGallery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EventGalleryPhoto" (
  "id" TEXT NOT NULL,
  "galleryId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "caption" TEXT,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventGalleryPhoto_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EventGalleryPhoto_galleryId_fkey"
    FOREIGN KEY ("galleryId") REFERENCES "EventGallery"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "EventGallery_slug_key" ON "EventGallery"("slug");
CREATE INDEX IF NOT EXISTS "EventGallery_slug_idx" ON "EventGallery"("slug");
CREATE INDEX IF NOT EXISTS "EventGallery_isActive_idx" ON "EventGallery"("isActive");
CREATE INDEX IF NOT EXISTS "EventGallery_displayOrder_idx" ON "EventGallery"("displayOrder");
CREATE INDEX IF NOT EXISTS "EventGallery_eventDate_idx" ON "EventGallery"("eventDate");

CREATE INDEX IF NOT EXISTS "EventGalleryPhoto_galleryId_idx" ON "EventGalleryPhoto"("galleryId");
CREATE INDEX IF NOT EXISTS "EventGalleryPhoto_displayOrder_idx" ON "EventGalleryPhoto"("displayOrder");
CREATE INDEX IF NOT EXISTS "EventGalleryPhoto_isActive_idx" ON "EventGalleryPhoto"("isActive");
