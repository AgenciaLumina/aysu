// AISSU Beach Lounge - Gallery Feed Component (Horizontal Carousel with Infinite Scroll)
'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight, Loader2, ImageIcon, Instagram } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface GalleryImage {
    id: string
    imageUrl: string
    caption: string | null
    permalink: string | null
    createdAt: string
}

interface GalleryFeedProps {
    limit?: number
}

const INSTAGRAM_URL = 'https://instagram.com/aysu_beachlounge'

export default function InstagramFeed({ limit = 12 }: GalleryFeedProps) {
    const [images, setImages] = useState<GalleryImage[]>([])
    const [loading, setLoading] = useState(true)
    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        async function fetchImages() {
            try {
                const res = await fetch('/api/gallery')
                const data = await res.json()
                if (data.success) {
                    setImages(data.data.slice(0, limit))
                }
            } catch (error) {
                console.error('Error fetching gallery:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchImages()
    }, [limit])

    // Scroll infinito suave, sem reset abrupto durante a interação normal
    const handleScroll = () => {
        // Implementação simplificada de infinite scroll apenas detectando edges se necessário
        // Por enquanto, deixamos o array duplicado 5x garantir bastante scroll
    }

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current

            // Tenta pegar a largura do primeiro item real
            const firstItem = container.firstElementChild as HTMLElement
            // Se não tiver item, pega a largura do container / 4 (aprox)
            const itemWidth = firstItem ? firstItem.offsetWidth : (container.clientWidth / 4)
            const gap = 16 // gap-4
            const scrollAmount = itemWidth + gap

            const newScrollLeft = container.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount)

            container.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            })
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 text-[#d4a574] animate-spin" />
            </div>
        )
    }

    if (images.length === 0) {
        return (
            <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 text-[#d4a574] mx-auto mb-4" />
                <p className="text-aissu-text-muted text-lg">
                    Em breve, fotos incríveis do nosso Beach Club 📸
                </p>
            </div>
        )
    }

    // Duplicar imagens bastante vezes para dar sensação de infinito
    const infiniteImages = [...images, ...images, ...images, ...images, ...images]

    return (
        <div className="w-full">
            {/* Carousel Row: Arrow Left + Images + Arrow Right */}
            <div className="flex items-center gap-3">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll('left')}
                    className="flex-shrink-0 bg-white hover:bg-gray-50 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 border border-gray-200 z-10"
                    aria-label="Anterior"
                >
                    <ChevronLeft className="h-6 w-6 text-[#2a2a2a]" />
                </button>

                {/* Horizontal Scroll Container */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 flex gap-4 overflow-x-auto scrollbar-hide py-4 px-1 snap-x snap-mandatory"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                >
                    {infiniteImages.map((image, index) => (
                        <a
                            key={`${image.id}-${index}`}
                            href={image.permalink || INSTAGRAM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                                group relative flex-shrink-0 snap-center
                                w-[calc(100%-16px)] sm:w-[calc(50%-16px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-12px)]
                                aspect-[4/5]
                                rounded-xl overflow-hidden bg-aissu-cream shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer
                            "
                            onMouseEnter={() => setHoveredId(`${image.id}-${index}`)}
                            onMouseLeave={() => setHoveredId(null)}
                            aria-label={`Ver no Instagram`}
                        >
                            {/* Instagram Badge */}
                            <div className="absolute top-3 right-3 z-20 bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] p-1.5 rounded-full shadow-lg opacity-90 group-hover:opacity-100 transition-opacity">
                                <Instagram className="h-4 w-4 text-white" />
                            </div>

                            {/* Image */}
                            <div className="relative w-full h-full">
                                <Image
                                    src={image.imageUrl}
                                    alt={image.caption || 'Imagem da galeria'}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                />
                            </div>

                            {/* Hover Overlay */}
                            <div
                                className={`
                                    absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent
                                    flex flex-col items-center justify-end p-6
                                    transition-opacity duration-300
                                    ${hoveredId === `${image.id}-${index}` ? 'opacity-100' : 'opacity-0'}
                                `}
                            >
                                {/* Caption Preview */}
                                {image.caption && (
                                    <p className="text-white text-xs text-center line-clamp-2 mb-3">
                                        {image.caption}
                                    </p>
                                )}

                                {/* Ver no Instagram CTA */}
                                <div
                                    className="px-4 py-2 bg-gradient-to-r from-[#f09433] via-[#e1306c] to-[#833ab4] rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-xl"
                                    style={{ color: '#FFFFFF' }}
                                >
                                    <Instagram className="h-3.5 w-3.5" style={{ filter: 'brightness(0) invert(1)' }} />
                                    <span>VER NO INSTAGRAM</span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll('right')}
                    className="flex-shrink-0 bg-white hover:bg-gray-50 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 border border-gray-200 z-10"
                    aria-label="Próximo"
                >
                    <ChevronRight className="h-6 w-6 text-[#2a2a2a]" />
                </button>
            </div>

            {/* Scroll Indicators */}
            <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: Math.min(images.length, 5) }).map((_, idx) => (
                    <div
                        key={idx}
                        className="w-2 h-2 rounded-full bg-[#d4a574]/40"
                    />
                ))}
            </div>
        </div>
    )
}
