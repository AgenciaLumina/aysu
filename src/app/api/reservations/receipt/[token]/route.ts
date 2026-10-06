import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    if (!/^[0-9a-f-]{36}$/i.test(token)) return NextResponse.json({ success: false, error: 'Comprovante não encontrado.' }, { status: 404 })
    try {
        // A random token grants access only to the commercial receipt, never personal data.
        const reservation = await prisma.reservation.findUnique({ where: { receiptToken: token }, select: { status: true, bookingConditions: true, totalPrice: true, consumptionCredit: true, participantCount: true, checkIn: true, unitNumber: true } })
        if (!reservation) return NextResponse.json({ success: false, error: 'Comprovante não encontrado.' }, { status: 404 })
        return NextResponse.json({ success: true, data: reservation }, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
    } catch {
        return NextResponse.json({ success: false, error: 'Não foi possível carregar a confirmação. Tente novamente.' }, { status: 503 })
    }
}
