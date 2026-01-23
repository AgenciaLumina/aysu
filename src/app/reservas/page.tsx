// AISSU Beach Lounge - Página de Reservas Premium
// Design inspirado em Airbnb Luxe + Stripe + Linear
// Padrão visual de alto nível para beach club exclusivo

'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Users, Check, ChevronRight, ChevronLeft, MapPin, Utensils } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { isHoliday } from '@/lib/holidays'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

// ==========================================
// DADOS DOS ESPAÇOS (Informações reais)
// ==========================================

interface SpaceType {
    id: string
    name: string
    slug: string
    image: string
    capacity: string
    capacityNum: number
    dailyPrice: number
    consumable: number
    description: string
    units: number
    category: 'bangalo' | 'sunbed'
    tier: 'standard' | 'premium' | 'galera' | 'romantic'
}

const spaceTypes: SpaceType[] = [
    // BANGALÔ LATERAL - Nível 1
    {
        id: 'bangalo-lateral',
        name: 'Bangalô Lateral',
        slug: 'lateral',
        image: '/espacos/bangalo7.jpeg',
        capacity: '4 a 5 pessoas',
        capacityNum: 5,
        dailyPrice: 1000,
        consumable: 700,
        description: 'Ideal para casais + amigos',
        units: 6,
        category: 'bangalo',
        tier: 'standard',
    },
    // BANGALÔ PISCINA - Nível 2
    {
        id: 'bangalo-piscina',
        name: 'Bangalô Piscina',
        slug: 'piscina',
        image: '/espacos/bangalo8.jpeg',
        capacity: '6 pessoas',
        capacityNum: 6,
        dailyPrice: 1800,
        consumable: 1300,
        description: 'Vista + status à beira da piscina',
        units: 2,
        category: 'bangalo',
        tier: 'premium',
    },
    // BANGALÔ FRENTE MAR - Nível 2
    {
        id: 'bangalo-frente-mar',
        name: 'Bangalô Frente Mar',
        slug: 'frente-mar',
        image: '/espacos/bangalo9.jpeg',
        capacity: '6 a 8 pessoas',
        capacityNum: 8,
        dailyPrice: 1800,
        consumable: 1300,
        description: 'Posição privilegiada de frente para o mar',
        units: 4,
        category: 'bangalo',
        tier: 'premium',
    },
    // BANGALÔ CENTRAL - Nível 3 (Flagship)
    {
        id: 'bangalo-central',
        name: 'Bangalô Central',
        slug: 'central',
        image: '/espacos/bangalo10.jpeg',
        capacity: 'até 10 pessoas',
        capacityNum: 10,
        dailyPrice: 2500,
        consumable: 2000,
        description: 'Espaço icônico. Experiência Aysú Raiz',
        units: 1,
        category: 'bangalo',
        tier: 'galera',
    },
    // SUNBED CASAL
    {
        id: 'sunbed-casal',
        name: 'Sunbed Casal',
        slug: 'sunbed',
        image: '/espacos/Sunbeds.jpeg',
        capacity: '2 pessoas (casal)',
        capacityNum: 2,
        dailyPrice: 500,
        consumable: 350,
        description: 'Cama de praia exclusiva para casais',
        units: 4,
        category: 'sunbed',
        tier: 'romantic',
    },
]

// ==========================================
// HELPERS
// ==========================================

const formatDateBR = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

const formatDateISO = (date: Date) => {
    return date.toISOString().split('T')[0]
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const soldOutDates = ['2026-12-25', '2026-12-31']

const getTierLabel = (tier: SpaceType['tier']) => {
    switch (tier) {
        case 'standard': return 'Essencial'
        case 'premium': return 'Premium'
        case 'galera': return 'Galera'
        case 'romantic': return 'Romântico'
    }
}

const getTierColor = (tier: SpaceType['tier']) => {
    switch (tier) {
        case 'standard': return 'bg-[#5a7c65] text-white border-[#4a6c55]'  // Verde sólido elegante
        case 'premium': return 'bg-[#c9a66b] text-white border-[#b8955a]'   // Dourado sólido
        case 'galera': return 'bg-[#8b4513] text-white border-[#7a3c0f]'  // Marrom premium (chocolate)
        case 'romantic': return 'bg-[#b87d6c] text-white border-[#a76c5b]'  // Rosa terroso elegante
    }
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function ReservasPage() {
    const router = useRouter()
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedSpace, setSelectedSpace] = useState<SpaceType | null>(null)
    const [currentMonth, setCurrentMonth] = useState(() => {
        // Default to February 2026 for Carnaval
        return new Date(2026, 1, 1)
    })

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startWeekday = firstDay.getDay()

        const days: { date: Date | null; isPast: boolean; isHoliday: boolean; holidayName?: string; isSoldOut: boolean }[] = []

        for (let i = 0; i < startWeekday; i++) {
            days.push({ date: null, isPast: true, isHoliday: false, isSoldOut: false })
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day)
            const dateStr = formatDateISO(date)
            const holiday = isHoliday(dateStr)

            days.push({
                date,
                isPast: date < today,
                isHoliday: !!holiday,
                holidayName: holiday?.name,
                isSoldOut: soldOutDates.includes(dateStr),
            })
        }

        return days
    }, [currentMonth])

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date)
        setTimeout(() => {
            document.getElementById('espacos')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleSpaceSelect = (space: SpaceType) => {
        setSelectedSpace(space)
    }

    const handleReserve = () => {
        if (selectedDate && selectedSpace) {
            const params = new URLSearchParams({
                cabinId: selectedSpace.id,
                cabinName: selectedSpace.name,
                date: formatDateISO(selectedDate),
                price: selectedSpace.dailyPrice.toString(),
                consumable: selectedSpace.consumable.toString(),
            })
            router.push(`/checkout?${params.toString()}`)
        }
    }

    const canGoPrev = useMemo(() => {
        const now = new Date()
        return currentMonth > new Date(now.getFullYear(), now.getMonth(), 1)
    }, [currentMonth])

    return (
        <div className="min-h-screen bg-white">
            <Header variant="transparent" />

            {/* ==========================================
                HERO SECTION - Minimalista e elegante
                ========================================== */}
            {/* ==========================================
                HERO SECTION - Padronizado com Eventos
                ========================================== */}
            <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
                {/* Background Video */}
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                    <iframe
                        className="absolute top-1/2 left-1/2 min-w-[100vw] min-h-[100vh] w-auto h-auto -translate-x-1/2 -translate-y-1/2 scale-150"
                        src="https://www.youtube.com/embed/brLps0wydgU?autoplay=1&mute=1&loop=1&playlist=brLps0wydgU&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1&origin=https://aysu.com.br"
                        title="Aysú Beach Lounge"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        style={{ border: 'none' }}
                    />
                </div>
                {/* Gradiente Overlay (Padronizado) */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />

                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    <p className="text-sm tracking-[0.3em] uppercase text-white/90 mb-4">
                        Praia de Massaguaçu
                    </p>
                    <h1
                        className="font-serif text-4xl md:text-6xl lg:text-7xl font-light mb-6"
                        style={{ color: '#FFFFFF' }}
                    >
                        Reserve seu Espaço
                    </h1>
                    <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light">
                        Experiência day use exclusiva com consumação inclusa
                    </p>
                </div>
            </section>

            {/* ==========================================
                CALENDÁRIO - Card flutuante premium
                ========================================== */}
            <section className="max-w-lg mx-auto px-6 -mt-24 relative z-10 pb-16">
                <div className="bg-white rounded-3xl shadow-2xl shadow-black/10 border border-gray-100">
                    {/* Carnaval Badge */}
                    {currentMonth.getMonth() === 1 && (
                        <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white px-6 py-4 rounded-t-3xl">
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-2xl">🎭</span>
                                <div className="text-center">
                                    <p className="font-bold text-lg">Carnaval 2026</p>
                                    <p className="text-sm text-white/90">13 a 18 de Fevereiro • Reserve agora!</p>
                                </div>
                                <span className="text-2xl">🎉</span>
                            </div>
                        </div>
                    )}

                    {/* Calendar Header */}
                    <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--aissu-border)]">
                        <button
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                            disabled={!canGoPrev}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${canGoPrev
                                ? 'hover:bg-[var(--aissu-nude-light)] text-[var(--aissu-wood)]'
                                : 'text-gray-200 cursor-not-allowed'
                                }`}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>

                        <div className="text-center">
                            <h3 className="text-xl font-semibold" style={{ color: 'var(--aissu-chocolate)' }}>
                                {MONTHS[currentMonth.getMonth()]}
                            </h3>
                            <p className="text-sm" style={{ color: 'var(--aissu-wood)' }}>{currentMonth.getFullYear()}</p>
                        </div>

                        <button
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--aissu-nude-light)] text-[var(--aissu-wood)] transition-all"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="p-6">
                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-4">
                            {WEEKDAYS_SHORT.map((day, i) => (
                                <div key={i} className="text-center text-xs font-medium py-2" style={{ color: 'var(--aissu-text-muted)' }}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, idx) => {
                                if (!day.date) {
                                    return <div key={idx} className="aspect-square" />
                                }

                                const dateStr = formatDateISO(day.date)
                                const isSelected = selectedDate && formatDateISO(selectedDate) === dateStr
                                const isDisabled = day.isPast || day.isSoldOut
                                const isToday = formatDateISO(new Date()) === dateStr

                                return (
                                    <div key={idx} className="relative group">
                                        <button
                                            onClick={() => !isDisabled && handleDateSelect(day.date!)}
                                            disabled={isDisabled}
                                            className={`
                                                w-full aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all
                                                ${isSelected
                                                    ? 'bg-gray-900 text-white shadow-lg scale-105'
                                                    : isDisabled
                                                        ? 'text-gray-200 cursor-not-allowed'
                                                        : isToday
                                                            ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                                            : day.isHoliday
                                                                ? 'text-amber-600 hover:bg-amber-50'
                                                                : 'text-gray-700 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            <span>{day.date.getDate()}</span>
                                            {day.isHoliday && !isSelected && (
                                                <span className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />
                                            )}
                                        </button>
                                        {/* Holiday Tooltip */}
                                        {day.holidayName && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                                {day.holidayName}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900" />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Selected Date */}
                    {selectedDate && (
                        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Data selecionada</p>
                                    <p className="text-lg font-semibold text-gray-900 capitalize">{formatDateBR(selectedDate)}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                                    <Check className="h-5 w-5 text-white" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ==========================================
                ESPAÇOS - Grid elegante
                ========================================== */}
            <section id="espacos" className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-light mb-4" style={{ color: 'var(--aissu-chocolate)', fontFamily: 'var(--font-display)' }}>
                        {selectedDate ? 'Escolha seu Espaço' : 'Nossos Espaços'}
                    </h2>
                    <p className="max-w-xl mx-auto" style={{ color: 'var(--aissu-wood)' }}>
                        Todos os espaços incluem pulseira dourada com acesso VIP e valor em consumação
                    </p>
                </div>

                {/* Space Grid */}
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {spaceTypes.map((space) => (
                        <article
                            key={space.id}
                            onClick={() => selectedDate && handleSpaceSelect(space)}
                            className={`group bg-white rounded-2xl overflow-hidden transition-all duration-500 ${selectedDate
                                ? 'cursor-pointer hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1'
                                : 'opacity-50 cursor-not-allowed'
                                } ${selectedSpace?.id === space.id
                                    ? 'ring-2 ring-gray-900 shadow-2xl shadow-black/10'
                                    : 'shadow-lg shadow-black/5'
                                }`}
                        >
                            {/* Image */}
                            <div className="relative aspect-[16/10] overflow-hidden">
                                <Image
                                    src={space.image}
                                    alt={space.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                                {/* Top Left: Tier Badge */}
                                <div className="absolute top-4 left-4">
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getTierColor(space.tier)}`}>
                                        {getTierLabel(space.tier)}
                                    </span>
                                </div>

                                {/* Top Right: Availability */}
                                <div className="absolute top-4 right-4">
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white/95 backdrop-blur-sm text-gray-900 shadow-lg">
                                        {space.units} {space.units === 1 ? 'unidade' : 'unidades'}
                                    </span>
                                </div>

                                {/* Bottom: Quick Info */}
                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 text-white text-sm">
                                        <Users className="h-4 w-4" />
                                        {space.capacity}
                                    </span>
                                </div>

                                {/* Selection Overlay */}
                                {selectedSpace?.id === space.id && (
                                    <div className="absolute inset-0 bg-gray-900/30 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl">
                                            <Check className="h-8 w-8 text-gray-900" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Title */}
                                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--aissu-chocolate)' }}>{space.name}</h3>
                                <p className="text-sm mb-6" style={{ color: 'var(--aissu-wood)' }}>{space.description}</p>

                                {/* Pricing */}
                                <div className="flex items-end justify-between pt-4 border-t border-[var(--aissu-border)]">
                                    <div>
                                        <p className="text-2xl font-bold" style={{ color: 'var(--aissu-chocolate)' }}>{formatCurrency(space.dailyPrice)}</p>
                                        <p className="text-xs" style={{ color: 'var(--aissu-text-muted)' }}>por dia</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1.5 text-emerald-600">
                                            <Utensils className="h-4 w-4" />
                                            <span className="font-semibold">{formatCurrency(space.consumable)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">em consumação</p>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {/* ==========================================
                ÁREAS NÃO-RESERVÁVEIS - Elegante Info Section
                ========================================== */}
            <section className="py-20" style={{ backgroundColor: 'var(--aissu-cream)' }}>
                <div className="max-w-5xl mx-auto px-6">
                    {/* Header elegante */}
                    <div className="text-center mb-16">
                        <p className="text-sm font-medium tracking-widest uppercase mb-4" style={{ color: 'var(--aissu-terra)' }}>
                            Ordem de Chegada
                        </p>
                        <h2 className="text-3xl md:text-4xl font-light mb-4" style={{ color: 'var(--aissu-chocolate)', fontFamily: 'var(--font-display)' }}>
                            Experiência Day Use
                        </h2>
                        <p className="max-w-md mx-auto" style={{ color: 'var(--aissu-wood)' }}>
                            Sem reserva prévia. Disponibilidade por ordem de chegada, sujeita à lotação.
                        </p>
                    </div>

                    {/* Cards elegantes */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Day Use Praia */}
                        <div className="group bg-white rounded-3xl p-8 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <span className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 shadow-sm">
                                    PULSEIRA PRATA
                                </span>
                                <span className="text-xs font-medium px-3 py-1 rounded-full bg-amber-50 text-amber-700">
                                    Limite 40 pessoas
                                </span>
                            </div>

                            <h3 className="text-2xl font-semibold mb-2" style={{ color: 'var(--aissu-chocolate)' }}>
                                Day Use Carnaval
                            </h3>
                            <p className="text-sm mb-8" style={{ color: 'var(--aissu-wood)' }}>
                                Espreguiçadeira + Guarda-sol • Mesas de praia (8)
                            </p>

                            <div className="flex items-end gap-4 pt-6 border-t" style={{ borderColor: 'var(--aissu-border)' }}>
                                <div>
                                    <p className="text-3xl font-bold" style={{ color: 'var(--aissu-chocolate)' }}>R$ 200</p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--aissu-text-muted)' }}>por pessoa</p>
                                </div>
                                <div className="flex items-center gap-2 ml-auto px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                                    <span className="text-lg font-semibold text-emerald-600">R$ 150</span>
                                    <span className="text-xs text-emerald-600">consumação</span>
                                </div>
                            </div>
                        </div>

                        {/* Mesas Restaurante */}
                        <div className="group bg-white rounded-3xl p-8 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <span className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 shadow-sm">
                                    PULSEIRA PRATA
                                </span>
                                <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                                    4 mesas disponíveis
                                </span>
                            </div>

                            <h3 className="text-2xl font-semibold mb-2" style={{ color: 'var(--aissu-chocolate)' }}>
                                Mesas de Restaurante
                            </h3>
                            <p className="text-sm mb-8" style={{ color: 'var(--aissu-wood)' }}>
                                Para 4 a 6 pessoas • 4 mesas
                            </p>

                            <div className="flex items-end gap-4 pt-6 border-t" style={{ borderColor: 'var(--aissu-border)' }}>
                                <div>
                                    <p className="text-3xl font-bold" style={{ color: 'var(--aissu-chocolate)' }}>R$ 200</p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--aissu-text-muted)' }}>por pessoa</p>
                                </div>
                                <div className="flex items-center gap-2 ml-auto px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                                    <span className="text-lg font-semibold text-emerald-600">R$ 150</span>
                                    <span className="text-xs text-emerald-600">consumação</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nota informativa */}
                    <p className="text-center text-sm mt-10" style={{ color: 'var(--aissu-text-muted)' }}>
                        * Valores especiais para temporada de Carnaval 2026
                    </p>
                </div>
            </section>

            {/* ==========================================
                INFO SECTION
                ========================================== */}
            <section className="py-16" style={{ backgroundColor: 'var(--aissu-cream)' }}>
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--aissu-chocolate)' }}>
                                <Utensils className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--aissu-chocolate)' }}>Consumação Inclusa</h3>
                            <p className="text-sm" style={{ color: 'var(--aissu-wood)' }}>Parte do Valor é revertido em consumação no nosso menu exclusivo</p>
                        </div>
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--aissu-chocolate)' }}>
                                <Check className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--aissu-chocolate)' }}>Cancelamento Flexível</h3>
                            <p className="text-sm" style={{ color: 'var(--aissu-wood)' }}>Cancelamento gratuito até 48h antes da reserva</p>
                        </div>
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--aissu-chocolate)' }}>
                                <MapPin className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--aissu-chocolate)' }}>Localização Premium</h3>
                            <p className="text-sm" style={{ color: 'var(--aissu-wood)' }}>Em uma das praias desejadas do litoral norte de São Paulo</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==========================================
                STICKY BOTTOM BAR
                ========================================== */}
            {selectedSpace && selectedDate && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 shadow-2xl shadow-black/10" style={{ borderColor: 'var(--aissu-border)' }}>
                    <div className="max-w-5xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            {/* Left: Selection Info */}
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:block w-16 h-16 rounded-xl overflow-hidden relative shadow-lg">
                                    <Image
                                        src={selectedSpace.image}
                                        alt={selectedSpace.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="font-semibold" style={{ color: 'var(--aissu-chocolate)' }}>{selectedSpace.name}</p>
                                    <p className="text-sm capitalize" style={{ color: 'var(--aissu-wood)' }}>{formatDateShort(selectedDate)}</p>
                                </div>
                            </div>

                            {/* Right: Price & CTA */}
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <p className="text-2xl font-bold" style={{ color: 'var(--aissu-chocolate)' }}>{formatCurrency(selectedSpace.dailyPrice)}</p>
                                    <p className="text-xs" style={{ color: 'var(--aissu-terra)' }}>{formatCurrency(selectedSpace.consumable)} consumação</p>
                                </div>
                                <button
                                    onClick={handleReserve}
                                    className="px-8 py-4 rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-lg"
                                    style={{ backgroundColor: 'var(--aissu-chocolate)', color: 'white' }}
                                >
                                    Continuar
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <Footer />
        </div>
    )
}
