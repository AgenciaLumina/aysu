// AISSU Beach Lounge - Página de Checkout
// Formulário com Header/Footer padrão

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, CreditCard, Lock, User, ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { CancellationPolicyCheckbox, CancellationPolicyModal } from '@/components/reservas/CancellationPolicy'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Cabin {
    id: string
    name: string
    pricePerHour: number
}

function CheckoutContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const cabinId = searchParams.get('cabinId')
    const cabinName = searchParams.get('cabinName')
    const date = searchParams.get('date')
    const price = parseFloat(searchParams.get('price') || '0')
    const consumable = parseFloat(searchParams.get('consumable') || '0')

    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [policyAccepted, setPolicyAccepted] = useState(false)
    const [showPolicyModal, setShowPolicyModal] = useState(false)

    const [formData, setFormData] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerDocument: '',
        cardNumber: '',
        cardName: '',
        cardExpiry: '',
        cardCvv: '',
        installments: '1',
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!policyAccepted) {
            toast.error('Você precisa aceitar a política de cancelamento para continuar.')
            return
        }

        setSubmitting(true)

        try {
            const checkIn = new Date(date || '')
            const checkOut = new Date(checkIn)
            checkOut.setHours(checkOut.getHours() + 8) // Day use

            const reservationRes = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cabinId,
                    customerName: formData.customerName,
                    customerEmail: formData.customerEmail,
                    customerPhone: formData.customerPhone,
                    customerDocument: formData.customerDocument,
                    checkIn: checkIn.toISOString(),
                    checkOut: checkOut.toISOString(),
                    source: 'ONLINE',
                }),
            })

            const reservationData = await reservationRes.json()

            if (!reservationData.success) {
                throw new Error(reservationData.error || 'Erro ao criar reserva')
            }

            // Simula tokenização de cartão
            const tokenCardId = 'simulated-token-' + Date.now()

            const paymentRes = await fetch('/api/payments/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reservationId: reservationData.data.id,
                    amount: price,
                    tokenCardId,
                    installments: parseInt(formData.installments),
                    customerName: formData.customerName,
                    customerEmail: formData.customerEmail,
                }),
            })

            const paymentData = await paymentRes.json()

            if (!paymentData.success) {
                throw new Error(paymentData.error || 'Erro ao processar pagamento')
            }

            toast.success('Reserva confirmada!')
            router.push(`/reservas/sucesso?id=${reservationData.data.id}`)

        } catch (error) {
            console.error('Erro no checkout:', error)
            toast.error(error instanceof Error ? error.message : 'Erro ao processar reserva')
        } finally {
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

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Formulário */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Dados pessoais */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-[#d4a574]" />
                                        Seus dados
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-4">
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
                                        label="Telefone"
                                        name="customerPhone"
                                        value={formData.customerPhone}
                                        onChange={handleInputChange}
                                        placeholder="(11) 99999-9999"
                                        required
                                    />
                                </CardContent>
                            </Card>

                            {/* Dados do cartão */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-[#d4a574]" />
                                        Pagamento
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Input
                                        label="Número do cartão"
                                        name="cardNumber"
                                        value={formData.cardNumber}
                                        onChange={handleInputChange}
                                        placeholder="0000 0000 0000 0000"
                                        required
                                    />
                                    <Input
                                        label="Nome no cartão"
                                        name="cardName"
                                        value={formData.cardName}
                                        onChange={handleInputChange}
                                        placeholder="JOÃO SILVA"
                                        required
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Validade"
                                            name="cardExpiry"
                                            value={formData.cardExpiry}
                                            onChange={handleInputChange}
                                            placeholder="MM/AA"
                                            required
                                        />
                                        <Input
                                            label="CVV"
                                            name="cardCvv"
                                            value={formData.cardCvv}
                                            onChange={handleInputChange}
                                            placeholder="123"
                                            maxLength={4}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#2a2a2a] mb-1.5">Parcelas</label>
                                        <select
                                            name="installments"
                                            value={formData.installments}
                                            onChange={handleInputChange}
                                            className="w-full h-11 px-4 rounded-lg border border-[#e0d5c7] text-sm text-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                                        >
                                            {[1, 2, 3, 4, 5, 6].map(n => (
                                                <option key={n} value={n}>
                                                    {n}x de {formatCurrency(price / n)} {n === 1 && '(à vista)'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Política de Cancelamento */}
                            <CancellationPolicyCheckbox
                                checked={policyAccepted}
                                onChange={setPolicyAccepted}
                                onOpenPolicy={() => setShowPolicyModal(true)}
                            />

                            <Button type="submit" className="w-full" size="lg" isLoading={submitting} disabled={!policyAccepted}>
                                <Lock className="h-4 w-4" />
                                Confirmar pagamento de {formatCurrency(price)}
                            </Button>

                            <p className="text-xs text-center text-[#8a5c3f]/70">
                                Seus dados de pagamento são criptografados e processados com segurança.
                            </p>
                        </form>

                        {/* Modal Política de Cancelamento */}
                        <CancellationPolicyModal
                            isOpen={showPolicyModal}
                            onClose={() => setShowPolicyModal(false)}
                        />
                    </div>

                    {/* Resumo */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle>Resumo da reserva</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3 pb-4 border-b border-[#e0d5c7]">
                                    <div className="w-12 h-12 rounded-lg bg-[#f1c595]/30 flex items-center justify-center flex-shrink-0">
                                        <Image src="/logo_aysu.png" alt="Aysú" width={32} height={32} className="rounded-full" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-[#2a2a2a]">{cabinName}</p>
                                        <p className="text-sm text-[#8a5c3f]">{formatCurrency(consumable)} em consumo</p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-[#8a5c3f]" />
                                        <span>{date ? formatDate(date) : '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-[#8a5c3f]" />
                                        <span>Day use (08:00 - 18:00)</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[#e0d5c7]">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#8a5c3f]">Total</span>
                                        <span className="text-2xl font-bold text-[#d4a574]">{formatCurrency(price)}</span>
                                    </div>
                                    <p className="text-xs text-[#8a5c3f]/70 mt-1">Valor revertido em consumação no bar e restaurante</p>
                                </div>
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
