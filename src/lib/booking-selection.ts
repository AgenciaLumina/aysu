export interface BookingAvailability {
    available: number
    maxParticipants: number
}

export function parseBookingAvailability(value: unknown): BookingAvailability | null {
    if (!value || typeof value !== 'object') return null
    const { available, maxParticipants } = value as Partial<BookingAvailability>
    if (typeof available !== 'number' || !Number.isInteger(available) || available < 0
        || typeof maxParticipants !== 'number' || !Number.isInteger(maxParticipants) || maxParticipants < 1) return null
    return { available, maxParticipants }
}

export function getParticipantLimit(spaceKey: string | undefined, maximum: number, availability: BookingAvailability | null): number {
    if (!availability || availability.available === 0) return 0
    const limit = Math.min(maximum, availability.maxParticipants)
    return spaceKey === 'day-use-praia' ? Math.min(limit, availability.available) : limit
}
