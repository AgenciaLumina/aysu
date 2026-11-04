// Etapa 2: pagamento de uma reserva já registrada e com disponibilidade bloqueada.
import Link from 'next/link'
import { CheckCircle, Calendar, Mail, Waves } from 'lucide-react'
import { QuoteSummary } from '@/components/reservas/CommercialConditions'
import { PixPayment } from '@/components/reservas/PixPayment'
import type { BookingQuote } from '@/lib/reservation-commercial'
import { getReservationReceipt, canPayReservation } from '@/lib/reservation-receipt'
import { formatCurrency, formatDateUTC } from '@/lib/utils'
import { getReservationStatusLabel } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' as const }

export default async function ReservaSucessoPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
    const { token } = await searchParams
    const receipt = await getReservationReceipt(token).catch(() => null)
    const quote = receipt?.bookingConditions as unknown as BookingQuote | null
    const canPay = canPayReservation(receipt)
    const closed = receipt && ['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(receipt.status)
    const message = receipt && quote ? `Olá! Quero enviar o comprovante da reserva ${receipt.id}.\nEspaço: ${quote.spaceName}\nData: ${formatDateUTC(receipt.checkIn)}\nParticipantes: ${receipt.participantCount}\nTotal: ${formatCurrency(Number(receipt.totalPrice))}` : ''
    const whatsappUrl = message ? `https://wa.me/5512982896301?text=${encodeURIComponent(message)}` : 'https://wa.me/5512982896301'

    return (
        <div className="min-h-screen bg-[#fdfbf8] flex items-center justify-center">
            <main className="w-full max-w-xl px-4 py-12 text-center">
                {receipt && <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"><CheckCircle className="h-10 w-10 text-green-700" /></div>}
                <h1 className="font-serif text-3xl font-bold text-[#2a2a2a] mb-4">{!receipt ? 'Não foi possível localizar a reserva' : closed ? 'Reserva encerrada' : canPay ? 'Reserva registrada' : 'Sua reserva'}</h1>
                <p className="text-[#8a5c3f] mb-6">
                    {!receipt ? 'Abra o link recebido ao concluir seus dados ou fale com a equipe do Aysú antes de fazer um pagamento.'
                        : canPay ? <>Etapa 2 de 2. Seu lugar já está bloqueado no sistema. Faça o Pix e envie o comprovante para a equipe validar o pagamento.</>
                            : receipt.status === 'PENDING' ? 'O prazo desta reserva terminou. Consulte a equipe antes de fazer um pagamento.'
                                : 'Confira a situação e as condições registradas abaixo. Em caso de dúvida, fale com a equipe do Aysú.'}
                </p>
                {receipt && quote && <section aria-label="Resumo da reserva" className="mb-6 rounded-xl border border-[#e0d5c7] bg-white p-6 text-left">
                    <h2 className="!text-lg font-semibold mb-2">{quote.spaceName} · {formatDateUTC(receipt.checkIn)}</h2>
                    <p className="mb-4 text-sm text-[#8a5c3f]">Situação: {getReservationStatusLabel(receipt.status)}</p>
                    <QuoteSummary quote={{ ...quote, totalPrice: Number(receipt.totalPrice), consumptionCredit: Number(receipt.consumptionCredit) }} />
                </section>}
                {canPay && <PixPayment />}
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mb-6 flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[#17693c] px-4 py-3 font-semibold !text-white transition-colors hover:bg-[#12522f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#17693c]">
                    <Mail className="h-5 w-5 shrink-0" /><span>{canPay ? 'Enviar comprovante no WhatsApp' : 'Falar com a equipe no WhatsApp'}</span>
                </a>
                <div className="flex flex-col gap-3">
                    <Link href="/"><Button className="w-full" size="lg"><Waves className="h-5 w-5" />Voltar ao início</Button></Link>
                    <Link href="/reservas"><Button variant="secondary" className="w-full" size="lg"><Calendar className="h-5 w-5" />Nova reserva</Button></Link>
                </div>
            </main>
        </div>
    )
}
