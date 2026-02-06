'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Phone, Calendar as CalendarIcon, Home, MessageSquare, Save, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { isHoliday, getHolidayName } from '@/lib/holidays'
import toast from 'react-hot-toast'

interface Space {
    id: string
    name: string
    dailyPrice: number
    holidayPrice: number
    capacity: string
}

const SPACES: Space[] = [
    { id: 'bangalo-lateral', name: 'Bangalô Lateral', dailyPrice: 600, holidayPrice: 1000, capacity: '4-5 pessoas' },
    { id: 'bangalo-piscina', name: 'Bangalô Piscina', dailyPrice: 600, holidayPrice: 1800, capacity: '6 pessoas' },
    { id: 'bangalo-frente-mar', name: 'Bangalô Frente Mar', dailyPrice: 720, holidayPrice: 1800, capacity: '6-8 pessoas' },
    { id: 'bangalo-central', name: 'Bangalô Central (Galera)', dailyPrice: 1500, holidayPrice: 2500, capacity: '10 pessoas' },
    { id: 'sunbed-casal', name: 'Sunbed Casal', dailyPrice: 300, holidayPrice: 500, capacity: '2 pessoas' },
]

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Helper to get price based on holiday status
const getPrice = (space: Space, date: Date | null): number => {
    if (!date) return space.dailyPrice
    const dateStr = date.toISOString().split('T')[0]
    return isHoliday(dateStr) ? space.holidayPrice : space.dailyPrice
}

export default function NovaReservaManualPage() {
    const router = useRouter()
    const [step, setStep] = useState(1) // 1: Space, 2: Date, 3: Customer, 4: Confirm
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [occupiedDates, setOccupiedDates] = useState<string[]>([])
    const [closedDates, setClosedDates] = useState<Array<{ date: string; reason: string }>>([])
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [form, setForm] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerDocument: '',
        notes: '',
    })

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

    // Fetch closed dates on mount
    useEffect(() => {
        fetchClosedDates()
    }, [])

    // Fetch occupied dates when space is selected
    useEffect(() => {
        if (selectedSpace) {
            fetchOccupiedDates(selectedSpace.id)
        }
    }, [selectedSpace, currentMonth])

    const fetchClosedDates = async () => {
        try {
            const res = await fetch('/api/closed-dates')
            const data = await res.json()
            if (data.success) {
                setClosedDates(data.data)
            }
        } catch (error) {
            console.error('Error fetching closed dates:', error)
        }
    }

    const fetchOccupiedDates = async (spaceId: string) => {
        try {
            const year = currentMonth.getFullYear()
            const month = currentMonth.getMonth() + 1
            const res = await fetch(`/api/reservations/availability?cabinId=${spaceId}&year=${year}&month=${month}`)
            const data = await res.json()

            if (data.success && data.data) {
                // Extrair datas ocupadas da resposta
                const occupied = data.data
                    .filter((d: { available: boolean }) => !d.available)
                    .map((d: { date: string }) => d.date)
                setOccupiedDates(occupied)
            } else {
                setOccupiedDates([])
            }
        } catch (error) {
            console.error('Error fetching availability:', error)
            setOccupiedDates([])
        }
    }

    const handleSpaceSelect = (space: Space) => {
        setSelectedSpace(space)
        setStep(2)
    }

    const handleDateSelect = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0]
        const isClosed = closedDates.some(cd => cd.date === dateStr)
        if (!occupiedDates.includes(dateStr) && !isClosed) {
            setSelectedDate(date)
            setStep(3)
        }
    }

    const handleSubmit = async () => {
        if (!form.customerName || !form.customerPhone) {
            toast.error('Preencha nome e telefone')
            return
        }

        if (!selectedSpace || !selectedDate) {
            toast.error('Selecione espaço e data')
            return
        }

        setIsSubmitting(true)
        try {
            const checkIn = new Date(selectedDate)
            checkIn.setHours(10, 0, 0, 0) // Padrão Day Use: Início as 10:00

            const checkOut = new Date(checkIn)
            checkOut.setHours(18, 0, 0, 0) // Padrão Day Use: Fim as 18:00

            const totalPrice = getPrice(selectedSpace, selectedDate)

            const res = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cabinId: selectedSpace.id,
                    customerName: form.customerName,
                    customerPhone: form.customerPhone,
                    customerEmail: form.customerEmail ? form.customerEmail.toLowerCase() : `offline-${Date.now()}@aissu.com.br`,
                    customerDocument: form.customerDocument,
                    checkIn: checkIn.toISOString(),
                    checkOut: checkOut.toISOString(),
                    totalPrice,
                    source: 'OFFLINE',
                    notes: form.notes,
                }),
            })

            const data = await res.json()

            if (data.success) {
                toast.success('Reserva criada com sucesso!')
                router.push('/admin/reservas') // Redireciona para a lista de reservas
            } else {
                toast.error(data.error || 'Erro ao criar reserva')
            }
        } catch (error) {
            console.error('Error creating reservation:', error)
            toast.error('Erro ao conectar com o servidor')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Gerar dias do mês com informações de feriados
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const days: Array<{
            date: Date | null
            isCurrentMonth: boolean
            isOccupied: boolean
            isClosed: boolean
            closedReason?: string
            isPast: boolean
            isHoliday: boolean
            holidayName: string | undefined
        }> = []

        // Dias vazios do início
        const firstDayOfWeek = firstDay.getDay()
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push({ date: null, isCurrentMonth: false, isOccupied: false, isClosed: false, isPast: false, isHoliday: false, holidayName: undefined })
        }

        // Dias do mês
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(year, month, i)
            const dateStr = date.toISOString().split('T')[0]
            const holiday = isHoliday(dateStr)
            const closedInfo = closedDates.find(cd => cd.date === dateStr)

            days.push({
                date,
                isCurrentMonth: true,
                isOccupied: occupiedDates.includes(dateStr),
                isClosed: !!closedInfo,
                closedReason: closedInfo?.reason,
                isPast: date < today,
                isHoliday: !!holiday,
                holidayName: holiday?.name
            })
        }

        return days
    }, [currentMonth, occupiedDates, closedDates])

    const changeMonth = (offset: number) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1))
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/admin/frente-de-caixa"
                    className="p-2 rounded-lg hover:bg-[#f5f0e8] text-[#8a5c3f] transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Nova Reserva Manual</h1>
                    <p className="text-[#8a5c3f]">Passo {step} de 3</p>
                </div>
            </div>

            {/* Step 1: Space Selection */}
            {step === 1 && (
                <div>
                    <h2 className="text-xl font-serif font-bold text-[#2a2a2a] mb-6">Escolha o Espaço</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {SPACES.map(space => (
                            <Card
                                key={space.id}
                                className="cursor-pointer hover:shadow-xl transition-shadow"
                                onClick={() => handleSpaceSelect(space)}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#f1c595]/30 mb-4">
                                        <Home className="h-6 w-6 text-[#d4a574]" />
                                    </div>
                                    <h3 className="font-serif text-lg font-bold text-[#2a2a2a] mb-2">{space.name}</h3>
                                    <p className="text-sm text-[#8a5c3f] mb-3">{space.capacity}</p>
                                    <p className="text-2xl font-bold text-[#d4a574]">
                                        R$ {getPrice(space, selectedDate).toLocaleString('pt-BR')}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Calendar */}
            {step === 2 && selectedSpace && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-serif font-bold text-[#2a2a2a]">Escolha a Data</h2>
                            <p className="text-[#8a5c3f]">{selectedSpace.name}</p>
                        </div>
                        <Button variant="secondary" onClick={() => setStep(1)}>
                            Trocar Espaço
                        </Button>
                    </div>

                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => changeMonth(-1)}
                                    className="p-2 hover:bg-[#f5f0e8] rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <CardTitle>
                                    {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                </CardTitle>
                                <button
                                    onClick={() => changeMonth(1)}
                                    className="p-2 hover:bg-[#f5f0e8] rounded-lg transition-colors"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Weekday headers */}
                            <div className="grid grid-cols-7 gap-2 mb-2">
                                {WEEKDAYS.map(day => (
                                    <div key={day} className="text-center text-sm font-medium text-[#8a5c3f] py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar grid */}
                            <div className="grid grid-cols-7 gap-2">
                                {calendarDays.map((day, i) => {
                                    if (!day.date) {
                                        return <div key={i} className="aspect-square" />
                                    }

                                    return (
                                        <div key={i} className="relative group">
                                            <button
                                                onClick={() => !day.isOccupied && !day.isClosed && !day.isPast && handleDateSelect(day.date!)}
                                                disabled={day.isOccupied || day.isClosed || day.isPast}
                                                className={`
                                                    w-full aspect-square p-2 rounded-lg text-sm transition-all flex flex-col items-center justify-center
                                                    ${day.isOccupied ? 'bg-red-100 text-red-400 cursor-not-allowed' : ''}
                                                    ${day.isClosed && !day.isOccupied ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                                                    ${day.isPast ? 'text-[#b0a090] cursor-not-allowed' : ''}
                                                    ${day.isHoliday && !day.isOccupied && !day.isClosed && !day.isPast ? 'text-amber-600 font-medium' : ''}
                                                    ${!day.isOccupied && !day.isClosed && !day.isPast
                                                        ? 'hover:bg-[#f1c595]/30 hover:text-[#d4a574] cursor-pointer'
                                                        : ''}
                                                `}
                                            >
                                                {day.date.getDate()}
                                                {day.isHoliday && (
                                                    <span className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />
                                                )}
                                            </button>
                                            {/* Tooltip for Holiday or Closed */}
                                            {(day.holidayName || day.closedReason) && (
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                    {day.closedReason || day.holidayName}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap gap-4 mt-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-red-100 rounded"></div>
                                    <span className="text-[#8a5c3f]">Ocupado</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-gray-100 rounded"></div>
                                    <span className="text-[#8a5c3f]">Espaço Fechado</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-white border border-[#e0d5c7] rounded"></div>
                                    <span className="text-[#8a5c3f]">Disponível</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 flex items-center justify-center text-amber-600 font-bold text-xs">•</div>
                                    <span className="text-[#8a5c3f]">Feriado</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Step 3: Customer Info */}
            {step === 3 && selectedSpace && selectedDate && (
                <div className="max-w-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-serif font-bold text-[#2a2a2a]">Dados do Cliente</h2>
                            <p className="text-[#8a5c3f]">
                                {selectedSpace.name} • {selectedDate.toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                        <Button variant="secondary" onClick={() => setStep(2)}>
                            Trocar Data
                        </Button>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-[#d4a574]" />
                                    Informações do Cliente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#2a2a2a] mb-2">
                                        Nome Completo *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.customerName}
                                        onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                                        placeholder="João da Silva"
                                        className="w-full px-4 py-3 rounded-xl border border-[#e0d5c7] focus:ring-2 focus:ring-[#d4a574] focus:border-[#d4a574]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#2a2a2a] mb-2">
                                            Telefone *
                                        </label>
                                        <input
                                            type="tel"
                                            value={form.customerPhone}
                                            onChange={(e) => setForm({ ...form, customerPhone: maskPhone(e.target.value) })}
                                            placeholder="(11) 99999-9999"
                                            className="w-full px-4 py-3 rounded-xl border border-[#e0d5c7] focus:ring-2 focus:ring-[#d4a574] focus:border-[#d4a574]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[#2a2a2a] mb-2">
                                            CPF (opcional)
                                        </label>
                                        <input
                                            type="text"
                                            value={form.customerDocument}
                                            onChange={(e) => setForm({ ...form, customerDocument: maskCPF(e.target.value) })}
                                            placeholder="000.000.000-00"
                                            className="w-full px-4 py-3 rounded-xl border border-[#e0d5c7] focus:ring-2 focus:ring-[#d4a574] focus:border-[#d4a574]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#2a2a2a] mb-2">
                                        E-mail (opcional)
                                    </label>
                                    <input
                                        type="email"
                                        value={form.customerEmail}
                                        onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                                        placeholder="email@exemplo.com"
                                        className="w-full px-4 py-3 rounded-xl border border-[#e0d5c7] focus:ring-2 focus:ring-[#d4a574] focus:border-[#d4a574]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#2a2a2a] mb-2">
                                        Observações
                                    </label>
                                    <textarea
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        placeholder="Pedidos especiais, observações..."
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-[#e0d5c7] focus:ring-2 focus:ring-[#d4a574] focus:border-[#d4a574] resize-none"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary */}
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-[#2a2a2a]">{selectedSpace.name}</p>
                                        <p className="text-sm text-[#8a5c3f]">{selectedSpace.capacity}</p>
                                        <p className="text-sm text-[#8a5c3f] mt-2">
                                            <CalendarIcon className="h-4 w-4 inline mr-1" />
                                            {selectedDate.toLocaleDateString('pt-BR', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <p className="text-2xl font-bold text-[#d4a574]">
                                        R$ {getPrice(selectedSpace, selectedDate).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                <Save className="h-4 w-4" />
                                {isSubmitting ? 'Criando...' : 'Criar Reserva'}
                            </Button>
                            <Link href="/admin/frente-de-caixa">
                                <Button variant="secondary">Cancelar</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
