import { randomUUID } from 'node:crypto'
import { Prisma, ReservationStatus } from '@prisma/client'
import prisma from '@/lib/db'
import { isReservationDateBlocked, isSpaceEnabled, parseDayConfig, parseReservationGlobalConfig, reservationDateMessage } from '@/lib/day-config'
import { isHoliday } from '@/lib/holidays'
import { getActiveReservationFilter, getPendingCutoff } from '@/lib/reservation-hold'
import { getCabinSpaceKey, getCabinSpaceLabel, getSpacePrefix, isSpaceSlug } from '@/lib/space-slugs'
import { allocateUnit, CANCELLATION_TERMS, calculateBookingAmounts, getCommercialCondition, inventoryConsumption, LEGACY_PRICING, POLICY_VERSION, type BookingQuote } from '@/lib/reservation-commercial'
import type { createReservationSchema } from '@/lib/validations'
import type { updateReservationSchema } from '@/lib/validations'
import type { z } from 'zod'
import type { BookingAvailability } from '@/lib/booking-selection'

type Database = Pick<Prisma.TransactionClient, 'cabin' | 'reservation' | 'reservationDayConfig' | 'reservationGlobalConfig' | 'closedDate'>
export class BookingError extends Error {
    constructor(message: string, public status = 400, public availability?: BookingAvailability) { super(message) }
}
export function dateKeyInSaoPaulo(date: Date) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}
export function bookingDayRange(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T12:00:00Z`)) || new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date) throw new BookingError('Selecione uma data válida.')
    return { checkIn: new Date(`${date}T10:00:00-03:00`), checkOut: new Date(`${date}T18:00:00-03:00`) }
}
export function cabinFilter(spaceKey: string): Prisma.CabinWhereInput {
    return isSpaceSlug(spaceKey) ? { OR: [{ slug: spaceKey }, { slug: null, name: { startsWith: getSpacePrefix(spaceKey) } }] } : { slug: spaceKey }
}
export async function resolveSpace(db: Database, cabinId: string) {
    if (/^[0-9a-f-]{36}$/i.test(cabinId)) {
        const cabin = await db.cabin.findUnique({ where: { id: cabinId } })
        if (!cabin) throw new BookingError('Espaço não encontrado.', 404)
        return getCabinSpaceKey(cabin)
    }
    return cabinId.trim()
}
export async function readBookingContext(db: Database, cabinId: string, date: string, quantity: number, excludeId?: string) {
    const { checkIn, checkOut } = bookingDayRange(date)
    if (date < dateKeyInSaoPaulo(new Date())) throw new BookingError('Não é possível reservar datas passadas.')
    const spaceKey = await resolveSpace(db, cabinId)
    const [cabins, dayRaw, globalRaw, closed, allReservations] = await Promise.all([
        db.cabin.findMany({ where: { isActive: true, visibilityStatus: 'AVAILABLE', OR: [{ id: spaceKey }, cabinFilter(spaceKey)] }, orderBy: { id: 'asc' } }),
        db.reservationDayConfig.findUnique({ where: { date: new Date(`${date}T12:00:00Z`) } }),
        db.reservationGlobalConfig.findUnique({ where: { id: 'default' } }),
        db.closedDate.findUnique({ where: { date: new Date(`${date}T12:00:00Z`) } }),
        db.reservation.findMany({ where: { ...(excludeId ? { id: { not: excludeId } } : {}), AND: [getActiveReservationFilter(), { checkIn: { lt: checkOut }, checkOut: { gt: checkIn } }] }, include: { cabin: { select: { id: true, name: true, slug: true } } }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    ])
    if (!cabins.length) throw new BookingError('Este espaço está indisponível.', 404)
    const day = dayRaw ? parseDayConfig(dayRaw) : null
    const global = parseReservationGlobalConfig(globalRaw)
    if (isReservationDateBlocked(day)) throw new BookingError(reservationDateMessage(day), 409)
    if (closed && !(day?.status === 'EVENT' && day.reservationsEnabled)) throw new BookingError('Esta data está fechada para reservas.', 409)
    const items = day?.reservableItems ?? global.reservableItems
    const enabled = isSpaceEnabled(spaceKey, items)
    if (!enabled) throw new BookingError('Esta categoria não está disponível para reserva nesta data.', 409)
    if (day?.ticketLots.length) {
        const today = dateKeyInSaoPaulo(new Date())
        if (!day.ticketLots.some(lot => !lot.soldOut && lot.endsAt <= today)) throw new BookingError('Não há lote disponível para reservar esta data.', 409)
    }
    const condition = getCommercialCondition(spaceKey, global.commercialConditions, day?.commercialConditions)
    const maxParticipants = condition.maxParticipants ?? (spaceKey === 'day-use-praia' ? 6 : cabins[0].capacity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxParticipants) throw new BookingError(`Selecione entre 1 e ${maxParticipants} participantes.`)
    const reservations = allReservations.filter(reservation => getCabinSpaceKey(reservation.cabin) === spaceKey)
    const units = cabins.reduce((sum, cabin) => sum + Math.max(1, cabin.units), 0)
    const capacity = spaceKey === 'day-use-praia' ? condition.dayUseCapacity ?? units : units
    const used = reservations.reduce((sum, reservation) => sum + inventoryConsumption(spaceKey, reservation), 0)
    const available = Math.max(0, capacity - used)
    if (inventoryConsumption(spaceKey, { participantCount: quantity }) > available) throw new BookingError(spaceKey === 'day-use-praia' ? `Restam ${available} vagas de Day Use para esta data. Escolha outra quantidade ou data.` : 'Não há unidade disponível para esta data.', 409, { available, maxParticipants })
    const legacy = LEGACY_PRICING[spaceKey]
    const holiday = Boolean(isHoliday(date))
    const basePrice = holiday && legacy ? legacy.holidayPrice : Number(cabins[0].pricePerHour) || legacy?.price || 0
    const baseConsumable = legacy ? holiday ? legacy.holidayConsumable : legacy.consumable : 0
    const globalPrice = global.priceOverrides[spaceKey]
    const dayPrice = day?.priceOverrides[spaceKey]
    const unitPrice = dayPrice?.price ?? globalPrice?.price ?? basePrice
    const unitConsumable = dayPrice?.consumable ?? globalPrice?.consumable ?? baseConsumable
    const pricingMode = spaceKey === 'day-use-praia' ? 'PER_PERSON' : condition.pricingMode ?? 'PER_RESERVATION'
    if ((condition.arrivalEnd || '12:00') <= (condition.arrivalStart || '10:00') || (condition.minBillableParticipants ?? 1) > maxParticipants) throw new BookingError('As condições desta categoria precisam ser revisadas pela equipe. Entre em contato com o Aysú.', 503)
    const amounts = calculateBookingAmounts(unitPrice, unitConsumable, quantity, pricingMode, condition.minBillableParticipants)
    const quote: BookingQuote = { spaceKey, spaceName: getCabinSpaceLabel(cabins[0]), date, participantCount: quantity, pricingMode, unitPrice, unitConsumable, maxParticipants, available, condition: { ...condition, arrivalStart: condition.arrivalStart || '10:00', arrivalEnd: condition.arrivalEnd || '12:00' }, eventTitle: day?.title ?? null, eventRelease: day?.release ?? null, cancellationPolicy: CANCELLATION_TERMS, policyVersion: POLICY_VERSION, ...amounts }
    return { quote, cabins, reservations, checkIn, checkOut }
}

export async function createBooking(data: z.infer<typeof createReservationSchema>, userId: string | null) {
    const date = dateKeyInSaoPaulo(new Date(data.checkIn))
    return prisma.$transaction(async tx => {
        const spaceKey = await resolveSpace(tx, data.cabinId)
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`aysu-reservation:${spaceKey}`}))`
        if (data.requestId) {
            const previous = await tx.reservation.findUnique({ where: { requestId: data.requestId }, include: { cabin: true } })
            if (previous) {
                if (previous.customerEmail !== data.customerEmail.toLowerCase() || previous.customerName !== data.customerName || previous.customerPhone !== (data.customerPhone ?? '') || previous.participantCount !== data.participantCount || dateKeyInSaoPaulo(previous.checkIn) !== date || getCabinSpaceKey(previous.cabin) !== spaceKey) throw new BookingError('Esta solicitação já foi usada para outra reserva.', 409)
                return previous
            }
        }
        const context = await readBookingContext(tx, spaceKey, date, data.participantCount)
        const { quote, cabins, reservations, checkIn, checkOut } = context
        if (data.totalPrice !== undefined && Math.abs(data.totalPrice - quote.totalPrice) > 0.009) throw new BookingError('O valor foi atualizado. Confira novamente o resumo antes de confirmar.', 409)
        if (data.source === 'ONLINE' && data.policyAccepted !== true) throw new BookingError('Leia e aceite as condições da reserva antes de continuar.')
        const unit = spaceKey === 'day-use-praia' ? null : allocateUnit(cabins, reservations)
        if (spaceKey !== 'day-use-praia' && !unit) throw new BookingError('Não há unidade disponível para esta data.', 409)
        return tx.reservation.create({ data: {
            cabinId: unit?.cabinId ?? cabins[0].id, unitNumber: unit?.unitNumber, userId,
            customerName: data.customerName, customerEmail: data.customerEmail.toLowerCase(), customerPhone: data.customerPhone ?? '', customerDocument: data.customerDocument,
            checkIn, checkOut, hoursBooked: 8, totalPrice: quote.totalPrice, consumptionCredit: quote.consumptionCredit,
            participantCount: data.participantCount, bookingConditions: { ...quote, policyAcceptedAt: data.policyAccepted ? new Date().toISOString() : null } as unknown as Prisma.InputJsonValue,
            requestId: data.requestId, receiptToken: randomUUID(), source: data.source, notes: data.notes, status: ReservationStatus.PENDING,
        }, include: { cabin: true } })
    }, { timeout: 15000 })
}

export async function updateBooking(id: string, data: z.infer<typeof updateReservationSchema>) {
    return prisma.$transaction(async tx => {
        let current = await tx.reservation.findUnique({ where: { id }, include: { cabin: true } })
        if (!current) throw new BookingError('Reserva não encontrada.', 404)
        const spaceKey = getCabinSpaceKey(current.cabin)
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`aysu-reservation:${spaceKey}`}))`
        current = await tx.reservation.findUnique({ where: { id }, include: { cabin: true } })
        if (!current) throw new BookingError('Reserva não encontrada.', 404)
        const activeStatuses: string[] = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS']
        const status = data.status ?? current.status
        const datesChanged = Boolean(data.checkIn || data.checkOut)
        const pendingCutoff = getPendingCutoff()
        const alreadyOccupiesInventory = ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'].includes(current.status) || (current.status === 'PENDING' && (!pendingCutoff || current.createdAt >= pendingCutoff))
        const needsInventory = activeStatuses.includes(status) && (datesChanged || !alreadyOccupiesInventory)
        if (data.status === 'CHECKED_IN' && !['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'].includes(current.status)) throw new BookingError('Esta reserva não está ativa para check-in.', 409)
        let allocation: { cabinId: string; unitNumber: number | null } | undefined
        const checkIn = data.checkIn ? new Date(data.checkIn) : current.checkIn
        const checkOut = data.checkOut ? new Date(data.checkOut) : current.checkOut
        if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkIn >= checkOut) throw new BookingError('Selecione um intervalo de reserva válido.')
        if (needsInventory) {
            const cabins = await tx.cabin.findMany({ where: { isActive: true, visibilityStatus: 'AVAILABLE', OR: [{ id: spaceKey }, cabinFilter(spaceKey)] }, orderBy: { id: 'asc' } })
            const others = (await tx.reservation.findMany({ where: { id: { not: id }, AND: [getActiveReservationFilter(), { checkIn: { lt: checkOut }, checkOut: { gt: checkIn } }] }, include: { cabin: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] })).filter(item => getCabinSpaceKey(item.cabin) === spaceKey)
            const [day, global] = await Promise.all([tx.reservationDayConfig.findUnique({ where: { date: new Date(`${dateKeyInSaoPaulo(checkIn)}T12:00:00Z`) } }), tx.reservationGlobalConfig.findUnique({ where: { id: 'default' } })])
            const condition = getCommercialCondition(spaceKey, parseReservationGlobalConfig(global).commercialConditions, day ? parseDayConfig(day).commercialConditions : {})
            const units = cabins.reduce((sum, cabin) => sum + Math.max(1, cabin.units), 0)
            const capacity = spaceKey === 'day-use-praia' ? condition.dayUseCapacity ?? units : units
            const used = others.reduce((sum, other) => sum + inventoryConsumption(spaceKey, other), 0)
            if (used + inventoryConsumption(spaceKey, current) > capacity) throw new BookingError('A data não tem vagas suficientes para esta reserva.', 409)
            if (spaceKey !== 'day-use-praia') {
                const occupied = others.some(other => other.cabinId === current!.cabinId && other.unitNumber === current!.unitNumber)
                allocation = !datesChanged && current.unitNumber && !occupied ? { cabinId: current.cabinId, unitNumber: current.unitNumber } : allocateUnit(cabins, others) ?? undefined
                if (!allocation) throw new BookingError('Não há unidade disponível para esta reserva.', 409)
            }
        }
        const snapshot = current.bookingConditions && typeof current.bookingConditions === 'object' && !Array.isArray(current.bookingConditions) ? current.bookingConditions as Record<string, Prisma.JsonValue> : null
        return tx.reservation.update({ where: { id }, data: { ...data, ...(allocation ?? {}), ...(datesChanged ? { checkIn, checkOut, ...(snapshot ? { bookingConditions: { ...snapshot, date: dateKeyInSaoPaulo(checkIn) } as Prisma.InputJsonValue } : {}) } : {}) }, include: { cabin: true, payment: true } })
    }, { timeout: 15000 })
}
