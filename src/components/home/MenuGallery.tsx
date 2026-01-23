// Menu Gallery Component - Galeria de imagens do menu gerenciável via admin
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, ImageIcon } from 'lucide-react'

interface MenuImage {
    id: string
    imageUrl: string
    caption: string | null
    displayOrder: number
}

export function MenuGallery() {
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

    if (loading) {
        return (
            <section className="py-16 bg-[#fdfbf8]">
                <div className="container-aissu">
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-[#d4a574] border-t-transparent rounded-full animate-spin" />
                    </div>
                </div>
            </section>
        )
    }

    if (images.length === 0) {
        return null // Não mostrar seção se não houver imagens
    }

    return (
        <>
            <section id="menu" className="py-16 md:py-24 bg-[#fdfbf8]">
                <div className="container-aissu">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <span className="text-[#d4a574] text-sm font-bold tracking-[0.2em] uppercase mb-3 block">
                            Gastronomia
                        </span>
                        <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[#2a2a2a] mb-4">
                            Nosso Menu
                        </h2>
                        <p className="text-[#8a5c3f] max-w-2xl mx-auto text-lg">
                            Sabores autênticos do litoral aliados a técnicas contemporâneas
                        </p>
                    </div>

                    {/* Grid de Imagens */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((image, index) => (
                            <div
                                key={image.id}
                                onClick={() => openLightbox(image, index)}
                                className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                            >
                                <Image
                                    src={image.imageUrl}
                                    alt={image.caption || 'Menu item'}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                {image.caption && (
                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <p className="text-sm font-medium">{image.caption}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); closeLightbox() }}
                        className="absolute top-6 right-6 text-white/80 hover:text-white z-10"
                    >
                        <X className="h-8 w-8" />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); goPrev() }}
                        className="absolute left-6 text-white/80 hover:text-white z-10"
                    >
                        <ChevronLeft className="h-12 w-12" />
                    </button>

                    <div
                        className="relative max-w-4xl max-h-[80vh] w-full h-full m-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={selectedImage.imageUrl}
                            alt={selectedImage.caption || 'Menu item'}
                            fill
                            className="object-contain"
                        />
                        {selectedImage.caption && (
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="text-white text-xl font-medium text-center">
                                    {selectedImage.caption}
                                </p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); goNext() }}
                        className="absolute right-6 text-white/80 hover:text-white z-10"
                    >
                        <ChevronRight className="h-12 w-12" />
                    </button>

                    {/* Contador */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm">
                        {currentIndex + 1} / {images.length}
                    </div>
                </div>
            )}
        </>
    )
}
