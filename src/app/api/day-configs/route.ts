import { NextRequest, NextResponse } from 'next/server'
import { DayConfigStatus } from '@prisma/client'
import prisma from '@/lib/db'
import { parseDayConfig } from '@/lib/day-config'
import type { ApiResponse } from '@/lib/types'

export const dynamic = 'force-dynamic'

const MAX_UPCOMING_LIMIT = 10

function getMonthRange(year: number, month: number) {
    const firstDay = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
    const lastDay = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
    return { firstDay, lastDay }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const year = searchParams.get('year')
        const month = searchParams.get('month')
        const upcomingParam = searchParams.get('upcoming')

        const where: {
            date?: { gte?: Date; lte?: Date }
            OR?: Array<{ status?: DayConfigStatus; highlightOnHome?: boolean }>
        } = {}

        if (year && month) {
            const parsedYear = Number(year)
            const parsedMonth = Number(month)

            if (!Number.isInteger(parsedYear) || !Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Parâmetros year/month inválidos' },
                    { status: 400 }
                )
            }

            const { firstDay, lastDay } = getMonthRange(parsedYear, parsedMonth)
            where.date = { gte: firstDay, lte: lastDay }
        } else {
            const today = new Date()
            today.setUTCHours(0, 0, 0, 0)
            where.date = { gte: today }
        }

        let take: number | undefined
        const upcoming = upcomingParam ? Number(upcomingParam) : null

        if (upcoming !== null) {
            if (!Number.isInteger(upcoming) || upcoming <= 0) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Parâmetro upcoming inválido' },
                    { status: 400 }
                )
            }

            take = Math.min(upcoming, MAX_UPCOMING_LIMIT)
            where.OR = [
                { status: DayConfigStatus.EVENT },
                { status: DayConfigStatus.PRIVATE_EVENT },
                { highlightOnHome: true },
            ]
        }

        const dayConfigs = await prisma.reservationDayConfig.findMany({
            where,
            orderBy: { date: 'asc' },
            ...(take ? { take: take * 3 } : {}),
        })

        const parsed = dayConfigs
            .map(parseDayConfig)
            .filter(config => {
                if (upcoming === null) return true
                return Boolean(config.title && config.title.trim().length > 0)
            })

        const data = upcoming !== null ? parsed.slice(0, take) : parsed

        // Para ?upcoming=N, enriquece cada config com dados do Event relacionado pela data
        if (upcoming !== null && data.length > 0) {
            const enriched = await Promise.all(
                data.map(async (cfg) => {
                    const dateStr = cfg.date // já é YYYY-MM-DD do parseDayConfig
                    const event = await prisma.event.findFirst({
                        where: {
                            startDate: {
                                gte: new Date(`${dateStr}T00:00:00Z`),
                                lte: new Date(`${dateStr}T23:59:59Z`),
                            },
                            isActive: true,
                        },
                        select: {
                            title: true,
                            description: true,
                            posterImageUrl: true,
                            djName: true,
                            bands: true,
                            ticketPrice: true,
                        },
                    })
                    return {
                        ...cfg,
                        linkedEvent: event
                            ? {
                                  title: event.title,
                                  description: event.description,
                                  posterImageUrl: event.posterImageUrl,
                                  djName: event.djName,
                                  bands: Array.isArray(event.bands) ? (event.bands as string[]) : null,
                                  ticketPrice: event.ticketPrice !== null ? Number(event.ticketPrice) : null,
                              }
                            : null,
                    }
                }),
            )
            return NextResponse.json<ApiResponse>({
                success: true,
                data: enriched,
            })
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            data,
        })
    } catch (error) {
        console.error('[Public Day Configs Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao buscar configurações de calendário' },
            { status: 500 }
        )
    }
}
