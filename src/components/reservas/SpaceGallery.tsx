'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Images } from 'lucide-react'
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle, ModalTrigger } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { CabinImage } from '@/lib/cabin-gallery'

export function SpaceGallery({ name, images }: { name: string; images: CabinImage[] }) {
    const [open, setOpen] = useState(false)
    const [index, setIndex] = useState(0)
    const touchStart = useRef<number | null>(null)
    if (!images.length) return null
    const active = Math.min(index, images.length - 1)
    const photo = images[active]
    const change = (direction: number) => setIndex((active + direction + images.length) % images.length)
    return (
        <Modal open={open} onOpenChange={value => { setOpen(value); if (value) setIndex(0) }}>
            <ModalTrigger asChild>
                <Button type="button" variant="outline" className="mt-3 min-h-11 w-full" aria-label={`Ver ${images.length} ${images.length === 1 ? 'foto' : 'fotos'} de ${name}`}>
                    <Images className="h-4 w-4" /> Ver {images.length === 1 ? 'foto' : `fotos (${images.length})`}
                </Button>
            </ModalTrigger>
            <ModalContent className="max-h-[94dvh] w-[calc(100%-1rem)] max-w-4xl gap-3 overflow-y-auto p-4 sm:p-6"
                onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); change(event.key === 'ArrowRight' ? 1 : -1) } }}>
                <ModalHeader className="pr-10">
                    <ModalTitle>{name}</ModalTitle>
                    <ModalDescription className="text-[#8a5c3f]">Conheça os detalhes do espaço antes de reservar.</ModalDescription>
                </ModalHeader>
                <div className="relative h-[52dvh] min-h-48 overflow-hidden rounded-lg bg-[#f5f0eb] sm:h-[58dvh]"
                    onTouchStart={event => { touchStart.current = event.touches.length === 1 ? event.touches[0].clientX : null }}
                    onTouchEnd={event => { if (touchStart.current !== null) { const distance = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(distance) > 45) change(distance < 0 ? 1 : -1) } touchStart.current = null }}>
                    <Image key={photo.imageUrl} src={photo.imageUrl} alt={photo.caption || `${name}, foto ${active + 1}`} fill unoptimized className="object-contain" />
                </div>
                <div className="flex items-center justify-between gap-3">
                    <Button type="button" variant="outline" className="min-h-11 min-w-11" aria-label="Foto anterior" disabled={images.length < 2} onClick={() => change(-1)}><ChevronLeft className="h-5 w-5" /></Button>
                    <div className="min-w-0 text-center" aria-live="polite" aria-atomic="true">
                        <p className="text-sm text-[#8a5c3f]">Foto {active + 1} de {images.length}</p>
                        {photo.caption && <p className="mt-1 break-words text-sm font-medium text-[#2a2a2a]">{photo.caption}</p>}
                    </div>
                    <Button type="button" variant="outline" className="min-h-11 min-w-11" aria-label="Próxima foto" disabled={images.length < 2} onClick={() => change(1)}><ChevronRight className="h-5 w-5" /></Button>
                </div>
                {images.length > 1 && <div className="flex gap-2 overflow-x-auto py-1" aria-label="Miniaturas das fotos">
                    {images.map((image, position) => <button key={image.imageUrl} type="button" onClick={() => setIndex(position)} aria-label={`Ver foto ${position + 1}${image.caption ? `: ${image.caption}` : ''}`} aria-pressed={position === active}
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5c3d2e] ${position === active ? 'border-[#5c3d2e]' : 'border-transparent'}`}>
                        <Image src={image.imageUrl} alt="" fill unoptimized className="object-cover" />
                    </button>)}
                </div>}
            </ModalContent>
        </Modal>
    )
}
