// AISSU Beach Lounge - Página Cardápio (Galeria de Fotos)
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, ChevronLeft, ChevronRight, ImageIcon, ExternalLink, UtensilsCrossed } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'

interface MenuImage {
    id: string
    imageUrl: string
    caption: string | null
    displayOrder: number
}

const MENU_EXTERNAL_URL = 'https://menu.kcms.app/6a27ed69-d6db-4244-8c66-dffc9f3ab449/cardapio/visualizar'

export default function CardapioPage() {
    const [images, setImages] = useState<MenuImage[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedImage, setSelectedImage] = useState<MenuImage | null>(null)
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        fetchImages()
    }, [])

    const fetchImages = async () => {
        try {
            const res = await fetch('/api/menu-gallery')
            const data = await res.json()
            if (data.success) {
                setImages(data.data)
            }
        } catch (error) {
            console.error('Error fetching menu gallery:', error)
        } finally {
            setLoading(false)
        }
    }

    const openLightbox = (image: MenuImage, index: number) => {
        setSelectedImage(image)
        setCurrentIndex(index)
    }

    const closeLightbox = () => setSelectedImage(null)

    const goNext = () => {
        const nextIndex = (currentIndex + 1) % images.length
        setCurrentIndex(nextIndex)
        setSelectedImage(images[nextIndex])
    }

    const goPrev = () => {
        const prevIndex = (currentIndex - 1 + images.length) % images.length
        setCurrentIndex(prevIndex)
        setSelectedImage(images[prevIndex])
    }

    return (
        <div className="min-h-screen bg-[#fdfbf8]">
            <Header />

            {/* Hero com paleta Aysú */}
            <section className="pt-24 pb-16 bg-gradient-to-b from-[#f5f0e8] to-[#fdfbf8]">
                <div className="container-aissu text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4a574]/10 text-[#d4a574] text-sm font-medium uppercase tracking-wider mb-6">
                        <UtensilsCrossed className="h-4 w-4" />
                        <span>Gastronomia</span>
                    </div>

                    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-[#2a2a2a] mb-4">
                        Nosso <span className="text-[#d4a574] italic">Menu</span>
                    </h1>

                    <p className="text-[#8a5c3f] text-lg max-w-2xl mx-auto mb-8">
                        Sabores autênticos do litoral aliados a técnicas contemporâneas, drinks autorais e marcas premium.
                    </p>

                    {/* Botão Ver Cardápio Completo */}
                    <a
                        href={MENU_EXTERNAL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button size="lg" className="shadow-xl shadow-[#d4a574]/20">
                            <ExternalLink className="h-5 w-5 mr-2" />
                            Ver Cardápio Completo
                        </Button>
                    </a>
                </div>
            </section>

            {/* Gallery */}
            <section className="py-12 md:py-20">
                <div className="container-aissu">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-3 border-[#d4a574] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : images.length === 0 ? (
                        <div className="text-center py-16">
                            <ImageIcon className="h-16 w-16 text-[#e0d5c7] mx-auto mb-4" />
                            <p className="text-[#8a5c3f] text-lg mb-6">
                                Fotos do nosso menu em breve...
                            </p>
                            <a
                                href={MENU_EXTERNAL_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button variant="secondary">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Acessar Cardápio Digital
                                </Button>
                            </a>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                {images.map((image, index) => (
                                    <div
                                        key={image.id}
                                        onClick={() => openLightbox(image, index)}
                                        className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-lg border border-[#e0d5c7]/50"
                                    >
                                        <Image
                                            src={image.imageUrl}
                                            alt={image.caption || 'Menu item'}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#2a2a2a]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        {image.caption && (
                                            <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <p className="text-sm font-medium">{image.caption}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* CTA após galeria */}
                            <div className="text-center mt-12">
                                <a
                                    href={MENU_EXTERNAL_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button size="lg" variant="outline" className="border-[#d4a574] text-[#d4a574] hover:bg-[#d4a574] hover:text-white">
                                        <ExternalLink className="h-5 w-5 mr-2" />
                                        Ver Cardápio Completo com Preços
                                    </Button>
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </section>

            <Footer />

            {/* Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-[#2a2a2a]/95 flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); closeLightbox() }}
                        className="absolute top-6 right-6 text-white/80 hover:text-white z-10"
                    >
                        <X className="h-8 w-8" />
                    </button>

                    {images.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goPrev() }}
                            className="absolute left-4 md:left-8 text-white/80 hover:text-[#d4a574] z-10 transition-colors"
                        >
                            <ChevronLeft className="h-10 w-10 md:h-12 md:w-12" />
                        </button>
                    )}

                    <div
                        className="relative max-w-5xl max-h-[85vh] w-full h-full m-4 md:m-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={selectedImage.imageUrl}
                            alt={selectedImage.caption || 'Menu item'}
                            fill
                            className="object-contain"
                        />
                        {selectedImage.caption && (
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#2a2a2a]/90 to-transparent">
                                <p className="text-white text-lg md:text-xl font-medium text-center">
                                    {selectedImage.caption}
                                </p>
                            </div>
                        )}
                    </div>

                    {images.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goNext() }}
                            className="absolute right-4 md:right-8 text-white/80 hover:text-[#d4a574] z-10 transition-colors"
                        >
                            <ChevronRight className="h-10 w-10 md:h-12 md:w-12" />
                        </button>
                    )}

                    {/* Contador */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-[#2a2a2a]/70 px-4 py-2 rounded-full border border-[#d4a574]/30">
                        {currentIndex + 1} / {images.length}
                    </div>
                </div>
            )}
        </div>
    )
}
