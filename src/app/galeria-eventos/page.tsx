'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, Camera, ChevronRight, Images, Loader2, Sparkles } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface EventGalleryCard {
    id: string
    title: string
    slug: string
    eventDate: string | null
    shortDescription: string | null
    description: string | null
    coverImageUrl: string | null
    images: { id: string; imageUrl: string }[]
    _count?: { images: number }
}

function formatDateLabel(value: string | null): string {
    if (!value) return 'Data não informada'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Data não informada'

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })
}

export default function EventGalleryListPage() {
    const [galleries, setGalleries] = useState<EventGalleryCard[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchGalleries() {
            try {
                const res = await fetch('/api/event-galleries?limit=60', { cache: 'no-store' })
                const data = await res.json()

                if (data.success) {
                    setGalleries(data.data)
                }
            } catch (error) {
                console.error('Erro ao carregar galerias de eventos:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchGalleries()
    }, [])

    const hasContent = useMemo(() => galleries.length > 0, [galleries])

    return (
        <div className="min-h-screen bg-[#f8f6f3]">
            <Header variant="solid" />

            <section className="relative overflow-hidden pt-16 pb-14 border-b border-[#eadfce] bg-gradient-to-br from-[#fdf8f1] via-[#f8f4ee] to-[#f3ebdf]">
                <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#d4a574]/20 blur-3xl" />
                <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[#8a5c3f]/10 blur-3xl" />

                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                    <p className="uppercase tracking-[0.25em] text-xs text-[#8a5c3f] mb-3">Portfólio Aysú</p>
                    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-[#2a2a2a] leading-tight max-w-4xl">
                        Galeria de Eventos
                    </h1>
                    <p className="mt-4 text-lg text-[#8a5c3f] max-w-2xl leading-relaxed">
                        Conheça eventos reais que aconteceram no Aysú e imagine o seu próximo projeto acontecendo aqui.
                    </p>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-[#d4a574]" />
                    </div>
                ) : !hasContent ? (
                    <div className="text-center rounded-3xl border border-[#eadfce] bg-white p-16">
                        <Images className="h-12 w-12 text-[#d4a574] mx-auto mb-4" />
                        <h2 className="font-serif text-2xl text-[#2a2a2a] mb-2">Galerias em breve</h2>
                        <p className="text-[#8a5c3f]">Estamos preparando os melhores registros dos nossos eventos.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {galleries.map((gallery) => (
                            <Link
                                key={gallery.id}
                                href={`/galeria-eventos/${gallery.slug}`}
                                className="group rounded-3xl overflow-hidden bg-white border border-[#eadfce] shadow-sm hover:shadow-xl transition-all"
                            >
                                <div className="relative aspect-[4/5] bg-[#f1ede6]">
                                    {gallery.coverImageUrl ? (
                                        <Image
                                            src={gallery.coverImageUrl}
                                            alt={gallery.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-[#8a5c3f]">
                                            <Camera className="h-10 w-10" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 text-[#2a2a2a] text-xs font-semibold">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            {formatDateLabel(gallery.eventDate)}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2a2a2a]/85 text-white text-xs font-semibold">
                                            {(gallery._count?.images ?? gallery.images.length) || 0} fotos
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <h2 className="font-serif text-2xl text-[#2a2a2a] mb-2 leading-tight">{gallery.title}</h2>
                                    <p className="text-[#8a5c3f] line-clamp-2 min-h-[44px]">
                                        {gallery.shortDescription || gallery.description || 'Veja os bastidores e a energia desse evento no Aysú.'}
                                    </p>
                                    <div className="mt-4 inline-flex items-center gap-2 text-[#8a5c3f] font-semibold group-hover:text-[#bc8e5e] transition-colors">
                                        Ver galeria completa
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            <section className="max-w-6xl mx-auto px-6 lg:px-8 pb-16">
                <div className="rounded-3xl border border-[#d6b88f] bg-gradient-to-r from-[#2a2a2a] to-[#3b2f26] p-8 md:p-10 text-white relative overflow-hidden">
                    <div className="absolute right-6 top-6 opacity-20">
                        <Sparkles className="h-20 w-20" />
                    </div>
                    <p className="uppercase tracking-[0.2em] text-xs text-[#f1c595] mb-3">Seu evento aqui</p>
                    <h3 className="font-serif text-3xl md:text-4xl mb-4">Quero fazer parte da próxima galeria</h3>
                    <p className="text-white/80 max-w-2xl mb-6">
                        Estrutura premium, praia exclusiva e operação completa para transformar seu evento em experiência memorável.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/eventos" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#d4a574] text-white font-semibold hover:bg-[#bc8e5e] transition-colors">
                            Solicitar proposta
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                        <a
                            href="https://wa.me/5512982896301?text=Ol%C3%A1!%20Quero%20fazer%20meu%20evento%20no%20Ays%C3%BA."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors"
                        >
                            Falar no WhatsApp
                        </a>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
