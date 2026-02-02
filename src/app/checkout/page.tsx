// AISSU Beach Lounge - Página de Checkout (Pix)
// Fluxo simplificado: Dados Pessoais -> Pix -> WhatsApp

'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, Lock, User, ArrowLeft, Copy, CheckCircle2, QrCode } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { CancellationPolicyCheckbox, CancellationPolicyModal } from '@/components/reservas/CancellationPolicy'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

// Chave Pix do Cliente
const PIX_DATA = {
    key: '57.505.585/0001-19',
    type: 'CNPJ',
    bank: 'Itaú',
    name: 'Aysú Beach Lounge'
}

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

function CheckoutContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const cabinId = searchParams.get('cabinId')
    const cabinName = searchParams.get('cabinName')
    const date = searchParams.get('date')
    const price = parseFloat(searchParams.get('price') || '0')
    const consumable = parseFloat(searchParams.get('consumable') || '0')

    const [submitting, setSubmitting] = useState(false)
    const [policyAccepted, setPolicyAccepted] = useState(false)
    const [showPolicyModal, setShowPolicyModal] = useState(false)

    const [formData, setFormData] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerDocument: '',
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target

        if (name === 'customerPhone') {
            value = maskPhone(value)
        }

        if (name === 'customerDocument') {
            value = maskCPF(value)
        }

        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const copyPixKey = () => {
        navigator.clipboard.writeText(PIX_DATA.key)
        toast.success('Chave Pix copiada!')
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
            checkIn.setHours(10, 0, 0, 0) // Day use início 10h
            const checkOut = new Date(checkIn)
            checkOut.setHours(18, 0, 0, 0) // Day use fim 18h

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
                    checkIn: checkIn.toISOString(),
                    checkOut: checkOut.toISOString(),
                    source: 'ONLINE', // Status será PENDING automaticamente na API
                }),
            })

            const reservationData = await reservationRes.json()

            if (!reservationData.success) {
                throw new Error(reservationData.error || 'Erro ao criar reserva')
            }

            // 2. Preparar Mensagem WhatsApp
            const message = `Olá! Acabei de fazer a reserva *#${reservationData.data.id.slice(0, 6).toUpperCase()}* pelo site.
            
📍 *Espaço:* ${cabinName}
📅 *Data:* ${formatDate(checkIn)}
💰 *Valor:* ${formatCurrency(price)}
            
Estou enviando o comprovante do Pix em anexo.`

            const whatsappUrl = `https://wa.me/5512982896301?text=${encodeURIComponent(message)}`

            // 3. Redirecionar
            window.open(whatsappUrl, '_blank')
            router.push(`/reservas/sucesso?id=${reservationData.data.id}`)
            toast.success('Reserva iniciada! Envie o comprovante no WhatsApp.')

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

                            {/* Área do Pix */}
                            <Card className="border-[#d4a574]/30 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#d4a574]/10 rounded-bl-[4rem]" />
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded bg-[#d4a574]/20 flex items-center justify-center">
                                            <QrCode className="w-5 h-5 text-[#d4a574]" />
                                        </div>
                                        Pagamento via Pix
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="bg-[#fcfaf8] p-6 rounded-xl border border-[#e0d5c7] text-center">
                                        <p className="text-sm font-medium text-[#8a5c3f] mb-2 uppercase tracking-wide">Chave Pix ({PIX_DATA.type})</p>
                                        <p className="text-2xl md:text-3xl font-bold text-[#2a2a2a] mb-4 font-mono">{PIX_DATA.key}</p>

                                        <button
                                            type="button"
                                            onClick={copyPixKey}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4a574]/10 hover:bg-[#d4a574]/20 text-[#d4a574] rounded-lg text-sm font-medium transition-colors"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Copiar chave
                                        </button>
                                    </div>

                                    <div className="flex flex-col md:flex-row justify-center gap-4 text-center md:gap-12 md:text-left text-sm text-[#5a4c40]">
                                        <div>
                                            <span className="block text-[#8a5c3f] text-xs uppercase mb-1">Banco</span>
                                            <span className="font-semibold">{PIX_DATA.bank}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[#8a5c3f] text-xs uppercase mb-1">Beneficiário</span>
                                            <span className="font-semibold">{PIX_DATA.name}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                        <p>Ao confirmar, <strong>você será redirecionado para o WhatsApp</strong> para enviar o comprovante de pagamento.</p>
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
                                Confirmar Reserva e Enviar Comprovante
                            </Button>

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
                                        <span>Day use (10:00 - 18:00)</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[#e0d5c7]">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[#8a5c3f]">Total a pagar</span>
                                        <span className="text-2xl font-bold text-[#d4a574]">{formatCurrency(price)}</span>
                                    </div>
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
