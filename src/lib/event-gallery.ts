import { generateSlug } from '@/lib/utils'
import { parseDateOnly, serializeDateOnly } from '@/lib/date-only'

export const EVENT_GALLERY_BASE_FOLDER = 'galeria-eventos'

export function normalizeEventGallerySlug(value: string): string {
  return generateSlug(value).slice(0, 80)
}

export function getEventGalleryFolder(slugOrTitle: string): string {
  const normalizedSlug = normalizeEventGallerySlug(slugOrTitle) || 'galeria'
  return `${EVENT_GALLERY_BASE_FOLDER}/${normalizedSlug}`
}

export function parseEventGalleryDate(value?: string | null): Date | null {
  return parseDateOnly(value)
}

export function formatEventGalleryDateInput(value?: Date | string | null): string {
  return serializeDateOnly(value) || ''
}

export function serializeEventGalleryDateField<T extends { eventDate: Date | string | null }>(
  gallery: T,
): Omit<T, 'eventDate'> & { eventDate: string | null } {
  return {
    ...gallery,
    eventDate: serializeDateOnly(gallery.eventDate),
  }
}
