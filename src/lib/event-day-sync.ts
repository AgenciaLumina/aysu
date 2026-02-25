import { DayConfigStatus, PrismaClient } from '@prisma/client'
import { toDbDate } from '@/lib/day-config'

type EventDaySyncClient = Pick<PrismaClient, 'event' | 'reservationDayConfig'>

function toUTCDateKey(date: Date): string {
    return date.toISOString().split('T')[0]
}

function getUTCDayRange(dateKey: string) {
    return {
        start: new Date(`${dateKey}T00:00:00.000Z`),
        end: new Date(`${dateKey}T23:59:59.999Z`),
    }
}

/**
 * Sincroniza os dados editoriais da data com o evento ativo principal do dia.
 * Não altera preços/lotes/regras comerciais já configuradas no calendário.
 */
export async function syncDayConfigFromActiveEventsForDate(
    client: EventDaySyncClient,
    date: Date,
): Promise<void> {
    const dateKey = toUTCDateKey(date)
    const dbDate = toDbDate(dateKey)
    const { start, end } = getUTCDayRange(dateKey)

    const [dayConfig, primaryEvent] = await Promise.all([
        client.reservationDayConfig.findUnique({
            where: { date: dbDate },
        }),
        client.event.findFirst({
            where: {
                isActive: true,
                startDate: {
                    gte: start,
                    lte: end,
                },
            },
            orderBy: [
                { isFeatured: 'desc' },
                { startDate: 'asc' },
                { createdAt: 'asc' },
            ],
            select: {
                title: true,
                description: true,
                posterImageUrl: true,
                isFeatured: true,
            },
        }),
    ])

    // Sem evento ativo no dia: não faz limpeza destrutiva para preservar configuração manual.
    if (!primaryEvent) return

    const editorialData = {
        title: primaryEvent.title,
        release: primaryEvent.description?.trim() || null,
        flyerImageUrl: primaryEvent.posterImageUrl?.trim() || null,
    }

    if (!dayConfig) {
        await client.reservationDayConfig.create({
            data: {
                date: dbDate,
                status: DayConfigStatus.EVENT,
                reservationsEnabled: true,
                highlightOnHome: primaryEvent.isFeatured,
                ...editorialData,
            },
        })
        return
    }

    await client.reservationDayConfig.update({
        where: { id: dayConfig.id },
        data: {
            ...editorialData,
            ...(dayConfig.status === DayConfigStatus.NORMAL
                ? { status: DayConfigStatus.EVENT }
                : {}),
            ...(primaryEvent.isFeatured && !dayConfig.highlightOnHome
                ? { highlightOnHome: true }
                : {}),
        },
    })
}
