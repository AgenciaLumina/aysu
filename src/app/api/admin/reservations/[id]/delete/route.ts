import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canManageReservations, getAuthUser } from '@/lib/auth'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = getAuthUser(request)
        if (!canManageReservations(authUser)) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { id } = await params

        // Verifica se reserva existe
        const reservation = await prisma.reservation.findUnique({
            where: { id },
        })

        if (!reservation) {
            return NextResponse.json(
                { success: false, error: 'Reserva não encontrada' },
                { status: 404 }
            )
        }

        // Exclusão física (Hard Delete)
        await prisma.reservation.delete({
            where: { id },
        })

        console.log(`[Admin] Reserva excluída fisicamente: ${id} (${reservation.customerName})`)

        return NextResponse.json({
            success: true,
            message: 'Reserva excluída permanentemente'
        })

    } catch (error) {
        console.error('Erro ao excluir reserva:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao excluir reserva' },
            { status: 500 }
        )
    }
}
