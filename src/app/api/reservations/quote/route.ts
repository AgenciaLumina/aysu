import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { BookingError, readBookingContext } from '@/lib/reservation-booking'

export async function GET(request: NextRequest) {
    try {
        const params = request.nextUrl.searchParams
        const { quote } = await readBookingContext(prisma, params.get('cabinId') || '', params.get('date') || '', Number(params.get('participants') || '1'))
        return NextResponse.json({ success: true, data: quote }, { headers: { 'Cache-Control': 'no-store' } })
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof BookingError ? error.message : 'Não foi possível consultar esta reserva. Tente novamente.', ...(error instanceof BookingError && error.availability ? { availability: error.availability } : {}) }, { status: error instanceof BookingError ? error.status : 503, headers: { 'Cache-Control': 'no-store' } })
    }
}
