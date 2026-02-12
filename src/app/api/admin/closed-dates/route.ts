import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { canManageReservations, getAuthUser } from '@/lib/auth'

export async function GET() {
    try {
        const closedDates = await prisma.closedDate.findMany({
            orderBy: { date: 'asc' },
        })

        return NextResponse.json({ success: true, data: closedDates })
    } catch (error) {
        console.error('[ClosedDates GET Error]', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar datas fechadas' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canManageReservations(authUser)) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { date, reason } = body

        if (!date) {
            return NextResponse.json(
                { success: false, error: 'Data é obrigatória' },
                { status: 400 }
            )
        }

        const closedDate = await prisma.closedDate.create({
            data: {
                // Force 12:00 UTC to avoid timezone shifts (e.g. -3h pushing to previous day)
                date: new Date(`${date}T12:00:00Z`),
                reason: reason || 'Evento Fechado',
            },
        })

        return NextResponse.json({
            success: true,
            data: closedDate,
            message: 'Data fechada adicionada com sucesso',
        })
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return NextResponse.json(
                { success: false, error: 'Esta data já está marcada como fechada' },
                { status: 409 }
            )
        }
        console.error('[ClosedDates POST Error]', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao adicionar data fechada' },
            { status: 500 }
        )
    }
}
