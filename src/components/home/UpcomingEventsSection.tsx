'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, ChevronRight, Ticket } from 'lucide-react'
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

/** Extrai YYYY-MM-DD de uma string ISO sem conversão de timezone */
function getDateStr(isoDate: string): string {
    return isoDate.substring(0, 10)
}

function getActiveLot(lots: TicketLot[]): TicketLot | null {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    return (
        lots.find((lot) => {
            if (lot.soldOut) return false
            const endsAt = new Date(`${lot.endsAt}T23:59:59Z`)
            return endsAt >= today
        }) ?? null
    )
}

function getConfigForEvent(event: EventItem, configs: EnrichedDayConfig[]): EnrichedDayConfig | null {
    const eventDate = getDateStr(event.startDate)
    return configs.find((c) => c.date === eventDate) ?? null
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function UpcomingEventsSection() {
    const [events, setEvents] = useState<EventItem[]>([])
    const [dayConfigs, setDayConfigs] = useState<EnrichedDayConfig[]>([])

    useEffect(() => {
        fetch('/api/events?isActive=true&limit=100')
            .then((res) => res.json())
            .then((data: EventsApiResponse) => {
                if (!data.success || !data.data) {
                    setEvents([])
                    return
                }
                const now = new Date()
                const upcoming = data.data
                    .filter((event) => new Date(event.startDate) >= now)
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
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
                        const activeLot = config ? getActiveLot(config.ticketLots) : null
                        const eventDateStr = getDateStr(event.startDate)

                        // Imagem: posterImageUrl do Event → flyerImageUrl do DayConfig → gradient
                        const imageUrl = event.posterImageUrl ?? config?.flyerImageUrl ?? null

                        // Preço: lote ativo do DayConfig → ticketPrice do Event → null
                        const displayPrice = activeLot ? activeLot.price : event.ticketPrice

                        return (
                            <article
                                key={event.id}
                                className={`rounded-2xl overflow-hidden border transition-all ${
                                    isHighlighted
                                        ? 'bg-white border-[#d4a574] shadow-xl shadow-[#d4a574]/20 md:-translate-y-1'
                                        : 'bg-white/90 border-[#e0d5c7] shadow-md shadow-black/5'
                                }`}
                            >
                                {/* Imagem */}
                                <div className="relative h-48 bg-gradient-to-br from-[#2a2a2a] to-[#4a4a4a]">
                                    {imageUrl && (
                                        <Image
                                            src={imageUrl}
                                            alt={event.title}
                                            fill
                                            className="object-cover"
                                        />
                                    )}
                                    {isHighlighted && (
                                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#d4a574] text-white text-xs font-semibold">
                                            Mais próximo
                                        </span>
                                    )}
                                    {/* Badge de lote ativo */}
                                    {activeLot && (
                                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-green-600 text-white text-[10px] font-bold">
                                            {activeLot.name} — até {new Date(`${activeLot.endsAt}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                    )}
                                </div>

                                <div className="p-5">
                                    <div className="inline-flex items-center gap-1 text-xs text-[#8a5c3f] mb-2">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {formatDate(event.startDate)}
                                    </div>

                                    <h3 className="text-xl font-semibold text-[#2a2a2a] mb-2">{event.title}</h3>

                                    {event.description && (
                                        <p className="text-sm text-[#8a5c3f] line-clamp-3 mb-4">{event.description}</p>
                                    )}

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

                                    {/* Botão CTA */}
                                    <Link
                                        href={`/reservas?date=${eventDateStr}`}
                                        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                                        style={{ background: 'var(--aissu-chocolate, #5c3d2e)' }}
                                    >
                                        Reservar
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </article>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
