// AISSU Beach Lounge - Página de Reservas Premium
// Design inspirado em Airbnb Luxe + Stripe + Linear
// Padrão visual de alto nível para beach club exclusivo

'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Users, Check, ChevronRight, ChevronLeft, MapPin, Utensils, Music, Calendar } from 'lucide-react'
import { formatCurrency, toLocalISODate } from '@/lib/utils'
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
    holidayPrice: number
    holidayConsumable: number
    description: string
    units: number
    category: 'bangalo' | 'sunbed' | 'mesa'
    tier: 'standard' | 'premium' | 'galera' | 'romantic' | 'praia' | 'restaurante'
}

const spaceTypes: SpaceType[] = [
    // BANGALÔ LATERAL - Nível 1
    {
        id: 'bangalo-lateral',
        name: 'Bangalô Lateral',
        slug: 'lateral',
        image: '/espacos/bangalo-lateral.jpg',
        capacity: '4 a 5 pessoas',
        capacityNum: 5,
        dailyPrice: 600,
        consumable: 500,
        holidayPrice: 1000,
        holidayConsumable: 700,
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
        image: '/espacos/bangalo-piscina.jpg',
        capacity: '6 pessoas',
        capacityNum: 6,
        dailyPrice: 600,
        consumable: 500,
        holidayPrice: 1800,
        holidayConsumable: 1300,
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
        image: '/espacos/bangalo-frente-mar.jpg',
        capacity: '6 a 8 pessoas',
        capacityNum: 8,
        dailyPrice: 720,
        consumable: 600,
        holidayPrice: 1800,
        holidayConsumable: 1300,
        description: 'Posição privilegiada de frente para o mar',
        units: 4,
        category: 'bangalo',
        tier: 'premium',
    },
    // BANGALÔ CENTRAL - Nível 3 (Galera)
    {
        id: 'bangalo-central',
        name: 'Bangalô Central',
        slug: 'central',
        image: '/espacos/bangalo10.jpeg',
        capacity: 'até 10 pessoas',
        capacityNum: 10,
        dailyPrice: 1500,
        consumable: 1200,
        holidayPrice: 2500,
        holidayConsumable: 2000,
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
        capacity: '2 pessoas',
        capacityNum: 2,
        dailyPrice: 250,
        consumable: 200,
        holidayPrice: 500,
        holidayConsumable: 350,
        description: 'Cama de praia exclusiva para casais',
        units: 8,
        category: 'sunbed',
        tier: 'romantic',
    },
    // MESA DE PRAIA
    {
        id: 'mesa-de-praia',
        name: 'Mesa de Praia',
        slug: 'mesa-praia',
        image: '/espacos/prata.jpg',
        capacity: '4 pessoas',
        capacityNum: 4,
        dailyPrice: 120,    // Price per table or per person? The user sets it globally inside backend. Let's assume price here is for table/reservation since checkouts sum per space.
        consumable: 100,    // We can assume it's per person, but the site treats spacePricePerHour in UI. Let's define it as space.
        holidayPrice: 200,
        holidayConsumable: 150,
        description: 'Mesa de praia com guarda-sol e espreguiçadeira',
        units: 8,
        category: 'mesa',
        tier: 'praia',
    },
    // MESA RESTAURANTE
    {
        id: 'mesa-de-restaurante',
        name: 'Mesa de Restaurante',
        slug: 'mesa-restaurante',
        image: '/espacos/restaurante.jpg',
        capacity: '4 a 6 pessoas',
        capacityNum: 6,
        dailyPrice: 120,
        consumable: 100,
        holidayPrice: 200,
        holidayConsumable: 150,
        description: 'Mesa Premium na área do Restaurante',
        units: 4,
        category: 'mesa',
        tier: 'restaurante',
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

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const soldOutDates = ['2026-12-25', '2026-12-31']

const getTierLabel = (tier: SpaceType['tier']) => {
    switch (tier) {
        case 'standard': return 'Essencial'
        case 'premium': return 'Premium'
        case 'galera': return 'Galera'
        case 'romantic': return 'Romântico'
        case 'praia': return 'Praia'
        case 'restaurante': return 'Restaurante'
    }
}

const getTierColor = (tier: SpaceType['tier']) => {
    switch (tier) {
        case 'standard': return 'bg-[#5a7c65] text-white border-[#4a6c55]'
        case 'premium': return 'bg-[#c9a66b] text-white border-[#b8955a]'
        case 'galera': return 'bg-[#8b4513] text-white border-[#7a3c0f]'
        case 'romantic': return 'bg-[#b87d6c] text-white border-[#a76c5b]'
        case 'praia': return 'bg-gray-100 text-gray-800 border-gray-300'
        case 'restaurante': return 'bg-blue-50 text-blue-800 border-blue-200'
    }
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

interface ClosedDateInfo {
    date: string
    reason: string
}

export default function ReservasPage() {
    const router = useRouter()
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedSpace, setSelectedSpace] = useState<SpaceType | null>(null)
    const [closedDates, setClosedDates] = useState<ClosedDateInfo[]>([])
    const [events, setEvents] = useState<any[]>([])
    const [currentMonth, setCurrentMonth] = useState(() => {
        return new Date()
    })

    const [availabilityCounts, setAvailabilityCounts] = useState<Record<string, number>>({})

    useEffect(() => {
        if (selectedDate) {
            const dateStr = toLocalISODate(selectedDate)
            fetch(`/api/reservations/availability?date=${dateStr}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setAvailabilityCounts(data.data)
                    }
                })
                .catch(err => console.error('Erro ao buscar disponibilidade:', err))
        } else {
            setAvailabilityCounts({})
        }
    }, [selectedDate])

    // Load Events & Closed Dates
    useEffect(() => {
        fetch('/api/closed-dates')
            .then(res => res.json())
            .then(data => {
                if (data.success) setClosedDates(data.data)
            })

        fetch('/api/events?isActive=true')
            .then(res => res.json())
            .then(data => {
                if (data.success) setEvents(data.data)
            })
    }, [])

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startWeekday = firstDay.getDay()

        const days: { date: Date | null; isPast: boolean; isHoliday: boolean; holidayName?: string; isSoldOut: boolean; isClosed: boolean; closedReason?: string, hasEvent?: boolean }[] = []

        for (let i = 0; i < startWeekday; i++) {
            days.push({ date: null, isPast: true, isHoliday: false, isSoldOut: false, isClosed: false })
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day)
            const dateStr = toLocalISODate(date)
            const holiday = isHoliday(dateStr)
            const closedInfo = closedDates.find(cd => cd.date === dateStr)
            const ev = events.find(e => toLocalISODate(new Date(e.startDate)) === dateStr)

            days.push({
                date,
                isPast: date < today,
                isHoliday: !!holiday,
                holidayName: holiday?.name,
                isSoldOut: soldOutDates.includes(dateStr),
                isClosed: !!closedInfo,
                closedReason: closedInfo?.reason,
                hasEvent: !!ev
            })
        }

        return days
    }, [currentMonth, closedDates, events])

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date)
        setTimeout(() => {
            document.getElementById('espacos')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleSpaceSelect = (space: SpaceType) => {
        setSelectedSpace(space)
    }

    // Calcula preço considerando overrides de Lote dinâmico e Feriado
    const getCalculatedPrices = (space: SpaceType, date: Date | null) => {
        const dateStr = date ? toLocalISODate(date) : null
        const isDateHoliday = date ? isHoliday(dateStr as string) : false
        let finalPrice = isDateHoliday ? space.holidayPrice : space.dailyPrice
        let finalConsumable = isDateHoliday ? space.holidayConsumable : space.consumable

        if (!dateStr) return { finalPrice, finalConsumable }

        const ev = events.find(e => toLocalISODate(new Date(e.startDate)) === dateStr)
        if (ev && ev.spacePricesOverrides) {
            try {
                const ovMap = typeof ev.spacePricesOverrides === 'string'
                    ? JSON.parse(ev.spacePricesOverrides)
                    : ev.spacePricesOverrides

                const spaceOverride = ovMap[space.id] || ovMap[space.slug]
                if (spaceOverride) {
                    finalPrice = Number(spaceOverride.price) || finalPrice
                    finalConsumable = Number(spaceOverride.consumable) || finalConsumable
                }
            } catch (e) { }
        }

        return { finalPrice, finalConsumable }
    }

    const handleReserve = () => {
        if (selectedDate && selectedSpace) {
            const { finalPrice, finalConsumable } = getCalculatedPrices(selectedSpace, selectedDate)

            const params = new URLSearchParams({
                cabinId: selectedSpace.id,
                cabinName: selectedSpace.name,
                date: toLocalISODate(selectedDate),
                price: finalPrice.toString(),
                consumable: finalConsumable.toString(),
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
                HERO SECTION - Padronizado com Eventos
                ========================================== */}
            <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                    <iframe
                        className="absolute top-1/2 left-1/2 min-w-[100vw] min-h-[100vh] w-auto h-auto -translate-x-1/2 -translate-y-1/2 scale-150"
                        src="https://www.youtube.com/embed/brLps0wydgU?autoplay=1&mute=1&loop=1&playlist=brLps0wydgU&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1&origin=https://aysu.com.br"
                        title="Aysú Beach Lounge"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        style={{ border: 'none' }}
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />

                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    <p className="text-sm tracking-[0.3em] uppercase text-white/90 mb-4">
                        Praia de Massaguaçu
                    </p>
                    <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-light mb-6 text-white">
                        Reserve seu Espaço
                    </h1>
                    <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light">
                        Experiência day use exclusiva com consumação inclusa e acesso aos nossos melhores eventos.
                    </p>
                </div>
            </section>

            {/* ==========================================
                CALENDÁRIO - Card flutuante premium
                ========================================== */}
            <section className="max-w-lg mx-auto px-6 -mt-24 relative z-10 pb-16">
                <div className="bg-white rounded-3xl shadow-2xl shadow-black/10 border border-gray-100">
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
                            <h3 className="text-xl font-semibold text-[#8B4513]">
                                {MONTHS[currentMonth.getMonth()]}
                            </h3>
                            <p className="text-sm text-[#8a5c3f]">{currentMonth.getFullYear()}</p>
                        </div>

                        <button
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--aissu-nude-light)] text-[var(--aissu-wood)] transition-all"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-7 gap-1 mb-4">
                            {WEEKDAYS_SHORT.map((day, i) => (
                                <div key={i} className="text-center text-xs font-medium py-2 text-gray-500">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, idx) => {
                                if (!day.date) return <div key={idx} className="aspect-square" />

                                const dateStr = toLocalISODate(day.date)
                                const isSelected = selectedDate && toLocalISODate(selectedDate) === dateStr
                                const isDisabled = day.isPast || day.isSoldOut || day.isClosed
                                const isToday = toLocalISODate(new Date()) === dateStr

                                return (
                                    <div key={idx} className="relative group">
                                        <button
                                            onClick={() => !isDisabled && handleDateSelect(day.date!)}
                                            disabled={isDisabled}
                                            className={`
                                                w-full aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all
                                                ${isSelected
                                                    ? 'bg-[#2a2a2a] text-white shadow-lg scale-105'
                                                    : day.isClosed
                                                        ? 'bg-red-50 text-red-400 cursor-not-allowed line-through'
                                                        : isDisabled
                                                            ? 'text-gray-200 cursor-not-allowed'
                                                            : isToday
                                                                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                                                : day.hasEvent
                                                                    ? 'text-[#d4a574] hover:bg-[#d4a574]/10 font-bold'
                                                                    : day.isHoliday
                                                                        ? 'text-amber-600 hover:bg-amber-50'
                                                                        : 'text-gray-700 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            <span>{day.date.getDate()}</span>
                                            {day.hasEvent && !isSelected && (
                                                <span className="w-1 h-1 rounded-full bg-[#d4a574] mt-0.5" />
                                            )}
                                        </button>

                                        {/* Hover Tooltips */}
                                        {day.isClosed && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-red-600 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                                {day.closedReason || 'Evento Fechado'} — Não abriremos ao público
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Exibição do Dia Selecionado + Lógica de Release de Evento */}
                    {selectedDate && (
                        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex flex-col transition-all">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Data selecionada</p>
                                    <p className="text-lg font-semibold text-gray-900 capitalize">{formatDateBR(selectedDate)}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                                    <Check className="h-5 w-5 text-white" />
                                </div>
                            </div>

                            {/* Release Dinâmico do Evento Se Houver */}
                            {(() => {
                                const selStr = toLocalISODate(selectedDate)
                                const ev = events.find(e => toLocalISODate(new Date(e.startDate)) === selStr)
                                if (ev) {
                                    return (
                                        <div className="mt-6 p-5 bg-white rounded-2xl border border-[#d4a574]/30 shadow-sm relative overflow-hidden group animate-fade-in">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#d4a574]" />
                                            <div className="flex items-start justify-between mb-3 pl-2">
                                                <h4 className="font-serif font-bold text-xl text-[#2a2a2a] leading-tight flex-1 pr-4">{ev.title}</h4>
                                                <span className="text-[10px] uppercase font-bold text-[#d4a574] bg-[#d4a574]/10 px-2 py-1 rounded-md shrink-0 border border-[#d4a574]/20">Programação</span>
                                            </div>
                                            {(ev.fullDescription || ev.description) && (
                                                <p className="text-sm text-[#8a5c3f] leading-relaxed mb-4 pl-2">
                                                    {ev.fullDescription || ev.description}
                                                </p>
                                            )}
                                            {ev.djName && (
                                                <div className="pl-2 flex items-center gap-2 text-xs font-semibold text-[#8B4513] bg-[#f5f0e8]/50 p-2 rounded-lg">
                                                    <Music className="w-3.5 h-3.5" />
                                                    Line-up: {ev.djName}
                                                </div>
                                            )}
                                        </div>
                                    )
                                }
                                return null
                            })()}
                        </div>
                    )}
                </div>
            </section>

            {/* ==========================================
                ESPAÇOS - Grid elegante (Mesas inclusas)
                ========================================== */}
            <section id="espacos" className="max-w-7xl mx-auto px-6 py-20 bg-white">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-light mb-4" style={{ color: 'var(--aissu-chocolate)', fontFamily: 'var(--font-display)' }}>
                        {selectedDate ? 'Escolha seu Espaço' : 'Nossos Espaços'}
                    </h2>
                    <p className="max-w-xl mx-auto text-[#8a5c3f]">
                        Os dados do calendário já refletem os lotes dinâmicos de eventos.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {spaceTypes.map((space) => {
                        const { finalPrice, finalConsumable } = getCalculatedPrices(space, selectedDate)

                        // O nome correto para o match do contador não inclui numeração na UI, mas a API retorna agrupado. (Adaptando para bater com os ID/slug da API)
                        // A API envia logs baseados no getCabinSlug mapeamento de strings.
                        const availableCount = availabilityCounts[space.id] || availabilityCounts[space.slug]
                        const isSoldOut = selectedDate && availableCount !== undefined && availableCount === 0

                        return (
                            <article
                                key={space.id}
                                onClick={() => {
                                    if (!selectedDate) return
                                    if (isSoldOut) return
                                    handleSpaceSelect(space)
                                }}
                                className={`group bg-white rounded-3xl overflow-hidden transition-all duration-500 
                                        ${!selectedDate
                                        ? 'opacity-50 cursor-not-allowed'
                                        : isSoldOut
                                            ? 'opacity-60 cursor-not-allowed grayscale'
                                            : 'cursor-pointer hover:shadow-2xl hover:shadow-[#d4a574]/10 hover:-translate-y-1'
                                    } 
                                        ${selectedSpace?.id === space.id
                                        ? 'ring-2 ring-[#d4a574] shadow-xl shadow-[#d4a574]/20'
                                        : 'shadow-lg shadow-black/5 border border-gray-100'
                                    }`}
                            >
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    <Image src={space.image} alt={space.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                                    <div className="absolute top-4 left-4">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border shadow-md backdrop-blur-sm ${getTierColor(space.tier)}`}>
                                            {getTierLabel(space.tier)}
                                        </span>
                                    </div>

                                    <div className="absolute top-4 right-4">
                                        {selectedDate ? (
                                            (() => {
                                                const count = availableCount
                                                if (count === undefined) return null
                                                if (count === 0) {
                                                    return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm bg-red-500/95 text-white">🚫 Esgotado</span>
                                                }
                                                if (count <= 2) {
                                                    return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm bg-amber-500 text-white ring-2 ring-amber-300 ring-offset-1">🔥 Últimas {count}</span>
                                                }
                                                return <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm bg-white/95 text-gray-900">{count} disp.</span>
                                            })()
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white/95 backdrop-blur-sm text-gray-900 shadow-lg">
                                                {space.units} und.
                                            </span>
                                        )}
                                    </div>

                                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                        <span className="inline-flex items-center gap-1.5 text-white text-sm font-medium drop-shadow-md">
                                            <Users className="h-4 w-4" />
                                            {space.capacity}
                                        </span>
                                    </div>

                                    {selectedSpace?.id === space.id && (
                                        <div className="absolute inset-0 bg-[#d4a574]/30 flex items-center justify-center backdrop-blur-[2px]">
                                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl scale-in-center">
                                                <Check className="h-8 w-8 text-[#d4a574]" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6">
                                    <h3 className="text-xl font-serif font-bold mb-2 text-[#2a2a2a]">{space.name}</h3>
                                    <p className="text-sm mb-6 text-[#8a5c3f] leading-relaxed line-clamp-2">{space.description}</p>

                                    <div className="flex items-end justify-between pt-4 border-t border-gray-100">
                                        <div>
                                            <p className="text-2xl font-bold text-[#8B4513]">{formatCurrency(finalPrice)}</p>
                                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{space.category === 'mesa' ? 'Por Pessoa/Mesa' : 'por dia'}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1.5 text-[#d4a574]">
                                                <Utensils className="h-4 w-4" />
                                                <span className="font-bold text-lg">{formatCurrency(finalConsumable)}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider text-right">em consumação</p>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        )
                    })}
                </div>
            </section>

            {/* ==========================================
                STICKY BOTTOM BAR
                ========================================== */}
            {selectedSpace && selectedDate && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] border-gray-100 animate-slide-up">
                    <div className="max-w-5xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:block w-16 h-16 rounded-2xl overflow-hidden relative shadow-md">
                                    <Image src={selectedSpace.image} alt={selectedSpace.name} fill className="object-cover" />
                                </div>
                                <div>
                                    <p className="font-serif font-bold text-[#2a2a2a]">{selectedSpace.name}</p>
                                    <p className="text-sm capitalize text-[#8a5c3f] flex items-center gap-1.5 mt-0.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDateShort(selectedDate)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    <p className="text-2xl font-bold text-[#8B4513]">
                                        {formatCurrency(getCalculatedPrices(selectedSpace, selectedDate).finalPrice)}
                                    </p>
                                    <p className="text-xs font-semibold text-[#d4a574]">
                                        {formatCurrency(getCalculatedPrices(selectedSpace, selectedDate).finalConsumable)} consumação
                                    </p>
                                </div>
                                <button
                                    onClick={handleReserve}
                                    className="px-8 py-4 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-lg bg-[#2a2a2a] hover:bg-black text-white hover:scale-105"
                                >
                                    Continuar
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    )
}
