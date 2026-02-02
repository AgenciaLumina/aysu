import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.closedDate.delete({
            where: { id },
        })

        return NextResponse.json({
            success: true,
            message: 'Data fechada removida com sucesso',
        })
    } catch (error: any) {
        if (error?.code === 'P2025') {
            return NextResponse.json(
                { success: false, error: 'Data fechada não encontrada' },
                { status: 404 }
            )
        }
        console.error('[ClosedDates DELETE Error]', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao remover data fechada' },
            { status: 500 }
        )
    }
}
