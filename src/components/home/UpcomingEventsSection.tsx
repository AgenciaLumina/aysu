'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, ChevronRight, Music, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatDateUTC } from '@/lib/utils'

export default function UpcomingEventsSection() {
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Busca eventos ativos no futuro
        fetch('/api/events?isActive=true')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    const now = new Date()
                    // Ordena por data e pega eventos futuros (ou de hoje) + limit 3
                    const upcoming = data.data
                        .filter((e: any) => new Date(e.startDate) >= now)
                        .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                        .slice(0, 3)

                    setEvents(upcoming)
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading || events.length === 0) {
        return null // Não exibe seção se não houver eventos
    }

    const mainEvent = events[0]
    const otherEvents = events.slice(1)

    return (
        <section className="py-24 bg-[#111111] text-white relative overflow-hidden" id="programacao">
            {/* Background pattern escuro */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />

            <div className="container-aissu relative z-10">
                <div className="text-center mb-16">
                    <span className="text-[#d4a574] text-sm font-bold tracking-[0.2em] uppercase mb-3 block">Não perca o que vem por aí</span>
                    <h2 className="font-serif text-4xl lg:text-5xl font-bold mb-6">
                        Próximas <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f1c595] to-[#d4a574] italic">Atrações</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                        Prepare-se para viver momentos inesquecíveis. Antecipe suas reservas para nossos eventos exclusivos e evite a indisponibilidade.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-stretch">
                    {/* Evento Principal em Destaque */}
                    <div className="lg:w-2/3 flex flex-col group relative rounded-3xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl hover:border-[#d4a574]/40 transition-colors duration-500 min-h-[500px]">
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                        {mainEvent.bannerImageUrl ? (
                            <Image
                                src={mainEvent.bannerImageUrl}
                                alt={mainEvent.title}
                                fill
                                className="object-cover transform group-hover:scale-105 transition-transform duration-1000"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-1000">
                                <Music className="w-32 h-32 opacity-10 text-white" />
                            </div>
                        )}

                        <div className="absolute top-6 left-6 z-20">
                            <div className="bg-[#d4a574] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {formatDateUTC(mainEvent.startDate)}
                            </div>
                        </div>

                        <div className="relative z-20 mt-auto p-8 lg:p-12">
                            <h3 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-white drop-shadow-md">
                                {mainEvent.title}
                            </h3>
                            {mainEvent.fullDescription && (
                                <p className="text-gray-300 text-lg mb-8 max-w-2xl line-clamp-3">
                                    {mainEvent.fullDescription}
                                </p>
                            )}

                            <div className="flex flex-wrap gap-4 items-center">
                                <Link href="/reservas" scroll={false}>
                                    <Button size="xl" className="bg-[#d4a574] hover:bg-[#c49363] text-white shadow-xl shadow-[#d4a574]/20 border-none group-hover:shadow-[#d4a574]/40 transition-shadow">
                                        Garantir Minha Reserva
                                        <ChevronRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                                {mainEvent.djName && (
                                    <div className="flex items-center gap-2 text-sm text-gray-300 bg-white/10 px-4 py-3 rounded-xl backdrop-blur-md">
                                        <Music className="w-4 h-4 text-[#d4a574]" />
                                        <span>Line-up: <strong className="text-white">{mainEvent.djName}</strong></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Próximos (se existirem mais) */}
                    {otherEvents.length > 0 && (
                        <div className="lg:w-1/3 flex flex-col gap-6">
                            <h4 className="text-xl font-serif text-gray-300 mb-2 pl-2 border-l-2 border-[#d4a574]">Mais opções em seguida</h4>
                            {otherEvents.map((ev, i) => (
                                <Link href="/reservas" key={i} className="group block bg-gray-900 border border-gray-800 rounded-3xl p-6 hover:border-[#d4a574]/50 hover:bg-gray-800 transition-all shadow-xl">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-[#d4a574]" />
                                            {formatDateUTC(ev.startDate)}
                                        </div>
                                        {ev.eventType === 'DJ_NIGHT' && <Music className="w-5 h-5 text-gray-500 group-hover:text-[#d4a574] transition-colors" />}
                                    </div>
                                    <h3 className="font-serif text-2xl font-bold mb-2 text-white group-hover:text-[#d4a574] transition-colors">{ev.title}</h3>
                                    <p className="text-gray-400 text-sm line-clamp-2 mb-6">
                                        {ev.description || ev.fullDescription || 'Garanta seu espaço com antecedência e preço promocional.'}
                                    </p>
                                    <div className="flex items-center text-[#d4a574] text-sm font-semibold group-hover:translate-x-2 transition-transform">
                                        Reservar agora
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </div>
                                </Link>
                            ))}

                            {/* Filler se tiver só mais um evento para preencher espaço */}
                            {otherEvents.length === 1 && (
                                <div className="flex-1 bg-gradient-to-br from-gray-900 to-[#111] border border-gray-800/50 rounded-3xl p-6 flex flex-col justify-center items-center text-center opacity-60">
                                    <Users className="w-12 h-12 text-gray-700 mb-4" />
                                    <p className="text-gray-500 font-serif mb-2">Acompanhe nossa agenda completa no Instagram</p>
                                    <span className="text-xs text-gray-600 block">@aysu_beachlounge</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
