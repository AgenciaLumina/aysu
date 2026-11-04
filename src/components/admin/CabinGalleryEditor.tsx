'use client'

import { useId, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronUp, ChevronDown, FolderOpen, Upload, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { MediaPicker } from '@/components/ui/MediaPicker'
import { MAX_CABIN_IMAGES, type CabinImage } from '@/lib/cabin-gallery'
import { optimizeImageBeforeUpload, readUploadApiResponse } from '@/lib/upload-client'

interface Props {
    images: CabinImage[]
    onChange: (images: CabinImage[]) => void
    onBusyChange: (busy: boolean) => void
    disabled?: boolean
}

export function CabinGalleryEditor({ images, onChange, onBusyChange, disabled = false }: Props) {
    const inputId = useId()
    const input = useRef<HTMLInputElement>(null)
    const [pickerOpen, setPickerOpen] = useState(false)
    const [progress, setProgress] = useState('')
    const busy = !!progress || disabled

    const move = (from: number, to: number) => {
        const next = [...images]
        const [photo] = next.splice(from, 1)
        next.splice(to, 0, photo)
        onChange(next)
    }

    const upload = async (selected: File[]) => {
        if (!selected.length) return
        if (images.length + selected.length > MAX_CABIN_IMAGES) {
            toast.error(`A galeria permite até ${MAX_CABIN_IMAGES} fotos.`)
            return
        }
        onBusyChange(true)
        const next = [...images]
        try {
            for (const [index, file] of selected.entries()) {
                try {
                    setProgress(`Convertendo foto ${index + 1} de ${selected.length}…`)
                    const optimized = await optimizeImageBeforeUpload(file)
                    const body = new FormData()
                    body.set('file', optimized)
                    body.set('folder', 'cabins')
                    setProgress(`Enviando foto ${index + 1} de ${selected.length}…`)
                    const response = await fetch('/api/upload', { method: 'POST', body })
                    const result = await readUploadApiResponse(response)
                    if (!response.ok || !result.success || !result.data?.url) throw new Error(result.error || 'Falha no envio da foto.')
                    next.push({ imageUrl: result.data.url, caption: '' })
                    onChange([...next])
                } catch (error) {
                    toast.error(`${file.name}: ${error instanceof Error ? error.message : 'Falha no envio.'}`)
                }
            }
        } finally {
            setProgress('')
            onBusyChange(false)
        }
    }

    return (
        <section aria-label="Galeria de fotos do espaço" className="space-y-4">
            <div>
                <h3 className="font-semibold text-[#2a2a2a]">Fotos do espaço</h3>
                <p className="mt-1 text-sm text-[#8a5c3f]">A primeira foto é a capa. Mostre a vista, a posição e o mobiliário. As alterações ficam públicas ao salvar o espaço.</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <input ref={input} id={inputId} type="file" accept="image/*" multiple className="hidden" disabled={busy}
                    onChange={event => { const field = event.currentTarget; void upload(Array.from(field.files || [])).finally(() => { field.value = '' }) }} />
                <Button type="button" variant="secondary" onClick={() => input.current?.click()} disabled={busy || images.length >= MAX_CABIN_IMAGES}>
                    <Upload className="h-4 w-4" /> Adicionar fotos
                </Button>
                <Button type="button" variant="outline" onClick={() => setPickerOpen(true)} disabled={busy || images.length >= MAX_CABIN_IMAGES}>
                    <FolderOpen className="h-4 w-4" /> Escolher da biblioteca
                </Button>
            </div>
            <p className="text-sm text-[#8a5c3f]" role="status">{progress || `${images.length} de ${MAX_CABIN_IMAGES} fotos`}</p>
            {!images.length && <p className="py-4 text-sm text-[#8a5c3f]">Nenhuma foto adicionada. Envie uma imagem ou escolha uma da biblioteca.</p>}
            <ol className="space-y-4">
                {images.map((photo, index) => (
                    <li key={photo.imageUrl} className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 border-b border-[#e0d5c7] pb-4">
                        <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f5f0eb]">
                            <Image src={photo.imageUrl} alt={photo.caption || `Foto ${index + 1} do espaço`} fill unoptimized className="object-cover" />
                        </div>
                        <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-[#5c3d2e]">{index === 0 ? 'Capa' : `Foto ${index + 1}`}</span>
                                {index > 0 && <button type="button" onClick={() => move(index, 0)} disabled={busy} className="min-h-11 px-2 text-sm font-medium text-[#5c3d2e] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[#5c3d2e] disabled:opacity-50">Usar como capa</button>}
                            </div>
                            <label htmlFor={`${inputId}-caption-${index}`} className="sr-only">Legenda da foto {index + 1}</label>
                            <input id={`${inputId}-caption-${index}`} value={photo.caption} maxLength={160} placeholder="Legenda (opcional)" disabled={busy}
                                onChange={event => onChange(images.map((image, position) => position === index ? { ...image, caption: event.target.value } : image))}
                                className="min-h-11 w-full rounded-lg border border-[#e0d5c7] px-3 py-2 text-sm text-[#2a2a2a] placeholder:text-[#8a5c3f] focus:outline-none focus:ring-2 focus:ring-[#d4a574]" />
                            <div className="flex flex-wrap gap-1">
                                <Button type="button" variant="ghost" className="min-h-11 min-w-11" aria-label={`Mover foto ${index + 1} para cima`} disabled={busy || index === 0} onClick={() => move(index, index - 1)}><ChevronUp className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" className="min-h-11 min-w-11" aria-label={`Mover foto ${index + 1} para baixo`} disabled={busy || index === images.length - 1} onClick={() => move(index, index + 1)}><ChevronDown className="h-4 w-4" /></Button>
                                <Button type="button" variant="ghost" className="min-h-11 min-w-11 text-red-700" aria-label={`Remover foto ${index + 1} da galeria`} disabled={busy} onClick={() => onChange(images.filter((_, position) => position !== index))}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </li>
                ))}
            </ol>
            <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} initialMode="browse" defaultFolder=""
                onSelect={imageUrl => {
                    if (images.some(photo => photo.imageUrl === imageUrl)) toast.error('Esta foto já está na galeria.')
                    else if (images.length < MAX_CABIN_IMAGES) onChange([...images, { imageUrl, caption: '' }])
                }} />
        </section>
    )
}
