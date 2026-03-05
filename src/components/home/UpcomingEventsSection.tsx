'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, ChevronRight, Ticket } from 'lucide-react'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'

// ============================================================
// TIPOS
// ============================================================

interface EventItem {
    id: string
    title: string
    description: string | null
    startDate: string
    posterImageUrl: string | null
    ticketPrice: number | null
    isFeatured?: boolean
}

interface TicketLot {
    name: string
    endsAt: string // YYYY-MM-DD
    price: number
    consumable?: number
    soldOut?: boolean
}

interface LinkedEvent {
    title: string
    description: string | null
    posterImageUrl: string | null
    djName: string | null
    bands: string[] | null
    ticketPrice: number | null
}

interface EnrichedDayConfig {
    id: string
    date: string // YYYY-MM-DD
    status: string
    reservationsEnabled: boolean
    title: string | null
    release: string | null
    flyerImageUrl: string | null
    ticketLots: TicketLot[]
    linkedEvent: LinkedEvent | null
}

interface EventsApiResponse {
    success: boolean
    data?: EventItem[]
}

interface DayConfigsApiResponse {
    success: boolean
    data?: EnrichedDayConfig[]
}

// ============================================================
// HELPERS
// ============================================================

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'long',
        timeZone: 'UTC',
    })
}

function formatDateOnly(isoDate: string) {
    const [, month, day] = isoDate.split('-')
    if (!month || !day) return isoDate
    return `${day}/${month}`
}

/** Extrai YYYY-MM-DD de uma string ISO sem conversão de timezone */
function getDateStr(isoDate: string): string {
    return isoDate.substring(0, 10)
}

function getSaoPauloDateISO(date: Date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date)
}

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

interface LotState {
    status: 'none' | 'upcoming' | 'active' | 'sold_out'
    activeLot: TicketLot | null
    nextLot: TicketLot | null
    daysUntilNext: number | null
}

const EMPTY_LOT_STATE: LotState = {
    status: 'none',
    activeLot: null,
    nextLot: null,
    daysUntilNext: null,
}

function getLotState(lots: TicketLot[]): LotState {
    if (!lots.length) return EMPTY_LOT_STATE

    const availableLots = [...lots]
        .filter((lot) => !lot.soldOut)
        .sort((a, b) => a.endsAt.localeCompare(b.endsAt))

    if (!availableLots.length) {
        return {
            status: 'sold_out',
            activeLot: null,
            nextLot: null,
            daysUntilNext: null,
        }
    }

    const todayIso = getSaoPauloDateISO()
    const activeLot = [...availableLots].reverse().find((lot) => lot.endsAt <= todayIso) ?? null
    if (activeLot) {
        return {
            status: 'active',
            activeLot,
            nextLot: null,
            daysUntilNext: null,
        }
    }

    const nextLot = availableLots[0]
    return {
        status: 'upcoming',
        activeLot: null,
        nextLot,
        daysUntilNext: getDaysDiff(todayIso, nextLot.endsAt),
    }
}

function getConfigForEvent(event: EventItem, configs: EnrichedDayConfig[]): EnrichedDayConfig | null {
    const eventDate = getDateStr(event.startDate)
    return configs.find((c) => c.date === eventDate) ?? null
}

function isSameOrAfterToday(isoDate: string): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const eventDate = new Date(isoDate)
    eventDate.setHours(0, 0, 0, 0)

    return eventDate >= today
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function UpcomingEventsSection() {
    const [events, setEvents] = useState<EventItem[]>([])
    const [dayConfigs, setDayConfigs] = useState<EnrichedDayConfig[]>([])
    const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)

    useEffect(() => {
        fetch('/api/events?isActive=true&limit=100')
            .then((res) => res.json())
            .then((data: EventsApiResponse) => {
                if (!data.success || !data.data) {
                    setEvents([])
                    return
                }
                const upcoming = data.data
                    .filter((event) => isSameOrAfterToday(event.startDate) || Boolean(event.isFeatured))
                    .sort((a, b) => {
                        const aIsUpcoming = isSameOrAfterToday(a.startDate)
                        const bIsUpcoming = isSameOrAfterToday(b.startDate)

                        if (aIsUpcoming !== bIsUpcoming) {
                            return aIsUpcoming ? -1 : 1
                        }

                        const aTime = new Date(a.startDate).getTime()
                        const bTime = new Date(b.startDate).getTime()

                        // Futuro: mais próximo primeiro | Passado (destaque): mais recente primeiro
                        return aIsUpcoming ? aTime - bTime : bTime - aTime
                    })
                    .slice(0, 3)
                setEvents(upcoming)
            })
            .catch(() => setEvents([]))
    }, [])

    useEffect(() => {
        fetch('/api/day-configs?upcoming=10')
            .then((res) => res.json())
            .then((data: DayConfigsApiResponse) => {
                if (data.success && data.data) setDayConfigs(data.data)
            })
            .catch(() => {})
    }, [])

    const hasEvents = useMemo(() => events.length > 0, [events])
    const selectedConfig = selectedEvent ? getConfigForEvent(selectedEvent, dayConfigs) : null
    const selectedLotState = selectedConfig ? getLotState(selectedConfig.ticketLots) : EMPTY_LOT_STATE
    const selectedImageUrl = selectedEvent ? (selectedEvent.posterImageUrl ?? selectedConfig?.flyerImageUrl ?? null) : null
    const selectedDateStr = selectedEvent ? getDateStr(selectedEvent.startDate) : ''
    const selectedDisplayPrice = selectedEvent
        ? (selectedLotState.activeLot?.price ?? selectedLotState.nextLot?.price ?? selectedEvent.ticketPrice)
        : null

    if (!hasEvents) return null

    return (
        <section className="py-20 bg-[#f8f4ed]">
            <div className="container-aissu">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
                    <div>
                        <p className="text-xs tracking-[0.25em] uppercase text-[#8a5c3f] mb-2">Programação</p>
                        <h2 className="font-serif text-3xl md:text-4xl text-[#2a2a2a]">Próximos Eventos</h2>
                        <p className="text-[#8a5c3f] mt-2">O próximo evento sempre aparece em destaque.</p>
                    </div>
                    <Link href="/reservas" className="text-sm font-medium text-[#d4a574] inline-flex items-center gap-1">
                        Ver calendário completo
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {events.map((event, index) => {
                        const isHighlighted = index === 0
                        const config = getConfigForEvent(event, dayConfigs)
                        const lotState = config ? getLotState(config.ticketLots) : EMPTY_LOT_STATE
                        const eventDateStr = getDateStr(event.startDate)

                        // Imagem: posterImageUrl do Event → flyerImageUrl do DayConfig → gradient
                        const imageUrl = event.posterImageUrl ?? config?.flyerImageUrl ?? null

                        // Preço: lote ativo do DayConfig → ticketPrice do Event → null
                        const displayPrice = lotState.activeLot?.price ?? lotState.nextLot?.price ?? event.ticketPrice

                        return (
                            <article
                                key={event.id}
                                onClick={() => setSelectedEvent(event)}
                                className={`rounded-2xl overflow-hidden border transition-all flex h-full flex-col ${
                                    isHighlighted
                                        ? 'bg-white border-[#d4a574] shadow-xl shadow-[#d4a574]/20 md:-translate-y-1 cursor-pointer'
                                        : 'bg-white/90 border-[#e0d5c7] shadow-md shadow-black/5 cursor-pointer'
                                }`}
                            >
                                {/* Imagem */}
                                <div className="relative aspect-[4/5] bg-gradient-to-br from-[#2a2a2a] to-[#4a4a4a]">
                                    {imageUrl && (
                                        <Image
                                            src={imageUrl}
                                            alt={event.title}
                                            fill
                                            className="object-cover object-center"
                                        />
                                    )}
                                    {isHighlighted && (
                                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#d4a574] text-white text-xs font-semibold">
                                            Mais próximo
                                        </span>
                                    )}
                                    {lotState.status === 'active' && lotState.activeLot && (
                                        <div className="absolute top-3 right-3 px-3 py-2 rounded-xl bg-green-700 text-white shadow-2xl border border-green-300">
                                            <p className="text-[10px] uppercase tracking-[0.08em] font-black opacity-95">Lote ativo</p>
                                            <p className="text-sm leading-tight font-black">{lotState.activeLot.name}</p>
                                            <p className="text-[10px] opacity-90">
                                                desde {formatDateOnly(lotState.activeLot.endsAt)}
                                            </p>
                                        </div>
                                    )}
                                    {lotState.status === 'upcoming' && lotState.nextLot && (
                                        <div className="absolute top-3 right-3 px-3 py-2 rounded-xl bg-amber-500 text-white shadow-2xl border border-amber-200">
                                            <p className="text-[10px] uppercase tracking-[0.08em] font-black">Lote abre em</p>
                                            <p className="text-lg leading-none font-black">
                                                {formatDaysUntilLabel(lotState.daysUntilNext, true)}
                                            </p>
                                            <p className="text-[10px] opacity-95">
                                                {lotState.nextLot.name} • {formatDateOnly(lotState.nextLot.endsAt)}
                                            </p>
                                        </div>
                                    )}
                                    {lotState.status === 'sold_out' && (
                                        <div className="absolute top-3 right-3 px-3 py-2 rounded-xl bg-red-600 text-white shadow-2xl border border-red-300">
                                            <p className="text-[10px] uppercase tracking-[0.08em] font-black">Ingressos</p>
                                            <p className="text-sm leading-tight font-black">Esgotados</p>
                                        </div>
                                    )}
                                    <span className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-medium">
                                        Ver flyer
                                    </span>
                                </div>

                                <div className="p-5 flex flex-1 flex-col">
                                    <div className="inline-flex items-center gap-1 text-xs text-[#8a5c3f] mb-2">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {formatDate(event.startDate)}
                                    </div>

                                    <h3 className="text-xl font-semibold text-[#2a2a2a] mb-2">{event.title}</h3>

                                    {event.description && (
                                        <p className="text-sm text-[#8a5c3f] line-clamp-3 mb-4">{event.description}</p>
                                    )}

                                    <div className="mt-auto pt-4 space-y-3">
                                        {/* Preço + CTA */}
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf7f1] border border-[#efe4d4]">
                                            <div className="text-xs text-[#8a5c3f]">
                                                <p className="font-semibold text-[#2a2a2a] inline-flex items-center gap-1">
                                                    <Ticket className="h-3.5 w-3.5" />
                                                    Ingresso / Couvert
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-[#2a2a2a]">
                                                    {displayPrice !== null ? formatCurrency(Number(displayPrice)) : 'Consulte'}
                                                </p>
                                            </div>
                                        </div>
                                        {lotState.status === 'upcoming' && lotState.nextLot && (
                                            <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                                                <p className="text-xs font-extrabold uppercase tracking-[0.08em]">
                                                    {lotState.nextLot.name} abre em {formatDaysUntilLabel(lotState.daysUntilNext)}
                                                </p>
                                                <p className="text-[11px] font-semibold mt-0.5">
                                                    Liberação: {formatDateOnly(lotState.nextLot.endsAt)}
                                                </p>
                                            </div>
                                        )}

                                        {/* Botão CTA */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedEvent(event)
                                                }}
                                                className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border border-[#d9c7b1] text-[#5c3d2e] bg-[#fffaf4] hover:bg-[#f5ebdf]"
                                            >
                                                Ver flyer
                                            </button>
                                            <Link
                                                href={`/reservas?date=${eventDateStr}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                                                style={{ background: 'var(--aissu-chocolate, #5c3d2e)' }}
                                            >
                                                Reservar
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        )
                    })}
                </div>
            </div>

            <Modal
                open={!!selectedEvent}
                onOpenChange={(open) => {
                    if (!open) setSelectedEvent(null)
                }}
            >
                <ModalContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <ModalHeader>
                        <ModalTitle>{selectedEvent?.title || 'Detalhes do evento'}</ModalTitle>
                    </ModalHeader>

                    {selectedEvent && (
                        <div className="p-4 grid md:grid-cols-[260px,1fr] gap-6">
                            <div className="w-full max-w-[260px] mx-auto aspect-[4/5] rounded-xl border border-[#e0d5c7] bg-[#f5f0eb] overflow-hidden relative">
                                {selectedImageUrl ? (
                                    <Image
                                        src={selectedImageUrl}
                                        alt={`Flyer de ${selectedEvent.title}`}
                                        fill
                                        className="object-cover object-center"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-sm text-[#8a5c3f]">
                                        Flyer ainda não enviado
                                    </div>
                                )}
                            </div>

                            <div>
                                <p className="inline-flex items-center gap-1 text-xs text-[#8a5c3f] mb-2">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDate(selectedEvent.startDate)}
                                </p>

                                {selectedLotState.status === 'upcoming' && selectedLotState.nextLot && (
                                    <div className="mb-4 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                                        <p className="text-xs font-extrabold uppercase tracking-[0.08em]">
                                            {selectedLotState.nextLot.name} abre em {formatDaysUntilLabel(selectedLotState.daysUntilNext)}
                                        </p>
                                        <p className="text-[11px] font-semibold mt-0.5">
                                            Liberação: {formatDateOnly(selectedLotState.nextLot.endsAt)}
                                        </p>
                                    </div>
                                )}
                                {selectedLotState.status === 'active' && selectedLotState.activeLot && (
                                    <div className="mb-4 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-green-800">
                                        <p className="text-xs font-extrabold uppercase tracking-[0.08em]">
                                            {selectedLotState.activeLot.name} liberado
                                        </p>
                                        <p className="text-[11px] font-semibold mt-0.5">
                                            Desde {formatDateOnly(selectedLotState.activeLot.endsAt)}
                                        </p>
                                    </div>
                                )}

                                {selectedEvent.description && (
                                    <p className="text-sm text-[#8a5c3f] leading-relaxed mb-4">
                                        {selectedEvent.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-between p-3 rounded-xl bg-[#faf7f1] border border-[#efe4d4] mb-4">
                                    <div className="text-xs text-[#8a5c3f]">
                                        <p className="font-semibold text-[#2a2a2a] inline-flex items-center gap-1">
                                            <Ticket className="h-3.5 w-3.5" />
                                            Ingresso / Couvert
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-[#2a2a2a]">
                                            {selectedDisplayPrice !== null ? formatCurrency(Number(selectedDisplayPrice)) : 'Consulte'}
                                        </p>
                                    </div>
                                </div>

                                <Link
                                    href={`/reservas?date=${selectedDateStr}`}
                                    onClick={() => setSelectedEvent(null)}
                                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                                    style={{ background: 'var(--aissu-chocolate, #5c3d2e)' }}
                                >
                                    Reservar
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    )}
                </ModalContent>
            </Modal>
        </section>
    )
}
