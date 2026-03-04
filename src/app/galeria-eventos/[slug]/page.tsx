'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { ArrowLeft, CalendarDays, ChevronRight, Loader2, X } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface GalleryPhoto {
    id: string
    imageUrl: string
    caption: string | null
}

interface EventGalleryDetail {
    id: string
    title: string
    slug: string
    eventDate: string | null
    shortDescription: string | null
    description: string | null
    coverImageUrl: string | null
    ctaText: string | null
    ctaHref: string | null
    images: GalleryPhoto[]
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

export default function EventGalleryDetailPage() {
    const params = useParams<{ slug: string }>()
    const slug = useMemo(() => (typeof params?.slug === 'string' ? params.slug : ''), [params])

    const [gallery, setGallery] = useState<EventGalleryDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState<GalleryPhoto | null>(null)

    useEffect(() => {
        if (!slug) return

        async function fetchGallery() {
            try {
                const res = await fetch(`/api/event-galleries/${slug}`, { cache: 'no-store' })
                const data = await res.json()

                if (!data.success) {
                    setGallery(null)
                    return
                }

                setGallery(data.data)
            } catch (error) {
                console.error('Erro ao carregar galeria:', error)
                setGallery(null)
            } finally {
                setLoading(false)
            }
        }

        fetchGallery()
    }, [slug])

    return (
        <div className="min-h-screen bg-[#f8f6f3]">
            <Header variant="solid" />

            {loading ? (
                <div className="max-w-7xl mx-auto px-6 py-28 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#d4a574]" />
                </div>
            ) : !gallery ? (
                <div className="max-w-4xl mx-auto px-6 py-20 text-center">
                    <h1 className="font-serif text-4xl text-[#2a2a2a] mb-4">Galeria não encontrada</h1>
                    <p className="text-[#8a5c3f] mb-8">Esta galeria pode ter sido removida ou ainda não foi publicada.</p>
                    <Link
                        href="/galeria-eventos"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2a2a2a] text-white font-semibold"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar para galerias
                    </Link>
                </div>
            ) : (
                <>
                    <section className="relative overflow-hidden border-b border-[#eadfce] bg-[#1f1a17] text-white">
                        <div className="absolute inset-0 opacity-40">
                            {gallery.coverImageUrl && (
                                <Image
                                    src={gallery.coverImageUrl}
                                    alt={gallery.title}
                                    fill
                                    className="object-cover"
                                />
                            )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1f1a17] via-[#1f1a17]/80 to-[#1f1a17]/60" />

                        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 relative z-10">
                            <Link
                                href="/galeria-eventos"
                                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Voltar para Galeria de Eventos
                            </Link>

                            <p className="uppercase tracking-[0.2em] text-xs text-[#f1c595] mb-3">Evento realizado</p>
                            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-4xl">
                                {gallery.title}
                            </h1>
                            <p className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/95 text-sm">
                                <CalendarDays className="h-4 w-4" />
                                {formatDateLabel(gallery.eventDate)} • {(gallery._count?.images ?? gallery.images.length) || 0} fotos
                            </p>
                            <p className="mt-5 text-lg text-white/85 max-w-3xl leading-relaxed">
                                {gallery.description || gallery.shortDescription || 'Um registro visual da experiência vivida no Aysú Beach Lounge.'}
                            </p>
                        </div>
                    </section>

                    <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                        {gallery.images.length === 0 ? (
                            <div className="rounded-2xl border border-[#eadfce] bg-white p-10 text-center text-[#8a5c3f]">
                                Esta galeria ainda não tem fotos publicadas.
                            </div>
                        ) : (
                            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
                                {gallery.images.map((image, index) => (
                                    <button
                                        key={image.id || `${image.imageUrl}-${index}`}
                                        type="button"
                                        onClick={() => setSelectedImage(image)}
                                        className="group relative mb-4 w-full break-inside-avoid rounded-2xl overflow-hidden border border-[#eadfce] bg-white"
                                    >
                                        <div className="relative w-full aspect-[3/4]">
                                            <Image
                                                src={image.imageUrl}
                                                alt={image.caption || `${gallery.title} - foto ${index + 1}`}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        {image.caption && (
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-white text-sm">
                                                {image.caption}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="max-w-6xl mx-auto px-6 lg:px-8 pb-16">
                        <div className="rounded-3xl border border-[#d6b88f] bg-white p-8 md:p-10">
                            <p className="uppercase tracking-[0.2em] text-xs text-[#8a5c3f] mb-3">Seu próximo evento</p>
                            <h3 className="font-serif text-3xl md:text-4xl text-[#2a2a2a] mb-4">
                                {gallery.ctaText || 'Quero fazer meu evento no Aysú'}
                            </h3>
                            <p className="text-[#8a5c3f] max-w-3xl mb-6">
                                Faça parte dessa experiência: estrutura premium, equipe dedicada e cenário único pé na areia.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href={gallery.ctaHref || '/eventos'}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2a2a2a] text-white font-semibold hover:bg-[#1a1a1a] transition-colors"
                                >
                                    Solicitar proposta
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                                <a
                                    href="https://wa.me/5512982896301?text=Ol%C3%A1!%20Vi%20a%20galeria%20de%20eventos%20e%20quero%20fazer%20o%20meu%20no%20Ays%C3%BA."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#d4a574] text-[#8a5c3f] font-semibold hover:bg-[#f5f0e8] transition-colors"
                                >
                                    Falar no WhatsApp
                                </a>
                            </div>
                        </div>
                    </section>
                </>
            )}

            {selectedImage && (
                <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                    <button
                        type="button"
                        className="absolute top-5 right-5 h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="relative w-full max-w-3xl aspect-[3/4]" onClick={(event) => event.stopPropagation()}>
                        <Image
                            src={selectedImage.imageUrl}
                            alt={selectedImage.caption || 'Foto do evento'}
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
            )}

            <Footer />
        </div>
    )
}
