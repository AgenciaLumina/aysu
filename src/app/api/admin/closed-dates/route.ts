import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

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
                date: new Date(date),
                reason: reason || 'Evento Fechado',
            },
        })

        return NextResponse.json({
            success: true,
            data: closedDate,
            message: 'Data fechada adicionada com sucesso',
        })
    } catch (error: any) {
        if (error?.code === 'P2002') {
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
