// AISSU Beach Lounge - Página de Reservas Premium
// Design inspirado em Airbnb Luxe + Stripe + Linear
// Padrão visual de alto nível para beach club exclusivo

'use client'

import { Suspense, useState, useMemo, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Users, Check, ChevronRight, ChevronLeft, MapPin, Utensils } from 'lucide-react'
import { formatCurrency, toLocalISODate } from '@/lib/utils'
import { isHoliday } from '@/lib/holidays'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import type { DayConfigPayload, ReservationGlobalConfigPayload, TicketLot } from '@/lib/day-config'
import { DEFAULT_RESERVABLE_ITEMS, getPriceOverrideForSpace } from '@/lib/day-config'
import DayInfoModal from '@/components/reservas/DayInfoModal'
import { getCabinSpaceKey, getCabinSpaceLabel } from '@/lib/space-slugs'

// ==========================================
// DADOS DOS ESPAÇOS (Informações reais)
// ==========================================

interface SpaceType {
    id: string
    name: string
    slug: string | null
    image: string
    capacity: string
    capacityNum: number
    dailyPrice: number
    consumable: number
    holidayPrice: number
    holidayConsumable: number
    description: string
    units: number
    category: 'bangalo' | 'sunbed' | 'mesa' | 'dayuse'
    tier: 'standard' | 'premium' | 'galera' | 'romantic' | 'social'
    visibilityStatus: 'AVAILABLE' | 'UNAVAILABLE' | 'HIDDEN'
}

interface CabinApiItem {
    id: string
    name: string
    slug?: string | null
    capacity?: number
    units?: number
    pricePerHour?: number
    description?: string
    imageUrl?: string | null
    category?: string
    visibilityStatus?: 'AVAILABLE' | 'UNAVAILABLE' | 'HIDDEN'
}

const LEGACY_SPACE_TYPES: SpaceType[] = [
    // BANGALÔ LATERAL - Nível 1
    {
        id: 'bangalo-lateral',
        name: 'Bangalô Lateral',
        slug: 'bangalo-lateral',
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
        visibilityStatus: 'AVAILABLE',
    },
    // BANGALÔ PISCINA - Nível 2
    {
        id: 'bangalo-piscina',
        name: 'Bangalô Piscina',
        slug: 'bangalo-piscina',
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
        visibilityStatus: 'AVAILABLE',
    },
    // BANGALÔ FRENTE MAR - Nível 2
    {
        id: 'bangalo-frente-mar',
        name: 'Bangalô Frente Mar',
        slug: 'bangalo-frente-mar',
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
        visibilityStatus: 'AVAILABLE',
    },
    // BANGALÔ CENTRAL - Nível 3 (Galera)
    {
        id: 'bangalo-central',
        name: 'Bangalô Central',
        slug: 'bangalo-central',
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
        visibilityStatus: 'AVAILABLE',
    },
    // SUNBED CASAL
    {
        id: 'sunbed-casal',
        name: 'Sunbed Casal',
        slug: 'sunbed-casal',
        image: '/espacos/Sunbeds.jpeg',
        capacity: '2 pessoas (casal)',
        capacityNum: 2,
        dailyPrice: 250,
        consumable: 200,
        holidayPrice: 500,
        holidayConsumable: 350,
        description: 'Cama de praia exclusiva para casais',
        units: 4,
        category: 'sunbed',
        tier: 'romantic',
        visibilityStatus: 'AVAILABLE',
    },
    // MESA RESTAURANTE (reservável conforme configuração da data)
    {
        id: 'mesa-restaurante',
        name: 'Mesa Restaurante',
        slug: 'mesa-restaurante',
        image: '/espacos/bangalo-lateral.jpg',
        capacity: '4 a 6 pessoas',
        capacityNum: 6,
        dailyPrice: 160,
        consumable: 100,
        holidayPrice: 160,
        holidayConsumable: 100,
        description: 'Mesa interna com serviço completo para grupo',
        units: 4,
        category: 'mesa',
        tier: 'social',
        visibilityStatus: 'AVAILABLE',
    },
    // MESA PRAIA (reservável conforme configuração da data)
    {
        id: 'mesa-praia',
        name: 'Mesa Praia',
        slug: 'mesa-praia',
        image: '/espacos/Sunbeds.jpeg',
        capacity: '2 a 4 pessoas',
        capacityNum: 4,
        dailyPrice: 160,
        consumable: 100,
        holidayPrice: 160,
        holidayConsumable: 100,
        description: 'Mesa pé na areia com cobertura e atendimento',
        units: 4,
        category: 'mesa',
        tier: 'social',
        visibilityStatus: 'AVAILABLE',
    },
    // DAY USE PRAIA COM ESPREGUIÇADEIRA
    {
        id: 'day-use-praia',
        name: 'Day Use Praia com Espreguiçadeira',
        slug: 'day-use-praia',
        image: '/espacos/Sunbeds.jpeg',
        capacity: '1 pessoa',
        capacityNum: 1,
        dailyPrice: 160,
        consumable: 100,
        holidayPrice: 160,
        holidayConsumable: 100,
        description: 'Espreguiçadeira + guarda-sol',
        units: 20,
        category: 'dayuse',
        tier: 'social',
        visibilityStatus: 'AVAILABLE',
    },
]

const LEGACY_SPACE_INDEX: Record<string, SpaceType> = LEGACY_SPACE_TYPES.reduce((acc, space) => {
    acc[space.id] = space
    return acc
}, {} as Record<string, SpaceType>)

const SPACE_CATEGORY_ORDER: Record<SpaceType['category'], number> = {
    bangalo: 1,
    sunbed: 2,
    mesa: 3,
    dayuse: 4,
}
const DATE_DETAILS_SCROLL_ID = 'reserva-data-detalhes'
const SPACES_SECTION_ID = 'espacos'
const MOBILE_SCROLL_HEADER_OFFSET = 88
const DESKTOP_SCROLL_HEADER_OFFSET = 108
const MAX_SCROLL_ATTEMPTS = 8
const SCROLL_RETRY_DELAY_MS = 90

function normalizeText(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
}

function getVisibilityPriority(status?: SpaceType['visibilityStatus']): number {
    if (status === 'HIDDEN') return 3
    if (status === 'UNAVAILABLE') return 2
    return 1
}

function inferSpaceCategory(cabin: CabinApiItem, spaceKey: string): SpaceType['category'] {
    const key = normalizeText(spaceKey)
    const name = normalizeText(cabin.name)
    const category = normalizeText(cabin.category || '')

    if (key.includes('day-use') || name.includes('day use') || name.includes('espreguicadeira')) return 'dayuse'
    if (key.includes('sunbed') || name.includes('sunbed')) return 'sunbed'
    if (key.includes('mesa') || name.includes('mesa') || category === 'mesa') return 'mesa'

    return 'bangalo'
}

function inferSpaceTier(spaceKey: string, category: SpaceType['category']): SpaceType['tier'] {
    const key = normalizeText(spaceKey)

    if (key.includes('central') || key.includes('galera')) return 'galera'
    if (key.includes('frente-mar') || key.includes('piscina')) return 'premium'
    if (category === 'sunbed') return 'romantic'
    if (category === 'mesa' || category === 'dayuse') return 'social'

    return 'standard'
}

function formatCapacityLabel(capacity: number): string {
    return capacity === 1 ? '1 pessoa' : `${capacity} pessoas`
}

function buildDynamicSpaces(cabins: CabinApiItem[]): SpaceType[] {
    const grouped = new Map<string, SpaceType>()

    cabins.forEach((cabin) => {
        const spaceKey = getCabinSpaceKey({
            id: cabin.id,
            name: cabin.name,
            slug: cabin.slug,
        })
        const legacy = LEGACY_SPACE_INDEX[spaceKey]
        const capacityNum = Math.max(1, Number(cabin.capacity || legacy?.capacityNum || 1))
        const units = Math.max(1, Number(cabin.units || legacy?.units || 1))
        const inferredCategory = legacy?.category || inferSpaceCategory(cabin, spaceKey)
        const parsedDbPrice = Number(cabin.pricePerHour)
        const basePrice = Number.isFinite(parsedDbPrice) && parsedDbPrice > 0
            ? parsedDbPrice
            : Number(legacy?.dailyPrice || 0)

        const mapped: SpaceType = {
            id: spaceKey,
            name: legacy?.name || getCabinSpaceLabel({ name: cabin.name, slug: cabin.slug }),
            slug: cabin.slug?.trim() || legacy?.slug || null,
            image: cabin.imageUrl || legacy?.image || '/espacos/bangalo-lateral.jpg',
            capacity: legacy?.capacity || formatCapacityLabel(capacityNum),
            capacityNum,
            dailyPrice: basePrice,
            consumable: legacy?.consumable ?? 0,
            holidayPrice: legacy?.holidayPrice ?? basePrice,
            holidayConsumable: legacy?.holidayConsumable ?? (legacy?.consumable ?? 0),
            description: cabin.description || legacy?.description || 'Espaço exclusivo para sua experiência Aysú.',
            units,
            category: inferredCategory,
            tier: legacy?.tier || inferSpaceTier(spaceKey, inferredCategory),
            visibilityStatus: cabin.visibilityStatus || legacy?.visibilityStatus || 'AVAILABLE',
        }

        const existing = grouped.get(spaceKey)
        if (!existing) {
            grouped.set(spaceKey, mapped)
            return
        }

        existing.units += units
        if (!existing.image && mapped.image) existing.image = mapped.image
        if (!existing.description && mapped.description) existing.description = mapped.description
        if (getVisibilityPriority(mapped.visibilityStatus) > getVisibilityPriority(existing.visibilityStatus)) {
            existing.visibilityStatus = mapped.visibilityStatus
        }
    })

    return Array.from(grouped.values()).sort((a, b) => {
        const byCategory = SPACE_CATEGORY_ORDER[a.category] - SPACE_CATEGORY_ORDER[b.category]
        if (byCategory !== 0) return byCategory
        return a.name.localeCompare(b.name, 'pt-BR')
    })
}

// ==========================================
// HELPERS
// ==========================================

const formatDateBR = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

const formatDateOnlyBR = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-')
    if (!year || !month || !day) return isoDate
    return `${day}/${month}/${year}`
}

const getSaoPauloDateISO = (date: Date = new Date()) =>
    new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date)

function getDaysDiff(fromIso: string, toIso: string): number {
    const [fromYear, fromMonth, fromDay] = fromIso.split('-').map(Number)
    const [toYear, toMonth, toDay] = toIso.split('-').map(Number)
    const fromUtc = Date.UTC(fromYear, fromMonth - 1, fromDay)
    const toUtc = Date.UTC(toYear, toMonth - 1, toDay)
    return Math.max(0, Math.round((toUtc - fromUtc) / 86400000))
}

function formatDaysUntilLabel(days: number | null, uppercase = false): string {
    if (days === null || days <= 0) return uppercase ? 'HOJE' : 'hoje'
    const singular = uppercase ? 'DIA' : 'dia'
    const plural = uppercase ? 'DIAS' : 'dias'
    return `${days} ${days === 1 ? singular : plural}`
}

interface LotReservationGate {
    isBlocked: boolean
    reason: 'not_started' | 'sold_out' | null
    nextAvailableDate: string | null
    nextLotName: string | null
    activeLotName: string | null
    daysUntilNext: number | null
}

function getLotReservationGate(lots: TicketLot[]): LotReservationGate {
    if (!lots.length) {
        return {
            isBlocked: false,
            reason: null,
            nextAvailableDate: null,
            nextLotName: null,
            activeLotName: null,
            daysUntilNext: null,
        }
    }

    const availableLots = lots
        .filter((lot) => !lot.soldOut)
        .sort((a, b) => a.endsAt.localeCompare(b.endsAt))

    if (!availableLots.length) {
        return {
            isBlocked: true,
            reason: 'sold_out',
            nextAvailableDate: null,
            nextLotName: null,
            activeLotName: null,
            daysUntilNext: null,
        }
    }

    const todaySaoPaulo = getSaoPauloDateISO()
    const activeLot = [...availableLots].reverse().find((lot) => lot.endsAt <= todaySaoPaulo) ?? null
    const upcomingLot = availableLots.find((lot) => lot.endsAt > todaySaoPaulo) ?? null

    if (!activeLot && upcomingLot) {
        return {
            isBlocked: true,
            reason: 'not_started',
            nextAvailableDate: upcomingLot.endsAt,
            nextLotName: upcomingLot.name,
            activeLotName: null,
            daysUntilNext: getDaysDiff(todaySaoPaulo, upcomingLot.endsAt),
        }
    }

    return {
        isBlocked: false,
        reason: null,
        nextAvailableDate: null,
        nextLotName: null,
        activeLotName: activeLot?.name ?? null,
        daysUntilNext: null,
    }
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const getTierLabel = (tier: SpaceType['tier']) => {
    switch (tier) {
        case 'standard': return 'Essencial'
        case 'premium': return 'Premium'
        case 'galera': return 'Galera'
        case 'romantic': return 'Romântico'
        case 'social': return 'Social'
    }
}

const getTierColor = (tier: SpaceType['tier']) => {
    switch (tier) {
        case 'standard': return 'bg-[#5a7c65] text-white border-[#4a6c55]'  // Verde sólido elegante
        case 'premium': return 'bg-[#c9a66b] text-white border-[#b8955a]'   // Dourado sólido
        case 'galera': return 'bg-[#8b4513] text-white border-[#7a3c0f]'  // Marrom premium (chocolate)
        case 'romantic': return 'bg-[#b87d6c] text-white border-[#a76c5b]'  // Rosa terroso elegante
        case 'social': return 'bg-[#4d6a8a] text-white border-[#3f5b79]'
    }
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

interface ClosedDateInfo {
    date: string
    reason: string
}

function getDateFromUrlParam(): Date | null {
    if (typeof window === 'undefined') return null

    const params = new URLSearchParams(window.location.search)
    const dateParam = params.get('date')
    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return null

    const date = new Date(`${dateParam}T12:00:00`)
    return Number.isNaN(date.getTime()) ? null : date
}

function isDateSelectable(
    date: Date,
    closedDates: ClosedDateInfo[],
    dayConfigByDate: Record<string, DayConfigPayload>,
) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (date < today) return false

    const dateStr = toLocalISODate(date)
    const config = dayConfigByDate[dateStr]
    const isHouseEventOpen = config?.status === 'EVENT' && config.reservationsEnabled !== false
    const isClosedDate = closedDates.some((c) => c.date === dateStr)

    // Evento da casa continua vendável mesmo com fechamento do público geral no calendário.
    if (isHouseEventOpen) return true

    const isBlocked = !!config && (
        !config.reservationsEnabled ||
        config.status === 'BLOCKED' ||
        config.status === 'PRIVATE_EVENT'
    )

    return !isClosedDate && !isBlocked
}

function ReservasPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const dateParamFromQuery = searchParams.get('date')
    const [initialDateFromUrl] = useState<Date | null>(() => getDateFromUrlParam())
    const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
        if (!initialDateFromUrl) return null

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return initialDateFromUrl < today ? null : initialDateFromUrl
    })
    const [selectedSpace, setSelectedSpace] = useState<SpaceType | null>(null)
    const [spaces, setSpaces] = useState<SpaceType[]>(LEGACY_SPACE_TYPES)
    const [closedDates, setClosedDates] = useState<ClosedDateInfo[]>([])
    const [dayConfigs, setDayConfigs] = useState<DayConfigPayload[]>([])
    const [currentMonth, setCurrentMonth] = useState(() => {
        if (initialDateFromUrl) {
            return new Date(initialDateFromUrl.getFullYear(), initialDateFromUrl.getMonth(), 1)
        }
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), 1)
    })

    const [availabilityCounts, setAvailabilityCounts] = useState<Record<string, number>>({})
    const [globalConfig, setGlobalConfig] = useState<ReservationGlobalConfigPayload | null>(null)
    const scrollRetryTimeoutRef = useRef<number | null>(null)

    // Estado do modal de informação de data especial/bloqueada
    const [dayInfoModal, setDayInfoModal] = useState<{
        config: DayConfigPayload | null
        closedReason?: string
        isPrivate: boolean
        isClosed: boolean
        date: Date
    } | null>(null)

    const dayConfigByDate: Record<string, DayConfigPayload> = {}
    for (const config of dayConfigs) {
        dayConfigByDate[config.date] = config
    }

    const effectiveSelectedDate =
        selectedDate && isDateSelectable(selectedDate, closedDates, dayConfigByDate)
            ? selectedDate
            : null

    useEffect(() => {
        if (!dateParamFromQuery || !/^\d{4}-\d{2}-\d{2}$/.test(dateParamFromQuery)) return

        const parsedDate = new Date(`${dateParamFromQuery}T12:00:00`)
        if (Number.isNaN(parsedDate.getTime())) return

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (parsedDate < today) return

        const frameId = window.requestAnimationFrame(() => {
            setSelectedDate((prev) => {
                if (prev && toLocalISODate(prev) === dateParamFromQuery) return prev
                return parsedDate
            })

            setCurrentMonth((prev) => {
                const year = parsedDate.getFullYear()
                const month = parsedDate.getMonth()
                if (prev.getFullYear() === year && prev.getMonth() === month) return prev
                return new Date(year, month, 1)
            })

            setSelectedSpace(null)
        })

        return () => {
            window.cancelAnimationFrame(frameId)
        }
    }, [dateParamFromQuery])

    useEffect(() => {
        if (effectiveSelectedDate) {
            // Fetch availability for specific date
            const dateStr = toLocalISODate(effectiveSelectedDate)
            fetch(`/api/reservations/availability?date=${dateStr}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setAvailabilityCounts(data.data)
                    }
                })
                .catch(err => console.error('Erro ao buscar disponibilidade:', err))
        }
    }, [effectiveSelectedDate])

    // Fetch Public Closed Dates
    useEffect(() => {
        fetch('/api/closed-dates')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setClosedDates(data.data)
                }
            })
            .catch(err => console.error('Erro ao buscar datas fechadas:', err))
    }, [])

    useEffect(() => {
        fetch('/api/day-configs/default')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setGlobalConfig(data.data)
                }
            })
            .catch(err => console.error('Erro ao buscar configuração padrão:', err))

        fetch('/api/cabins?isActive=true')
            .then(res => res.json())
            .then(data => {
                if (!data.success || !Array.isArray(data.data)) return

                const mappedSpaces = buildDynamicSpaces(data.data as CabinApiItem[])
                if (mappedSpaces.length > 0) {
                    setSpaces(mappedSpaces)
                }
            })
            .catch(err => console.error('Erro ao buscar espaços ativos:', err))
    }, [])

    useEffect(() => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth() + 1

        fetch(`/api/day-configs?year=${year}&month=${month}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setDayConfigs(data.data)
                }
            })
            .catch(err => console.error('Erro ao buscar configurações do calendário:', err))
    }, [currentMonth])

    useEffect(() => {
        return () => {
            if (scrollRetryTimeoutRef.current !== null) {
                window.clearTimeout(scrollRetryTimeoutRef.current)
            }
        }
    }, [])

    const getDateConfig = (date: Date) => {
        const dateStr = toLocalISODate(date)
        return dayConfigByDate[dateStr] ?? null
    }

    const getSpacePricing = (space: SpaceType, date: Date | null) => {
        const isDateHoliday = date ? isHoliday(date) : false
        const globalOverride = globalConfig?.priceOverrides?.[space.id]
        const basePrice = globalOverride?.price ?? (isDateHoliday ? space.holidayPrice : space.dailyPrice)
        const baseConsumable = globalOverride?.consumable ?? (isDateHoliday ? space.holidayConsumable : space.consumable)

        if (!date) {
            return {
                finalPrice: basePrice,
                finalConsumable: baseConsumable,
                isOverride: false,
            }
        }

        const config = getDateConfig(date)
        const override = getPriceOverrideForSpace(config, space.id)

        if (override) {
            return {
                finalPrice: override.price,
                finalConsumable: override.consumable ?? baseConsumable,
                isOverride: true,
            }
        }

        return {
            finalPrice: basePrice,
            finalConsumable: baseConsumable,
            isOverride: false,
        }
    }

    const selectedDateConfig = selectedDate
        ? dayConfigByDate[toLocalISODate(selectedDate)] ?? null
        : null
    const lotReservationGate = getLotReservationGate(selectedDateConfig?.ticketLots ?? [])

    const effectiveSelectedSpace = useMemo(() => {
        if (!selectedSpace) return null
        const next = spaces.find((space) => space.id === selectedSpace.id && space.visibilityStatus === 'AVAILABLE')
        return next || null
    }, [selectedSpace, spaces])



    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startWeekday = firstDay.getDay()

        const days: {
            date: Date | null
            isPast: boolean
            isHoliday: boolean
            holidayName?: string
            isSoldOut: boolean
            isClosed: boolean
            closedReason?: string
            config?: DayConfigPayload | null
        }[] = []

        for (let i = 0; i < startWeekday; i++) {
            days.push({ date: null, isPast: true, isHoliday: false, isSoldOut: false, isClosed: false, config: null })
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day)
            const dateStr = toLocalISODate(date)
            const holiday = isHoliday(dateStr)
            const closedInfo = closedDates.find(cd => cd.date === dateStr)
            const dayConfig = dayConfigs.find(config => config.date === dateStr)
            const isHouseEventOpen = dayConfig?.status === 'EVENT' && dayConfig.reservationsEnabled !== false
            const isConfigBlocked = !!dayConfig && (
                !dayConfig.reservationsEnabled ||
                dayConfig.status === 'BLOCKED' ||
                dayConfig.status === 'PRIVATE_EVENT'
            )
            const isClosedByCalendar = !!closedInfo && !isHouseEventOpen

            days.push({
                date,
                isPast: date < today,
                isHoliday: !!holiday,
                holidayName: holiday?.name,
                isSoldOut: false,
                isClosed: isClosedByCalendar || isConfigBlocked,
                closedReason: (isClosedByCalendar ? closedInfo?.reason : undefined) || dayConfig?.title || dayConfig?.release || undefined,
                config: dayConfig,
            })
        }

        return days
    }, [currentMonth, closedDates, dayConfigs])

    const handleDateSelect = (date: Date) => {
        const dateKey = toLocalISODate(date)
        const configForDate = dayConfigByDate[dateKey] ?? null
        const hasFlyerOrEventDetails = Boolean(
            configForDate?.flyerImageUrl ||
            configForDate?.title ||
            configForDate?.release ||
            configForDate?.ticketLots?.length
        )
        const targetId = hasFlyerOrEventDetails ? DATE_DETAILS_SCROLL_ID : SPACES_SECTION_ID

        const scrollToDateDetails = (attempt = 0) => {
            const target = document.getElementById(targetId)
            if (!target) {
                if (attempt >= MAX_SCROLL_ATTEMPTS) return

                scrollRetryTimeoutRef.current = window.setTimeout(() => {
                    scrollToDateDetails(attempt + 1)
                }, SCROLL_RETRY_DELAY_MS)
                return
            }

            const headerOffset = window.innerWidth < 768 ? MOBILE_SCROLL_HEADER_OFFSET : DESKTOP_SCROLL_HEADER_OFFSET
            const absoluteTop = window.scrollY + target.getBoundingClientRect().top - headerOffset
            window.scrollTo({
                top: Math.max(absoluteTop, 0),
                behavior: 'smooth',
            })
        }

        if (scrollRetryTimeoutRef.current !== null) {
            window.clearTimeout(scrollRetryTimeoutRef.current)
            scrollRetryTimeoutRef.current = null
        }

        setSelectedDate(date)
        window.requestAnimationFrame(() => scrollToDateDetails())
    }

    const handleSpaceSelect = (space: SpaceType) => {
        setSelectedSpace(space)
    }

    const handleReserve = () => {
        if (lotReservationGate.isBlocked) return

        if (effectiveSelectedDate && effectiveSelectedSpace) {
            const { finalPrice, finalConsumable } = getSpacePricing(effectiveSelectedSpace, effectiveSelectedDate)

            const params = new URLSearchParams({
                cabinId: effectiveSelectedSpace.id,
                cabinName: effectiveSelectedSpace.name,
                date: toLocalISODate(effectiveSelectedDate),
                price: finalPrice.toString(),
                consumable: finalConsumable.toString(),
            })

            if (selectedDateConfig?.title) {
                params.set('eventTitle', selectedDateConfig.title)
            }

            router.push(`/checkout?${params.toString()}`)
        }
    }

    const canGoPrev = useMemo(() => {
        const now = new Date()
        return currentMonth > new Date(now.getFullYear(), now.getMonth(), 1)
    }, [currentMonth])

    const lotBlockMessage =
        lotReservationGate.reason === 'not_started' && lotReservationGate.nextAvailableDate
            ? `${lotReservationGate.nextLotName || 'Próximo lote'} disponível a partir de ${formatDateOnlyBR(lotReservationGate.nextAvailableDate)} (horário de Brasília).`
            : lotReservationGate.reason === 'sold_out'
                ? 'Ingressos esgotados para esta data.'
                : null

    return (
        <div className="min-h-screen bg-white overflow-x-hidden">
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
                        className="absolute left-1/2 top-1/2 h-[56.25vw] w-[177.78vh] min-h-full min-w-full max-w-none -translate-x-1/2 -translate-y-1/2 scale-[1.08] md:scale-[1.22]"
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
            <section className="max-w-lg mx-auto px-4 sm:px-6 -mt-24 relative z-10 pb-16">
                <div className="bg-white rounded-3xl shadow-2xl shadow-black/10 border border-gray-100">
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

                                const dateStr = toLocalISODate(day.date)
                                const isSelected = selectedDate && toLocalISODate(selectedDate) === dateStr
                                const isDisabled = day.isPast || day.isSoldOut
                                const isToday = toLocalISODate(new Date()) === dateStr
                                const hasEventInfo = !!(day.config?.title || day.config?.release)
                                const isEventDate = day.config?.status === 'EVENT' || day.config?.status === 'PRIVATE_EVENT'

                                return (
                                    <div key={idx} className="relative group">
                                        <button
                                            onClick={() => {
                                                if (day.isClosed) {
                                                    setDayInfoModal({
                                                        config: day.config ?? null,
                                                        closedReason: day.closedReason,
                                                        isPrivate: day.config?.status === 'PRIVATE_EVENT',
                                                        isClosed: true,
                                                        date: day.date!,
                                                    })
                                                    if (day.config?.flyerImageUrl || day.config?.title || day.config?.release || day.config?.ticketLots?.length) {
                                                        handleDateSelect(day.date!)
                                                    }
                                                } else if (!isDisabled) {
                                                    handleDateSelect(day.date!)
                                                }
                                            }}
                                            disabled={isDisabled}
                                            className={`
                                                w-full aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all
                                                ${isSelected
                                                    ? 'bg-gray-900 text-white shadow-lg scale-105'
                                                    : day.isClosed
                                                        ? 'bg-red-100 text-red-500 hover:bg-red-200'
                                                        : isDisabled
                                                            ? 'text-gray-200 cursor-not-allowed'
                                                            : isToday
                                                                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                                                : isEventDate
                                                                    ? 'text-sky-700 hover:bg-sky-50'
                                                                : day.isHoliday
                                                                    ? 'text-amber-600 hover:bg-amber-50'
                                                                    : 'text-gray-700 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            <span>{day.date.getDate()}</span>
                                            {day.isClosed && !isSelected && (
                                                <span className="w-1 h-1 rounded-full bg-red-500 mt-0.5" />
                                            )}
                                            {day.isHoliday && !day.isClosed && !isSelected && (
                                                <span className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />
                                            )}
                                            {hasEventInfo && !day.isClosed && !isSelected && (
                                                <span className="w-1 h-1 rounded-full bg-sky-500 mt-0.5" />
                                            )}
                                        </button>
                                        {/* Closed Date Tooltip */}
                                        {day.isClosed && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-red-600 text-white text-xs rounded-lg max-w-[220px] text-center whitespace-normal break-words opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                                {day.closedReason || 'Evento Fechado'} — Não abriremos ao público
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-red-600" />
                                            </div>
                                        )}
                                        {/* Event Tooltip */}
                                        {!day.isClosed && hasEventInfo && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-sky-700 text-white text-xs rounded-lg max-w-[240px] text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                                <p className="font-semibold">{day.config?.title}</p>
                                                {day.config?.release && (
                                                    <p className="mt-1 text-sky-100 line-clamp-3">{day.config.release}</p>
                                                )}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-sky-700" />
                                            </div>
                                        )}
                                        {/* Holiday Tooltip */}
                                        {day.holidayName && !day.isClosed && !hasEventInfo && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg max-w-[220px] text-center whitespace-normal break-words opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                                {day.holidayName}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900" />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-gray-500">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-sky-500" />
                                Evento
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                Feriado
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                Data bloqueada
                            </span>
                        </div>
                    </div>

                    {/* Selected Date */}
                    {selectedDate && (
                        <div id={DATE_DETAILS_SCROLL_ID} className="px-8 py-6 bg-gray-50 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Data selecionada</p>
                                    <p className="text-lg font-semibold text-gray-900 capitalize">{formatDateBR(selectedDate)}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                                    <Check className="h-5 w-5 text-white" />
                                </div>
                            </div>

                            {(selectedDateConfig?.title || selectedDateConfig?.release || selectedDateConfig?.ticketLots.length) && (
                                <div className="mt-4 p-4 rounded-xl border border-sky-100 bg-sky-50/60">
                                    {selectedDateConfig?.title && (
                                        <p className="font-semibold text-sky-900">{selectedDateConfig.title}</p>
                                    )}
                                    {selectedDateConfig?.ticketLots.length ? (
                                        <div
                                            className={`mt-3 p-3 rounded-xl border-2 ${
                                                lotReservationGate.reason === 'not_started'
                                                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                                                    : lotReservationGate.reason === 'sold_out'
                                                        ? 'bg-red-50 border-red-300 text-red-800'
                                                        : 'bg-green-50 border-green-300 text-green-900'
                                            }`}
                                        >
                                            {lotReservationGate.reason === 'not_started' && lotReservationGate.nextAvailableDate ? (
                                                <>
                                                    <p className="text-[11px] font-black uppercase tracking-[0.08em]">Lote antecipado</p>
                                                    <p className="text-2xl leading-none font-black mt-1">
                                                        ABRE EM {formatDaysUntilLabel(lotReservationGate.daysUntilNext, true)}
                                                    </p>
                                                    <p className="text-sm font-bold mt-1">
                                                        {lotReservationGate.nextLotName} • {formatDateOnlyBR(lotReservationGate.nextAvailableDate)}
                                                    </p>
                                                </>
                                            ) : lotReservationGate.reason === 'sold_out' ? (
                                                <>
                                                    <p className="text-[11px] font-black uppercase tracking-[0.08em]">Ingressos</p>
                                                    <p className="text-xl leading-none font-black mt-1">ESGOTADOS</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-[11px] font-black uppercase tracking-[0.08em]">Lote liberado</p>
                                                    <p className="text-lg leading-none font-black mt-1">
                                                        {lotReservationGate.activeLotName || 'Disponível para reserva'}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    ) : null}
                                    {selectedDateConfig?.release && (
                                        <p className="text-sm text-sky-800 mt-1">{selectedDateConfig.release}</p>
                                    )}
                                    {selectedDateConfig?.flyerImageUrl && (
                                        <div className="mt-3 overflow-hidden rounded-lg border border-sky-200 bg-sky-100/40">
                                            <div className="relative mx-auto w-full max-w-xs aspect-[4/5]">
                                                <Image
                                                    src={selectedDateConfig.flyerImageUrl}
                                                    alt={`Flyer de ${selectedDateConfig.title || 'evento'}`}
                                                    fill
                                                    className="object-contain object-top"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedDateConfig?.ticketLots.length ? (
                                        <div className="mt-3 space-y-2">
                                            {selectedDateConfig.ticketLots.map((lot) => (
                                                <div key={`${lot.name}-${lot.endsAt}`} className="flex items-center justify-between text-sm">
                                                    <div>
                                                        <p className="font-medium text-sky-900">{lot.name}</p>
                                                        <p className="text-sky-700">a partir de {new Date(`${lot.endsAt}T12:00:00`).toLocaleDateString('pt-BR')}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        {lot.soldOut ? (
                                                            <p className="font-semibold text-red-600">Esgotado</p>
                                                        ) : (
                                                            <>
                                                                <p className="font-semibold text-sky-900">{formatCurrency(lot.price)}</p>
                                                                {lot.consumable !== undefined && (
                                                                    <p className="text-xs text-sky-700">{formatCurrency(lot.consumable)} consumação</p>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            )}
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
                            {effectiveSelectedDate ? 'Escolha seu Espaço' : 'Nossos Espaços'}
                        </h2>
                    <p className="max-w-xl mx-auto" style={{ color: 'var(--aissu-wood)' }}>
                        Todos os espaços incluem pulseira dourada com acesso VIP e valor em consumação
                    </p>
                </div>

                {/* Space Grid */}
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {spaces.map((space) => {
                        if (space.visibilityStatus === 'HIDDEN') return null

                        const { finalPrice, finalConsumable } = getSpacePricing(space, effectiveSelectedDate)
                        const availableCount = availabilityCounts[space.id]
                        const reservableItems = selectedDateConfig?.reservableItems ?? globalConfig?.reservableItems ?? DEFAULT_RESERVABLE_ITEMS
                        const isRestaurantTable = space.id === 'mesa-restaurante'
                        const isBeachTable = space.id === 'mesa-praia'
                        const isDayUse = space.id === 'day-use-praia'
                        const blockedByVisibility = space.visibilityStatus === 'UNAVAILABLE'
                        const blockedByRule = (
                            (space.category === 'bangalo' && !reservableItems.bangalos) ||
                            (space.category === 'sunbed' && !reservableItems.sunbeds) ||
                            (isRestaurantTable && !reservableItems.restaurantTables) ||
                            (isBeachTable && !reservableItems.beachTables) ||
                            (isDayUse && !reservableItems.dayUse)
                        )
                        const isLoadingAvailability = !!effectiveSelectedDate && availableCount === undefined
                        const isSoldOut = blockedByVisibility
                            || (effectiveSelectedDate && availableCount !== undefined && availableCount === 0)
                            || blockedByRule
                            || lotReservationGate.isBlocked
                            || isLoadingAvailability

                        return (
                            <article
                                key={space.id}
                                onClick={() => {
                                    if (!effectiveSelectedDate) return
                                    if (isSoldOut) return // Block sold-out
                                    handleSpaceSelect(space)
                                }}
                                className={`group bg-white rounded-2xl overflow-hidden transition-all duration-500 
                                        ${!effectiveSelectedDate
                                        ? 'opacity-50 cursor-not-allowed'
                                        : isSoldOut
                                            ? 'opacity-60 cursor-not-allowed grayscale'
                                            : 'cursor-pointer hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1'
                                    } 
                                        ${effectiveSelectedSpace?.id === space.id
                                        ? 'ring-2 ring-gray-900 shadow-2xl shadow-black/10'
                                        : 'shadow-lg shadow-black/5'
                                    }`}
                            >
                                {/* Image */}
                                <div className="relative aspect-[5/6] overflow-hidden bg-[#f3efe8]">
                                    <Image
                                        src={space.image}
                                        alt={space.name}
                                        fill
                                        className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                                        unoptimized={space.image.startsWith('http')}
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
                                        {effectiveSelectedDate ? (
                                            (() => {
                                                if (blockedByVisibility) {
                                                    return (
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm bg-zinc-700 text-white">
                                                            Indisponível
                                                        </span>
                                                    )
                                                }
                                                const count = availabilityCounts[space.id]
                                                if (count === undefined) {
                                                    return (
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm bg-white/95 text-gray-900">
                                                            {space.units} {space.units === 1 ? 'unidade' : 'unidades'}
                                                        </span>
                                                    )
                                                }
                                                if (blockedByRule) {
                                                    return (
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm bg-slate-700 text-white">
                                                            Disponível somente em evento
                                                        </span>
                                                    )
                                                }
                                                if (lotReservationGate.reason === 'not_started' && lotReservationGate.nextAvailableDate) {
                                                    return (
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm bg-amber-500 text-white">
                                                            Disponível em {formatDateOnlyBR(lotReservationGate.nextAvailableDate)}
                                                        </span>
                                                    )
                                                }
                                                if (lotReservationGate.reason === 'sold_out') {
                                                    return (
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm bg-red-500/95 text-white">
                                                            🚫 Lotes esgotados
                                                        </span>
                                                    )
                                                }
                                                if (count === 0) {
                                                    return (
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm bg-red-500/95 text-white">
                                                            🚫 Esgotado
                                                        </span>
                                                    )
                                                }
                                                if (count <= 2) {
                                                    return (
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm bg-amber-500 text-white ring-2 ring-amber-300 ring-offset-1">
                                                            🔥 {count === 1 ? 'Última unidade!' : `Últimas ${count}!`}
                                                        </span>
                                                    )
                                                }
                                                return (
                                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm bg-white/95 text-gray-900">
                                                        {count} disponíveis
                                                    </span>
                                                )
                                            })()
                                        ) : (
                                            blockedByVisibility ? (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-700 text-white shadow-lg">
                                                    Indisponível
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white/95 backdrop-blur-sm text-gray-900 shadow-lg">
                                                    {space.units} {space.units === 1 ? 'unidade' : 'unidades'}
                                                </span>
                                            )
                                        )}
                                    </div>

                                    {/* Bottom: Quick Info */}
                                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                        <span className="inline-flex items-center gap-1.5 text-white text-sm">
                                            <Users className="h-4 w-4" />
                                            {space.capacity}
                                        </span>
                                    </div>

                                    {/* Selection Overlay */}
                                    {effectiveSelectedSpace?.id === space.id && (
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
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <h3 className="text-xl font-semibold" style={{ color: 'var(--aissu-chocolate)' }}>{space.name}</h3>
                                    </div>
                                    <p className="text-sm mb-6" style={{ color: 'var(--aissu-wood)' }}>{space.description}</p>

                                    {/* Pricing */}
                                    <div className="flex items-end justify-between pt-4 border-t border-[var(--aissu-border)]">
                                        <div>
                                            <p className="text-2xl font-bold" style={{ color: 'var(--aissu-chocolate)' }}>{formatCurrency(finalPrice)}</p>
                                            <p className="text-xs" style={{ color: 'var(--aissu-text-muted)' }}>por dia</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1.5 text-emerald-600">
                                                <Utensils className="h-4 w-4" />
                                                <span className="font-semibold">{formatCurrency(finalConsumable)}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">em consumação</p>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        )
                    })}
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
            {effectiveSelectedSpace && effectiveSelectedDate && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 shadow-2xl shadow-black/10" style={{ borderColor: 'var(--aissu-border)' }}>
                    <div className="max-w-5xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            {/* Left: Selection Info */}
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:block w-16 h-16 rounded-xl overflow-hidden relative shadow-lg">
                                    <Image
                                        src={effectiveSelectedSpace.image}
                                        alt={effectiveSelectedSpace.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="font-semibold" style={{ color: 'var(--aissu-chocolate)' }}>{effectiveSelectedSpace.name}</p>
                                    <p className="text-sm capitalize" style={{ color: 'var(--aissu-wood)' }}>{formatDateShort(effectiveSelectedDate)}</p>
                                </div>
                            </div>

                            {/* Right: Price & CTA */}
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                    {(() => {
                                        const { finalPrice, finalConsumable } = getSpacePricing(effectiveSelectedSpace, effectiveSelectedDate)
                                        return (
                                            <>
                                                <p className="text-2xl font-bold" style={{ color: 'var(--aissu-chocolate)' }}>
                                                    {formatCurrency(finalPrice)}
                                                </p>
                                                <p className="text-xs" style={{ color: 'var(--aissu-terra)' }}>
                                                    {formatCurrency(finalConsumable)} consumação
                                                </p>
                                            </>
                                        )
                                    })()}
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <button
                                        onClick={handleReserve}
                                        disabled={lotReservationGate.isBlocked}
                                        className={`px-8 py-4 rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-lg ${
                                            lotReservationGate.isBlocked ? 'cursor-not-allowed opacity-70' : ''
                                        }`}
                                        style={{
                                            backgroundColor: lotReservationGate.isBlocked ? '#9ca3af' : 'var(--aissu-chocolate)',
                                            color: 'white',
                                        }}
                                    >
                                        Continuar
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                    {lotBlockMessage && (
                                        <p className="text-[11px] text-amber-700 text-right max-w-[240px] leading-snug">
                                            {lotBlockMessage}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de informação de data especial/bloqueada */}
            {dayInfoModal && (
                <DayInfoModal
                    isOpen={true}
                    onClose={() => setDayInfoModal(null)}
                    config={dayInfoModal.config}
                    closedReason={dayInfoModal.closedReason}
                    isPrivate={dayInfoModal.isPrivate}
                    isClosed={dayInfoModal.isClosed}
                    date={dayInfoModal.date}
                    onReserve={
                        dayInfoModal.config?.reservationsEnabled
                            ? () => { setDayInfoModal(null); handleDateSelect(dayInfoModal.date) }
                            : undefined
                    }
                />
            )}

            {/* Footer */}
            <Footer />
        </div>
    )
}

export default function ReservasPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#fdfbf8]" />}>
            <ReservasPageContent />
        </Suspense>
    )
}
