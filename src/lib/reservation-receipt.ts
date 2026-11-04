import prisma from './db'
import { getPendingCutoff } from './reservation-hold'

/** A bearer receipt reveals only the existing commercial summary, never customer data. */
export async function getReservationReceipt(token?: string) {
    if (!token || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) return null
    return prisma.reservation.findUnique({ where: { receiptToken: token }, select: {
        id: true, status: true, bookingConditions: true, totalPrice: true, consumptionCredit: true,
        participantCount: true, checkIn: true, checkOut: true, createdAt: true,
    } })
}

export function canPayReservation(receipt: Awaited<ReturnType<typeof getReservationReceipt>>, now = new Date()) {
    if (!receipt || receipt.status !== 'PENDING' || receipt.checkOut <= now) return false
    const cutoff = getPendingCutoff(now)
    return !cutoff || receipt.createdAt >= cutoff
}
