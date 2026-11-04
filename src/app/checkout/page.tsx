// AISSU Beach Lounge - Página de Checkout (Pix)
// Etapa 1: dados e aceite -> reserva persistida -> página de pagamento

'use client'

import { useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, Lock, User, ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { CancellationPolicyCheckbox, CancellationPolicyModal } from '@/components/reservas/CancellationPolicy'
import { formatDateUTC } from '@/lib/utils'
import { useBookingQuote } from '@/hooks/useBookingQuote'
import { QuoteSummary } from '@/components/reservas/CommercialConditions'
import toast from 'react-hot-toast'

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d)(\d{4})$/, '$1-$2')
        .slice(0, 15)
}

const maskCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14)
}

interface CheckoutFormData {
    customerName: string
    customerEmail: string
    customerPhone: string
    customerDocument: string
    notes?: string
}

function CheckoutContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const cabinId = searchParams.get('cabinId')
    const cabinName = searchParams.get('cabinName')
    const date = searchParams.get('date')
    const participants = Number(searchParams.get('participants') || '1')
    const { quote, loading: quoteLoading, error: quoteError, reload: reloadQuote } = useBookingQuote(cabinId, date, participants)
    const requestId = useRef<string | null>(null)
    const submissionInFlight = useRef(false)

    const [submitting, setSubmitting] = useState(false)
    const [policyAccepted, setPolicyAccepted] = useState(false)
    const [showPolicyModal, setShowPolicyModal] = useState(false)

    const [formData, setFormData] = useState<CheckoutFormData>({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerDocument: '',
        notes: '', // Initialize notes field
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { // Updated type to include HTMLTextAreaElement
        const { name } = e.target
        let { value } = e.target

        if (name === 'customerPhone') {
            value = maskPhone(value)
        }

        if (name === 'customerDocument') {
            value = maskCPF(value)
        }

        setFormData((prev: CheckoutFormData) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (submissionInFlight.current || !quote) return
        if (!policyAccepted) {
            toast.error('Você precisa aceitar a política de cancelamento para continuar.')
            return
        }

        submissionInFlight.current = true
        setSubmitting(true)

        try {
            // Parse da data garantindo o dia correto
            // Adicionamos "T12:00:00" para garantir que o dia não volte devido a UTC
            const targetDateStr = date || ''
            const checkIn = new Date(`${targetDateStr}T10:00:00-03:00`)
            const checkOut = new Date(`${targetDateStr}T18:00:00-03:00`)

            // Keep the same attempt on retries, including a refresh after a lost reply.
            // Only a one-way digest and random request ID are stored, never customer data.
            const identity = JSON.stringify([cabinId, date, participants, formData.customerName, formData.customerEmail.toLowerCase(), formData.customerPhone])
            const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(identity))
            const attemptKey = `aysu:reservation:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`
            try { requestId.current = sessionStorage.getItem(attemptKey) || crypto.randomUUID(); sessionStorage.setItem(attemptKey, requestId.current) }
            catch { requestId.current ??= crypto.randomUUID() }
            // 1. Criar Reserva no Backend
            const reservationRes = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cabinId,
                    customerName: formData.customerName,
                    customerEmail: formData.customerEmail,
                    customerPhone: formData.customerPhone,
                    customerDocument: formData.customerDocument,
                    notes: formData.notes?.trim() || undefined,
                    checkIn: checkIn.toISOString(),
                    checkOut: checkOut.toISOString(),
                    totalPrice: quote.totalPrice,
                    participantCount: participants,
                    requestId: requestId.current,
                    policyAccepted,
                    source: 'ONLINE', // Status será PENDING automaticamente na API
                }),
            })

            const reservationData = await reservationRes.json()

            if (!reservationRes.ok || !reservationData.success || !reservationData.data?.receiptToken) {
                if (reservationRes.status >= 400 && reservationRes.status < 500) {
                    reloadQuote()
                    setPolicyAccepted(false)
                }
                throw new Error(reservationData.error || 'Erro ao criar reserva')
            }

            // Payment is only displayed by the next page after the server commits the hold.
            router.replace(`/reservas/sucesso?token=${encodeURIComponent(reservationData.data.receiptToken)}`)
            toast.success('Reserva registrada. Agora você pode fazer o Pix e enviar o comprovante.')

        } catch (error) {

            toast.error(error instanceof Error ? error.message : 'Erro ao processar reserva')
        } finally {
            submissionInFlight.current = false
            setSubmitting(false)
        }
    }

    if (!cabinId || !cabinName) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-[#8a5c3f]">Nenhuma reserva selecionada.</p>
                <Link href="/reservas">
                    <Button>Ir para reservas</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#fdfbf8]">
            <Header variant="solid" />

            <main className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
                {/* Voltar */}
                <Link href="/reservas" className="inline-flex items-center gap-2 text-[#8a5c3f] hover:text-[#d4a574] mb-8 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar às reservas
                </Link>

                <h1 className="mb-2 font-serif text-3xl font-bold text-[#2a2a2a]">Dados da reserva</h1>
                <p className="mb-8 text-[#8a5c3f]">Etapa 1 de 2. Ao seguir, seu lugar será bloqueado e você verá os dados para pagamento.</p>
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Formulário */}
                    <div className="lg:col-span-2 min-w-0 order-last lg:order-first">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Dados pessoais */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-[#d4a574]" />
                                        Seus dados
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <fieldset disabled={submitting} className="grid md:grid-cols-2 gap-4">
                                    <Input
                                        label="Nome completo"
                                        name="customerName"
                                        value={formData.customerName}
                                        onChange={handleInputChange}
                                        placeholder="João Silva"
                                        required
                                    />
                                    <Input
                                        label="CPF"
                                        name="customerDocument"
                                        value={formData.customerDocument}
                                        onChange={handleInputChange}
                                        placeholder="000.000.000-00"
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        name="customerEmail"
                                        value={formData.customerEmail}
                                        onChange={handleInputChange}
                                        placeholder="joao@email.com"
                                        required
                                    />
                                    <Input
                                        label="Telefone/WhatsApp (Opcional)"
                                        name="customerPhone"
                                        value={formData.customerPhone}
                                        onChange={handleInputChange}
                                        placeholder="(11) 99999-9999"
                                    />
                                    <div className="md:col-span-2">
                                        <Textarea
                                            label="Observações (Opcional)"
                                            name="notes"
                                            value={formData.notes || ''}
                                            onChange={handleInputChange}
                                            placeholder="Ex: Aniversário, restrições alimentares, etc."
                                            rows={3}
                                        />
                                    </div>
                                    </fieldset>
                                </CardContent>
                            </Card>

                            {/* Política de Cancelamento */}
                            <CancellationPolicyCheckbox
                                checked={policyAccepted}
                                onChange={setPolicyAccepted}
                                onOpenPolicy={() => setShowPolicyModal(true)}
                            />

                            <Button type="submit" className="w-full whitespace-normal" size="lg" isLoading={submitting} disabled={!quote || !policyAccepted}>
                                <Lock className="h-4 w-4" />
                                Seguir com a reserva
                            </Button>

                        </form>

                        {/* Modal Política de Cancelamento */}
                        <CancellationPolicyModal
                            isOpen={showPolicyModal}
                            onClose={() => setShowPolicyModal(false)}
                        />
                    </div>

                    {/* Resumo */}
                    <div className="lg:col-span-1 min-w-0 order-first lg:order-last">
                        <Card className="lg:sticky lg:top-24">
                            <CardHeader>
                                <CardTitle>Resumo da reserva</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3 pb-4 border-b border-[#e0d5c7]">
                                    <div className="w-12 h-12 rounded-lg bg-[#f1c595]/30 flex items-center justify-center flex-shrink-0">
                                        <Image src="/logo_aysu.png" alt="Aysú" width={32} height={32} className="rounded-full" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-[#2a2a2a]">{quote?.spaceName || cabinName}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-[#8a5c3f] flex items-center gap-2"><Calendar className="h-4 w-4" /> Data</span>
                                        <span>{date ? formatDateUTC(date) : '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-[#8a5c3f]" />
                                        <span>Day use (10:00 - 18:00)</span>
                                    </div>
                                </div>

                                {quoteLoading && <p role="status">Consultando valores e disponibilidade...</p>}
                                {quoteError && <div role="alert"><p className="text-red-700">{quoteError}</p><button type="button" onClick={reloadQuote} className="mt-2 underline text-[#8a5c3f]">Consultar novamente</button></div>}
                                {quote && <QuoteSummary quote={quote} />}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    )
}
