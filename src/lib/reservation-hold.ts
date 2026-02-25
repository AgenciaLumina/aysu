import { Prisma, ReservationStatus } from '@prisma/client'

const ACTIVE_STATUSES_WITHOUT_PENDING: ReservationStatus[] = [
    ReservationStatus.CONFIRMED,
    ReservationStatus.CHECKED_IN,
    ReservationStatus.IN_PROGRESS,
]

const ACTIVE_STATUSES_WITH_PENDING: ReservationStatus[] = [
    ReservationStatus.PENDING,
    ...ACTIVE_STATUSES_WITHOUT_PENDING,
]

function parsePendingHoldMinutes(raw: string | undefined): number {
    if (!raw) return 0
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed < 0) return 0
    return Math.floor(parsed)
}

export function getPendingHoldMinutes(): number {
    return parsePendingHoldMinutes(process.env.PENDING_HOLD_MINUTES)
}

export function getPendingCutoff(now: Date = new Date()): Date | null {
    const holdMinutes = getPendingHoldMinutes()
    if (holdMinutes <= 0) return null
    return new Date(now.getTime() - (holdMinutes * 60 * 1000))
}

export function getActiveReservationFilter(now: Date = new Date()): Prisma.ReservationWhereInput {
    const pendingCutoff = getPendingCutoff(now)

    if (!pendingCutoff) {
        return {
            status: {
                in: ACTIVE_STATUSES_WITH_PENDING,
            },
        }
    }

    return {
        OR: [
            {
                status: {
                    in: ACTIVE_STATUSES_WITHOUT_PENDING,
                },
            },
            {
                status: ReservationStatus.PENDING,
                createdAt: {
                    gte: pendingCutoff,
                },
            },
        ],
    }
}
