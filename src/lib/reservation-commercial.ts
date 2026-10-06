import { z } from 'zod'

export const CANCELLATION_TERMS = 'Cancelamento: 100% reembolsável com 72h ou mais de antecedência; 50% entre 48h e menos de 72h; abaixo de 48h ou no-show, sem reembolso, ressalvadas as hipóteses legais previstas na política.'
export const POLICY_VERSION = 'aysu-2026-2027'
export const spaceConditionSchema = z.object({
    text: z.string().trim().max(5000).optional(),
    poolAccess: z.boolean().nullable().optional(),
    maxParticipants: z.number().int().positive().max(10000).nullable().optional(),
    minBillableParticipants: z.number().int().positive().max(10000).optional(),
    pricingMode: z.enum(['PER_RESERVATION', 'PER_PERSON']).optional(),
    arrivalStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    arrivalEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    dayUseCapacity: z.number().int().nonnegative().max(10000).nullable().optional(),
}).superRefine((rule, ctx) => {
    if (rule.arrivalStart && rule.arrivalEnd && rule.arrivalEnd <= rule.arrivalStart) {
        ctx.addIssue({ code: 'custom', message: 'O fim do horário de chegada deve ser posterior ao início.' })
    }
    if (rule.maxParticipants && (rule.minBillableParticipants ?? 1) > rule.maxParticipants) {
        ctx.addIssue({ code: 'custom', message: 'A cobrança mínima não pode ultrapassar a capacidade máxima.' })
    }
})
export const commercialConditionsSchema = z.record(z.string(), spaceConditionSchema)
export type SpaceCondition = z.infer<typeof spaceConditionSchema>
export type CommercialConditions = Record<string, SpaceCondition>

export function parseCommercialConditions(value: unknown): CommercialConditions {
    const result = commercialConditionsSchema.safeParse(value ?? {})
    return result.success ? result.data : {}
}

// Preserve the public site's existing daily/holiday prices and consumption fallbacks.
export const LEGACY_PRICING: Record<string, { price: number; consumable: number; holidayPrice: number; holidayConsumable: number }> = {
    'bangalo-lateral': { price: 600, consumable: 500, holidayPrice: 1000, holidayConsumable: 700 },
    'bangalo-piscina': { price: 600, consumable: 500, holidayPrice: 1800, holidayConsumable: 1300 },
    'bangalo-frente-mar': { price: 720, consumable: 600, holidayPrice: 1800, holidayConsumable: 1300 },
    'bangalo-central': { price: 1500, consumable: 1200, holidayPrice: 2500, holidayConsumable: 2000 },
    'sunbed-casal': { price: 250, consumable: 200, holidayPrice: 500, holidayConsumable: 350 },
    'mesa-restaurante': { price: 160, consumable: 100, holidayPrice: 160, holidayConsumable: 100 },
    'mesa-praia': { price: 160, consumable: 100, holidayPrice: 160, holidayConsumable: 100 },
    'day-use-praia': { price: 160, consumable: 100, holidayPrice: 160, holidayConsumable: 100 },
}

export function getCommercialCondition(spaceKey: string, global: CommercialConditions = {}, day: CommercialConditions = {}): SpaceCondition {
    const fields = (rule?: SpaceCondition) => Object.fromEntries(Object.entries(rule ?? {}).filter(([, value]) => value !== undefined && value !== null && value !== ''))
    return { ...fields(global[spaceKey]), ...fields(day[spaceKey]) } as SpaceCondition
}

export interface BookingQuote {
    spaceKey: string
    spaceName: string
    date: string
    participantCount: number
    billableParticipantCount: number
    pricingMode: 'PER_PERSON' | 'PER_RESERVATION'
    unitPrice: number
    unitConsumable: number
    totalPrice: number
    consumptionCredit: number
    nonConsumableAmount: number
    maxParticipants: number
    available: number
    condition: SpaceCondition
    eventTitle: string | null
    eventRelease: string | null
    cancellationPolicy: string
    policyVersion: string
}

export function calculateBookingAmounts(unitPrice: number, unitConsumable: number, quantity: number, mode: BookingQuote['pricingMode'], minimum = 1) {
    if (!Number.isInteger(quantity) || quantity < 1 || !Number.isInteger(minimum) || minimum < 1) throw new Error('Quantidade de participantes inválida.')
    if (![unitPrice, unitConsumable].every(value => Number.isFinite(value) && value >= 0)) throw new Error('Preço ou consumação inválidos.')
    if (unitConsumable > unitPrice) throw new Error('A consumação não pode ultrapassar o valor cobrado.')
    const billableParticipantCount = mode === 'PER_PERSON' ? Math.max(quantity, minimum) : quantity
    const multiplier = mode === 'PER_PERSON' ? billableParticipantCount : 1
    const totalPrice = Math.round(unitPrice * 100) * multiplier / 100
    const consumptionCredit = Math.round(unitConsumable * 100) * multiplier / 100
    return { billableParticipantCount, totalPrice, consumptionCredit, nonConsumableAmount: Math.round((totalPrice - consumptionCredit) * 100) / 100 }
}

export function inventoryConsumption(spaceKey: string, reservation: { participantCount?: number | null }) {
    return spaceKey === 'day-use-praia' ? Math.max(1, reservation.participantCount ?? 1) : 1
}

export function allocateUnit(cabins: { id: string; units: number }[], reservations: { cabinId: string; unitNumber: number | null }[]) {
    const slots = cabins.flatMap(cabin => Array.from({ length: Math.max(1, cabin.units) }, (_, index) => ({ cabinId: cabin.id, unitNumber: index + 1 })))
    const used = new Set<string>()
    const key = (slot: { cabinId: string; unitNumber: number }) => `${slot.cabinId}:${slot.unitNumber}`
    for (const reservation of reservations.filter(item => item.unitNumber !== null)) {
        used.add(`${reservation.cabinId}:${reservation.unitNumber}`)
    }
    // Legacy records did not identify the unit number. Reserve one remaining slot each.
    for (const reservation of reservations.filter(item => item.unitNumber === null)) {
        const slot = slots.find(item => item.cabinId === reservation.cabinId && !used.has(key(item))) ?? slots.find(item => !used.has(key(item)))
        if (!slot) return null
        used.add(key(slot))
    }
    return slots.find(slot => !used.has(key(slot))) ?? null
}
