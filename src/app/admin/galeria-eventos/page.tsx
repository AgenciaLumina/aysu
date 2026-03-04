'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    CalendarDays,
    Eye,
    FolderOpen,
    Images,
    Loader2,
    Pencil,
    Plus,
    Trash2,
    Upload,
    WandSparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { MediaPicker } from '@/components/ui/MediaPicker'
import { generateSlug } from '@/lib/utils'
import {
    getLargeImageWarning,
    getUploadPayloadError,
    optimizeImageBeforeUpload,
    readUploadApiResponse,
    validateImageUpload,
} from '@/lib/upload-client'

interface GalleryPhoto {
    id?: string
    imageUrl: string
    caption: string | null
    displayOrder: number
}

interface EventGallery {
    id: string
    title: string
    slug: string
    eventDate: string | null
    shortDescription: string | null
    description: string | null
    coverImageUrl: string | null
    ctaText: string | null
    ctaHref: string | null
    isActive: boolean
    displayOrder: number
    createdAt: string
    images: GalleryPhoto[]
    _count?: { images: number }
}

interface GalleryForm {
    title: string
    slug: string
    eventDate: string
    shortDescription: string
    description: string
    coverImageUrl: string
    ctaText: string
    ctaHref: string
    isActive: boolean
}

function normalizeSlug(value: string): string {
    return generateSlug(value).slice(0, 80)
}

function getGalleryFolder(slugOrTitle: string): string {
    const normalized = normalizeSlug(slugOrTitle)
    return `galeria-eventos/${normalized || 'galeria'}`
}

function toInputDate(value: string | null): string {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''

    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function formatDateLabel(value: string | null): string {
    if (!value) return 'Sem data'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Sem data'

    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })
}

function createInitialForm(): GalleryForm {
    return {
        title: '',
        slug: '',
        eventDate: '',
        shortDescription: '',
        description: '',
        coverImageUrl: '',
        ctaText: 'Quero fazer meu evento no Aysú',
        ctaHref: '/eventos',
        isActive: true,
    }
}

export default function AdminEventGalleryPage() {
    const [galleries, setGalleries] = useState<EventGallery[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadingCover, setUploadingCover] = useState(false)
    const [uploadingPhotos, setUploadingPhotos] = useState(false)
    const [coverUploadStep, setCoverUploadStep] = useState<'idle' | 'optimizing' | 'uploading'>('idle')
    const [photosUploadStep, setPhotosUploadStep] = useState<'idle' | 'optimizing' | 'uploading'>('idle')
    const [coverDragOver, setCoverDragOver] = useState(false)
    const [photosDragOver, setPhotosDragOver] = useState(false)
    const [showCoverPicker, setShowCoverPicker] = useState(false)
    const [showPhotosPicker, setShowPhotosPicker] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingGallery, setEditingGallery] = useState<EventGallery | null>(null)
    const [form, setForm] = useState<GalleryForm>(createInitialForm)
    const [photos, setPhotos] = useState<GalleryPhoto[]>([])
    const [slugTouched, setSlugTouched] = useState(false)

    const coverInputRef = useRef<HTMLInputElement>(null)
    const photosInputRef = useRef<HTMLInputElement>(null)

    const currentFolder = useMemo(
        () => getGalleryFolder(form.slug || form.title),
        [form.slug, form.title]
    )

    const fetchGalleries = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/event-galleries', { cache: 'no-store' })
            const data = await res.json()

            if (!data.success) {
                throw new Error(data.error || 'Erro ao carregar galerias')
            }

            setGalleries(data.data)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao carregar galerias')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchGalleries()
    }, [fetchGalleries])

    const openCreateModal = () => {
        setEditingGallery(null)
        setForm(createInitialForm())
        setPhotos([])
        setSlugTouched(false)
        setIsModalOpen(true)
    }

    const openEditModal = (gallery: EventGallery) => {
        setEditingGallery(gallery)
        setForm({
            title: gallery.title,
            slug: gallery.slug,
            eventDate: toInputDate(gallery.eventDate),
            shortDescription: gallery.shortDescription || '',
            description: gallery.description || '',
            coverImageUrl: gallery.coverImageUrl || '',
            ctaText: gallery.ctaText || 'Quero fazer meu evento no Aysú',
            ctaHref: gallery.ctaHref || '/eventos',
            isActive: gallery.isActive,
        })
        setPhotos(
            (gallery.images || []).map((image, index) => ({
                id: image.id,
                imageUrl: image.imageUrl,
                caption: image.caption || '',
                displayOrder: image.displayOrder ?? index,
            }))
        )
        setSlugTouched(true)
        setIsModalOpen(true)
    }

    const handleTitleChange = (value: string) => {
        setForm((prev) => {
            const nextSlug = slugTouched ? prev.slug : normalizeSlug(value)
            return {
                ...prev,
                title: value,
                slug: nextSlug,
            }
        })
    }

    const uploadFileToFolder = async (
        file: File,
        setStep?: (step: 'optimizing' | 'uploading') => void
    ): Promise<string> => {
        const validationError = validateImageUpload(file)
        if (validationError) {
            throw new Error(validationError)
        }

        const largeImageWarning = getLargeImageWarning(file)
        if (largeImageWarning) {
            toast(largeImageWarning)
        }

        if (setStep) setStep('optimizing')
        const optimizedFile = await optimizeImageBeforeUpload(file)
        const payloadError = getUploadPayloadError(optimizedFile)
        if (payloadError) {
            throw new Error(payloadError)
        }

        const formData = new FormData()
        formData.append('file', optimizedFile)
        formData.append('folder', currentFolder)

        if (setStep) setStep('uploading')
        const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        })

        const uploadData = await readUploadApiResponse(uploadRes)
        const imageUrl = uploadData.data?.url

        if (!uploadRes.ok || !uploadData.success || typeof imageUrl !== 'string' || !imageUrl) {
            throw new Error(uploadData.error || 'Erro ao enviar imagem')
        }

        return imageUrl
    }

    const handleCoverUpload = async (fileList: FileList | null) => {
        const file = fileList?.[0]
        if (!file) return

        setUploadingCover(true)

        try {
            const imageUrl = await uploadFileToFolder(file, setCoverUploadStep)
            setForm((prev) => ({ ...prev, coverImageUrl: imageUrl }))
            toast.success('Imagem de destaque enviada')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro no upload da capa')
        } finally {
            setUploadingCover(false)
            setCoverUploadStep('idle')
            if (coverInputRef.current) {
                coverInputRef.current.value = ''
            }
        }
    }

    const handlePhotosUpload = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return

        setUploadingPhotos(true)
        setPhotosUploadStep('optimizing')

        try {
            const files = Array.from(fileList)
            const uploadedPhotos = await Promise.all(
                files.map(async (file, index): Promise<GalleryPhoto> => {
                    const imageUrl = await uploadFileToFolder(file, setPhotosUploadStep)
                    return {
                        imageUrl,
                        caption: '',
                        displayOrder: photos.length + index,
                    }
                })
            )

            setPhotos((prev) => [
                ...prev,
                ...uploadedPhotos,
            ].map((image, index) => ({ ...image, displayOrder: index })))

            if (!form.coverImageUrl && uploadedPhotos[0]) {
                setForm((prev) => ({ ...prev, coverImageUrl: uploadedPhotos[0].imageUrl }))
            }

            toast.success(`${uploadedPhotos.length} foto(s) adicionada(s)`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao enviar fotos')
        } finally {
            setUploadingPhotos(false)
            setPhotosUploadStep('idle')
            if (photosInputRef.current) {
                photosInputRef.current.value = ''
            }
        }
    }

    const addPhotoFromR2 = (imageUrl: string) => {
        setPhotos((prev) => (
            [
                ...prev,
                {
                    imageUrl,
                    caption: '',
                    displayOrder: prev.length,
                },
            ].map((image, displayOrder) => ({ ...image, displayOrder }))
        ))

        if (!form.coverImageUrl) {
            setForm((prev) => ({ ...prev, coverImageUrl: imageUrl }))
        }

        toast.success('Foto adicionada do R2')
    }

    const handleCoverDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        if (uploadingCover) return
        setCoverDragOver(true)
    }

    const handleCoverDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setCoverDragOver(false)
    }

    const handleCoverDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setCoverDragOver(false)
        if (uploadingCover) return
        await handleCoverUpload(event.dataTransfer.files)
    }

    const handlePhotosDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        if (uploadingPhotos) return
        setPhotosDragOver(true)
    }

    const handlePhotosDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setPhotosDragOver(false)
    }

    const handlePhotosDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setPhotosDragOver(false)
        if (uploadingPhotos) return
        await handlePhotosUpload(event.dataTransfer.files)
    }

    const removePhoto = (index: number) => {
        setPhotos((prev) => prev
            .filter((_, currentIndex) => currentIndex !== index)
            .map((image, displayOrder) => ({ ...image, displayOrder })))
    }

    const setPhotoCaption = (index: number, caption: string) => {
        setPhotos((prev) => prev.map((image, currentIndex) => (
            currentIndex === index
                ? { ...image, caption }
                : image
        )))
    }

    const handleSave = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!form.title.trim()) {
            toast.error('Título é obrigatório')
            return
        }

        const normalizedSlug = normalizeSlug(form.slug || form.title)
        if (!normalizedSlug) {
            toast.error('Slug inválido')
            return
        }

        setSaving(true)

        const payload = {
            title: form.title.trim(),
            slug: normalizedSlug,
            eventDate: form.eventDate || undefined,
            shortDescription: form.shortDescription.trim(),
            description: form.description.trim(),
            coverImageUrl: form.coverImageUrl.trim(),
            ctaText: form.ctaText.trim(),
            ctaHref: form.ctaHref.trim(),
            isActive: form.isActive,
            images: photos.map((image, index) => ({
                imageUrl: image.imageUrl,
                caption: image.caption?.trim() || '',
                displayOrder: index,
            })),
        }

        try {
            const isEditing = Boolean(editingGallery)
            const endpoint = isEditing
                ? `/api/admin/event-galleries/${editingGallery!.id}`
                : '/api/admin/event-galleries'
            const method = isEditing ? 'PATCH' : 'POST'

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!data.success) {
                throw new Error(data.error || 'Erro ao salvar galeria')
            }

            toast.success(isEditing ? 'Galeria atualizada' : 'Galeria criada')
            setIsModalOpen(false)
            fetchGalleries()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar galeria')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (gallery: EventGallery) => {
        if (!confirm(`Remover a galeria "${gallery.title}"?`)) return

        try {
            const res = await fetch(`/api/admin/event-galleries/${gallery.id}`, {
                method: 'DELETE',
            })
            const data = await res.json()

            if (!data.success) {
                throw new Error(data.error || 'Erro ao remover galeria')
            }

            toast.success('Galeria removida')
            fetchGalleries()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao remover')
        }
    }

    return (
        <AdminLayout>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Galeria de Eventos</h1>
                    <p className="text-[#8a5c3f]">
                        Portfólio de eventos realizados. Upload automático para <strong>{currentFolder}</strong>
                    </p>
                </div>
                <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4" />
                    Nova Galeria
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-[#d4a574]" />
                </div>
            ) : galleries.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Images className="h-12 w-12 text-[#d4a574] mx-auto mb-4" />
                        <p className="text-[#2a2a2a] font-medium mb-2">Nenhuma galeria cadastrada</p>
                        <p className="text-[#8a5c3f] mb-6">
                            Crie portfólios com flyer de destaque e álbum completo para atrair novos eventos.
                        </p>
                        <Button onClick={openCreateModal}>
                            <WandSparkles className="h-4 w-4" />
                            Criar primeira galeria
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {galleries.map((gallery) => (
                        <Card key={gallery.id} className="overflow-hidden">
                            <CardContent className="p-0">
                                <div className="relative aspect-[4/5] bg-[#f5f0e8]">
                                    {gallery.coverImageUrl ? (
                                        <Image
                                            src={gallery.coverImageUrl}
                                            alt={gallery.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-[#8a5c3f]">
                                            <Images className="h-10 w-10" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <Badge variant={gallery.isActive ? 'success' : 'outline'}>
                                            {gallery.isActive ? 'Publicado' : 'Rascunho'}
                                        </Badge>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <Badge variant="secondary">{gallery._count?.images ?? gallery.images.length} fotos</Badge>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div>
                                        <h3 className="font-serif text-xl text-[#2a2a2a] font-bold">{gallery.title}</h3>
                                        <p className="text-sm text-[#8a5c3f] flex items-center gap-1.5 mt-1">
                                            <CalendarDays className="h-4 w-4" />
                                            {formatDateLabel(gallery.eventDate)}
                                        </p>
                                    </div>
                                    <p className="text-sm text-[#8a5c3f] line-clamp-2">
                                        {gallery.shortDescription || gallery.description || 'Sem descrição'}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="secondary" className="flex-1" onClick={() => openEditModal(gallery)}>
                                            <Pencil className="h-4 w-4" />
                                            Editar
                                        </Button>
                                        <Link href={`/galeria-eventos/${gallery.slug}`} target="_blank" className="flex-1">
                                            <Button size="sm" variant="outline" className="w-full">
                                                <Eye className="h-4 w-4" />
                                                Ver página
                                            </Button>
                                        </Link>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(gallery)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
                <ModalContent className="max-w-6xl w-[95vw] max-h-[92vh] overflow-y-auto">
                    <ModalHeader>
                        <ModalTitle>{editingGallery ? 'Editar Galeria de Evento' : 'Nova Galeria de Evento'}</ModalTitle>
                    </ModalHeader>

                    <form onSubmit={handleSave} className="grid lg:grid-cols-2 gap-6 p-2">
                        <div className="space-y-4">
                            <Input
                                label="Título da galeria"
                                value={form.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="Ex: Sunset Bassline - Março 2026"
                                required
                            />

                            <Input
                                label="Slug"
                                value={form.slug}
                                onChange={(e) => {
                                    setSlugTouched(true)
                                    setForm((prev) => ({ ...prev, slug: normalizeSlug(e.target.value) }))
                                }}
                                placeholder="sunset-bassline-marco-2026"
                                required
                            />

                            <Input
                                label="Data do evento"
                                type="date"
                                value={form.eventDate}
                                onChange={(e) => setForm((prev) => ({ ...prev, eventDate: e.target.value }))}
                            />

                            <Textarea
                                label="Resumo curto"
                                value={form.shortDescription}
                                onChange={(e) => setForm((prev) => ({ ...prev, shortDescription: e.target.value }))}
                                placeholder="Texto curto para o card da galeria"
                                rows={3}
                            />

                            <Textarea
                                label="Descrição completa"
                                value={form.description}
                                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="Conte como foi o evento e o clima da experiência"
                                rows={5}
                            />

                            <div className="grid sm:grid-cols-2 gap-4">
                                <Input
                                    label="Texto do CTA"
                                    value={form.ctaText}
                                    onChange={(e) => setForm((prev) => ({ ...prev, ctaText: e.target.value }))}
                                    placeholder="Quero fazer meu evento no Aysú"
                                />
                                <Input
                                    label="Link do CTA"
                                    value={form.ctaHref}
                                    onChange={(e) => setForm((prev) => ({ ...prev, ctaHref: e.target.value }))}
                                    placeholder="/eventos"
                                />
                            </div>

                            <label className="flex items-center gap-2 text-sm text-[#2a2a2a]">
                                <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                                    className="rounded border-[#d4a574] text-[#d4a574]"
                                />
                                Publicar esta galeria no site
                            </label>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-[#2a2a2a]">Imagem de destaque</p>
                                    <input
                                        ref={coverInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="gallery-cover-upload"
                                        onChange={(e) => handleCoverUpload(e.target.files)}
                                    />
                                    <label htmlFor="gallery-cover-upload">
                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-[#d4a574] text-[#8a5c3f] cursor-pointer hover:bg-[#f5f0e8] transition-colors">
                                            {uploadingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                                            Upload capa
                                        </span>
                                    </label>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="h-8 px-3 text-xs"
                                        onClick={() => setShowCoverPicker(true)}
                                    >
                                        <FolderOpen className="h-3.5 w-3.5" />
                                        Selecionar do R2
                                    </Button>
                                </div>
                                <div
                                    onDragOver={handleCoverDragOver}
                                    onDragLeave={handleCoverDragLeave}
                                    onDrop={handleCoverDrop}
                                    className={`relative aspect-[4/5] rounded-xl border overflow-hidden transition-colors ${
                                        coverDragOver
                                            ? 'border-[#d4a574] bg-[#f9efe5]'
                                            : 'border-[#e0d5c7] bg-[#f5f0e8]'
                                    }`}
                                >
                                    {form.coverImageUrl ? (
                                        <Image
                                            src={form.coverImageUrl}
                                            alt="Capa da galeria"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8a5c3f]">
                                            <Images className="h-9 w-9 mb-2" />
                                            <span className="text-sm">Sem capa definida</span>
                                        </div>
                                    )}
                                    {uploadingCover && (
                                        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center">
                                            <div className="flex items-center gap-2 text-white text-sm font-medium">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {coverUploadStep === 'optimizing'
                                                    ? 'Otimizando capa...'
                                                    : 'Enviando capa otimizada...'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-[#8a5c3f] mt-2">
                                    Arraste e solte uma imagem aqui ou use o botão de upload.
                                </p>
                            </div>

                            <div
                                onDragOver={handlePhotosDragOver}
                                onDragLeave={handlePhotosDragLeave}
                                onDrop={handlePhotosDrop}
                                className={`rounded-xl border p-4 transition-colors ${
                                    photosDragOver
                                        ? 'border-[#d4a574] bg-[#f9efe5]'
                                        : 'border-[#e0d5c7] bg-[#fdfbf8]'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-medium text-[#2a2a2a]">Fotos da galeria</p>
                                    <input
                                        ref={photosInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        id="gallery-photos-upload"
                                        onChange={(e) => handlePhotosUpload(e.target.files)}
                                    />
                                    <label htmlFor="gallery-photos-upload">
                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-[#2a2a2a] text-white cursor-pointer hover:bg-[#1a1a1a] transition-colors">
                                            {uploadingPhotos ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                                            Adicionar fotos
                                        </span>
                                    </label>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="h-8 px-3 text-xs"
                                        onClick={() => setShowPhotosPicker(true)}
                                    >
                                        <FolderOpen className="h-3.5 w-3.5" />
                                        Selecionar do R2
                                    </Button>
                                </div>

                                <p className="text-xs text-[#8a5c3f] mb-3">
                                    As fotos serão enviadas para <strong>{currentFolder}</strong>
                                </p>
                                {uploadingPhotos ? (
                                    <div className="flex items-center gap-2 text-xs text-[#8a5c3f] mb-3">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        {photosUploadStep === 'optimizing'
                                            ? 'Otimizando fotos...'
                                            : 'Enviando fotos otimizadas...'}
                                    </div>
                                ) : (
                                    <p className="text-xs text-[#8a5c3f] mb-3">
                                        Arraste e solte uma ou várias imagens nesta área.
                                    </p>
                                )}

                                {photos.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-[#d4a574] p-6 text-center text-sm text-[#8a5c3f]">
                                        Nenhuma foto adicionada ainda.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                                        {photos.map((photo, index) => (
                                            <div key={`${photo.imageUrl}-${index}`} className="rounded-lg border border-[#e0d5c7] bg-white overflow-hidden">
                                                <div className="relative aspect-[3/4]">
                                                    <Image
                                                        src={photo.imageUrl}
                                                        alt={`Foto ${index + 1}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removePhoto(index)}
                                                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center"
                                                        title="Remover foto"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm((prev) => ({ ...prev, coverImageUrl: photo.imageUrl }))}
                                                        className="absolute bottom-2 right-2 rounded-full bg-white/90 text-[#2a2a2a] text-[11px] px-2 py-1"
                                                    >
                                                        Usar como capa
                                                    </button>
                                                </div>
                                                <div className="p-2">
                                                    <input
                                                        value={photo.caption || ''}
                                                        onChange={(e) => setPhotoCaption(index, e.target.value)}
                                                        placeholder="Legenda (opcional)"
                                                        className="w-full text-xs px-2 py-1.5 rounded border border-[#e0d5c7]"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <ModalFooter className="lg:col-span-2 pt-4 border-t border-[#e0d5c7]">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" isLoading={saving}>
                                {editingGallery ? 'Salvar alterações' : 'Criar galeria'}
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>

            <MediaPicker
                open={showCoverPicker}
                onClose={() => setShowCoverPicker(false)}
                onSelect={(url) => {
                    setForm((prev) => ({ ...prev, coverImageUrl: url }))
                    toast.success('Capa selecionada do R2')
                }}
                defaultFolder={currentFolder}
                initialMode="browse"
            />

            <MediaPicker
                open={showPhotosPicker}
                onClose={() => setShowPhotosPicker(false)}
                onSelect={addPhotoFromR2}
                defaultFolder={currentFolder}
                initialMode="browse"
            />
        </AdminLayout>
    )
}
