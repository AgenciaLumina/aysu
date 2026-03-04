import { prisma } from '@/lib/db'
import { generateSlug } from '@/lib/utils'

export const EVENT_GALLERY_BASE_FOLDER = 'galeria-eventos'

const ENSURE_EVENT_GALLERY_TABLE_SQL = `
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
`

const ENSURE_EVENT_GALLERY_PHOTO_TABLE_SQL = `
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
`

const ENSURE_EVENT_GALLERY_INDEXES_SQL = [
  `CREATE UNIQUE INDEX IF NOT EXISTS "EventGallery_slug_key" ON "EventGallery"("slug");`,
  `CREATE INDEX IF NOT EXISTS "EventGallery_slug_idx" ON "EventGallery"("slug");`,
  `CREATE INDEX IF NOT EXISTS "EventGallery_isActive_idx" ON "EventGallery"("isActive");`,
  `CREATE INDEX IF NOT EXISTS "EventGallery_displayOrder_idx" ON "EventGallery"("displayOrder");`,
  `CREATE INDEX IF NOT EXISTS "EventGallery_eventDate_idx" ON "EventGallery"("eventDate");`,
  `CREATE INDEX IF NOT EXISTS "EventGalleryPhoto_galleryId_idx" ON "EventGalleryPhoto"("galleryId");`,
  `CREATE INDEX IF NOT EXISTS "EventGalleryPhoto_displayOrder_idx" ON "EventGalleryPhoto"("displayOrder");`,
  `CREATE INDEX IF NOT EXISTS "EventGalleryPhoto_isActive_idx" ON "EventGalleryPhoto"("isActive");`,
]

export async function ensureEventGalleryTables(): Promise<void> {
  await prisma.$executeRawUnsafe(ENSURE_EVENT_GALLERY_TABLE_SQL)
  await prisma.$executeRawUnsafe(ENSURE_EVENT_GALLERY_PHOTO_TABLE_SQL)

  for (const statement of ENSURE_EVENT_GALLERY_INDEXES_SQL) {
    await prisma.$executeRawUnsafe(statement)
  }
}

export function normalizeEventGallerySlug(value: string): string {
  return generateSlug(value).slice(0, 80)
}

export function getEventGalleryFolder(slugOrTitle: string): string {
  const normalizedSlug = normalizeEventGallerySlug(slugOrTitle) || 'galeria'
  return `${EVENT_GALLERY_BASE_FOLDER}/${normalizedSlug}`
}

export function parseEventGalleryDate(value?: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  return new Date(`${value}T12:00:00.000Z`)
}

export function formatEventGalleryDateInput(value?: Date | string | null): string {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
