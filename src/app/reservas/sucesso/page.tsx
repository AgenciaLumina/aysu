// AISSU Beach Lounge - Página de Sucesso da Reserva
import Link from 'next/link'
import { CheckCircle, Calendar, Mail, Waves } from 'lucide-react'
import prisma from '@/lib/db'
import { QuoteSummary } from '@/components/reservas/CommercialConditions'
import type { BookingQuote } from '@/lib/reservation-commercial'
import { formatDateUTC } from '@/lib/utils'
import { getReservationStatusLabel } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false } }

export default async function ReservaSucessoPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
    const { token } = await searchParams
    const receipt = token && /^[0-9a-f-]{36}$/i.test(token) ? await prisma.reservation.findUnique({ where: { receiptToken: token }, select: { status: true, bookingConditions: true, totalPrice: true, consumptionCredit: true, participantCount: true, checkIn: true } }).catch(() => null) : null
    const quote = receipt?.bookingConditions as unknown as BookingQuote | null

    return (
        <div className="min-h-screen bg-[#fdfbf8] flex items-center justify-center">
            <div className="text-center max-w-xl px-4 py-12">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>

                <h1 className="font-serif text-3xl font-bold text-[#2a2a2a] mb-4">{receipt?.status === 'CANCELLED' || receipt?.status === 'NO_SHOW' ? 'Reserva encerrada' : receipt && receipt.status !== 'PENDING' ? 'Sua reserva' : 'Solicitação recebida'}</h1>

                <p className="text-[#8a5c3f] mb-6">
                    {!receipt || receipt.status === 'PENDING' ? <>Sua reserva está pendente de validação. <br /><strong>Para confirmar</strong>, envie o comprovante de pagamento no WhatsApp. Assim que validado, você receberá a confirmação definitiva.</> : <>Confira abaixo a situação e as condições registradas para sua reserva. Em caso de dúvida, fale com a equipe do Aysú.</>}
                </p>

                {token && !receipt && <p role="alert" className="mb-6 text-red-700">Não foi possível carregar o comprovante desta reserva. Consulte a equipe do Aysú.</p>}
                {receipt && quote && <div className="mb-6 rounded-xl border border-[#e0d5c7] bg-white p-6 text-left">
                    <p className="font-semibold mb-2">{quote.spaceName} · {formatDateUTC(receipt.checkIn)}</p>
                    <p className="mb-4 text-sm text-[#8a5c3f]">Situação: {getReservationStatusLabel(receipt.status)}</p>
                    <QuoteSummary quote={{ ...quote, totalPrice: Number(receipt.totalPrice), consumptionCredit: Number(receipt.consumptionCredit) }} />
                </div>}

                <div className="bg-white rounded-xl p-6 border border-[#e0d5c7] mb-6">
                    <a
                        href="https://wa.me/5512982896301"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 text-[#25D366] hover:text-[#128C7E] transition-colors font-medium"
                    >
                        <Mail className="h-5 w-5" />
                        <span>Enviar comprovante no WhatsApp</span>
                    </a>
                </div>

                <div className="flex flex-col gap-3">
                    <Link href="/">
                        <Button className="w-full" size="lg">
                            <Waves className="h-5 w-5" />
                            Voltar ao início
                        </Button>
                    </Link>
                    <Link href="/reservas">
                        <Button variant="secondary" className="w-full" size="lg">
                            <Calendar className="h-5 w-5" />
                            Nova reserva
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
