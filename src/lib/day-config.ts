import { DayConfigStatus, type ReservationDayConfig } from '@prisma/client'

export interface PriceOverride {
    price: number
    consumable?: number
}

export type PriceOverrides = Record<string, PriceOverride>

export interface TicketLot {
    name: string
    endsAt: string // YYYY-MM-DD
    price: number
    consumable?: number
    soldOut?: boolean
}

export interface ReservableItems {
    bangalos: boolean
    sunbeds: boolean
    restaurantTables: boolean
    beachTables: boolean
    dayUse: boolean
}

export interface DayConfigPayload {
    id: string
    date: string
    status: DayConfigStatus
    reservationsEnabled: boolean
    title: string | null
    release: string | null
    flyerImageUrl: string | null
    highlightOnHome: boolean
    priceOverrides: PriceOverrides
    ticketLots: TicketLot[]
    reservableItems: ReservableItems
    createdAt: string
    updatedAt: string
}

export const DEFAULT_RESERVABLE_ITEMS: ReservableItems = {
    bangalos: true,
    sunbeds: true,
    restaurantTables: false,
    beachTables: false,
    dayUse: false,
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : null
    }
    return null
}

export function parsePriceOverrides(value: unknown): PriceOverrides {
    if (!isRecord(value)) return {}

    const parsed: PriceOverrides = {}
    for (const [spaceId, rawConfig] of Object.entries(value)) {
        if (!isRecord(rawConfig)) continue

        const price = toNumber(rawConfig.price)
        if (price === null) continue

        const consumable = toNumber(rawConfig.consumable)
        parsed[spaceId] = {
            price,
            ...(consumable !== null ? { consumable } : {}),
        }
    }

    return parsed
}

export function parseTicketLots(value: unknown): TicketLot[] {
    if (!Array.isArray(value)) return []

    const lots: TicketLot[] = []

    for (const item of value) {
        if (!isRecord(item)) continue

        const name = typeof item.name === 'string' ? item.name.trim() : ''
        const endsAt = typeof item.endsAt === 'string' ? item.endsAt : ''
        const price = toNumber(item.price)
        const consumable = toNumber(item.consumable)
        const soldOut = typeof item.soldOut === 'boolean' ? item.soldOut : false

        if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(endsAt) || price === null) {
            continue
        }

        const lot: TicketLot = {
            name,
            endsAt,
            price,
        }

        if (consumable !== null) {
            lot.consumable = consumable
        }

        if (soldOut) {
            lot.soldOut = true
        }

        lots.push(lot)
    }

    return lots.sort((a, b) => a.endsAt.localeCompare(b.endsAt))
}

export function parseReservableItems(value: unknown): ReservableItems {
    if (!isRecord(value)) return DEFAULT_RESERVABLE_ITEMS

    return {
        bangalos: typeof value.bangalos === 'boolean' ? value.bangalos : DEFAULT_RESERVABLE_ITEMS.bangalos,
        sunbeds: typeof value.sunbeds === 'boolean' ? value.sunbeds : DEFAULT_RESERVABLE_ITEMS.sunbeds,
        restaurantTables: typeof value.restaurantTables === 'boolean' ? value.restaurantTables : DEFAULT_RESERVABLE_ITEMS.restaurantTables,
        beachTables: typeof value.beachTables === 'boolean' ? value.beachTables : DEFAULT_RESERVABLE_ITEMS.beachTables,
        dayUse: typeof value.dayUse === 'boolean' ? value.dayUse : DEFAULT_RESERVABLE_ITEMS.dayUse,
    }
}

export function parseDayConfig(config: ReservationDayConfig): DayConfigPayload {
    return {
        id: config.id,
        date: config.date.toISOString().split('T')[0],
        status: config.status,
        reservationsEnabled: config.reservationsEnabled,
        title: config.title,
        release: config.release,
        flyerImageUrl: config.flyerImageUrl,
        highlightOnHome: config.highlightOnHome,
        priceOverrides: parsePriceOverrides(config.priceOverrides),
        ticketLots: parseTicketLots(config.ticketLots),
        reservableItems: parseReservableItems(config.reservableItems),
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
    }
}

export function toDbDate(date: string): Date {
    return new Date(`${date}T12:00:00Z`)
}

export function getPriceOverrideForSpace(
    config: DayConfigPayload | null | undefined,
    spaceId: string
): PriceOverride | null {
    if (!config) return null
    return config.priceOverrides[spaceId] ?? null
}
