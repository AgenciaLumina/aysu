'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { CalendarClock, Clock, ImageIcon, Music, Pencil, Plus, Ticket, Trash2, Upload, X } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import {
    getLargeImageWarning,
    getUploadPayloadError,
    optimizeImageBeforeUpload,
    readUploadApiResponse,
    validateImageUpload,
} from '@/lib/upload-client'
import { formatCurrency, generateSlug } from '@/lib/utils'
import toast from 'react-hot-toast'

interface EventItem {
    id: string
    title: string
    slug: string
    description: string | null
    fullDescription: string | null
    eventType: string
    startDate: string
    endDate: string | null
    posterImageUrl: string | null
    bannerImageUrl: string | null
    djName: string | null
    bands: string[] | null
    ticketPrice: number | null
    isActive: boolean
    isFeatured: boolean
}

const EVENT_TYPES = [
    { value: 'DJ_NIGHT', label: 'DJ Night' },
    { value: 'LIVE_MUSIC', label: 'Música ao Vivo' },
    { value: 'THEMED_PARTY', label: 'Festa Temática' },
    { value: 'WEDDING', label: 'Casamento' },
    { value: 'CORPORATE', label: 'Corporativo' },
    { value: 'OTHER', label: 'Outro' },
]

interface EventForm {
    title: string
    slug: string
    description: string
    fullDescription: string
    eventType: string
    startDate: string
    endDate: string
    posterImageUrl: string
    djName: string
    bandsText: string
    ticketPrice: string
    isFeatured: boolean
    isActive: boolean
}

function toInputDateTime(isoDate: string) {
    const date = new Date(isoDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
}

function toLocalISODate(value: string) {
    const date = new Date(value)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function createDefaultForm(): EventForm {
    return {
        title: '',
        slug: '',
        description: '',
        fullDescription: '',
        eventType: 'DJ_NIGHT',
        startDate: '',
        endDate: '',
        posterImageUrl: '',
        djName: '',
        bandsText: '',
        ticketPrice: '',
        isFeatured: false,
        isActive: true,
    }
}

export default function AdminEventsPage() {
    const [events, setEvents] = useState<EventItem[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadingFlyer, setUploadingFlyer] = useState(false)
    const [flyerUploadStep, setFlyerUploadStep] = useState<'idle' | 'optimizing' | 'uploading'>('idle')
    const [flyerDragOver, setFlyerDragOver] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)
    const [form, setForm] = useState<EventForm>(createDefaultForm)
    const flyerInputRef = useRef<HTMLInputElement>(null)

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/events?limit=100', { credentials: 'include' })
            const data = await res.json()

            if (!data.success) {
                throw new Error(data.error || 'Erro ao buscar eventos')
            }

            setEvents(data.data)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Erro ao carregar programação')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEvents()
    }, [])

    const openCreateModal = () => {
        setEditingEvent(null)
        setForm(createDefaultForm())
        setIsModalOpen(true)
    }

    const openEditModal = (event: EventItem) => {
        setEditingEvent(event)
        setForm({
            title: event.title,
            slug: event.slug,
            description: event.description || '',
            fullDescription: event.fullDescription || '',
            eventType: event.eventType,
            startDate: toInputDateTime(event.startDate),
            endDate: event.endDate ? toInputDateTime(event.endDate) : '',
            posterImageUrl: event.posterImageUrl || '',
            djName: event.djName || '',
            bandsText: event.bands?.join(', ') || '',
            ticketPrice: event.ticketPrice?.toString() || '',
            isFeatured: event.isFeatured,
            isActive: event.isActive,
        })
        setIsModalOpen(true)
    }

    const uploadFlyerFile = async (file: File) => {
        const validationError = validateImageUpload(file)
        if (validationError) {
            toast.error(validationError)
            return
        }

        const largeImageWarning = getLargeImageWarning(file)
        if (largeImageWarning) {
            toast(largeImageWarning)
        }

        setUploadingFlyer(true)
        setFlyerUploadStep('optimizing')

        try {
            const optimizedFile = await optimizeImageBeforeUpload(file)
            const payloadError = getUploadPayloadError(optimizedFile)
            if (payloadError) {
                throw new Error(payloadError)
            }

            const formData = new FormData()
            formData.append('file', optimizedFile)
            formData.append('folder', 'events')

            setFlyerUploadStep('uploading')
            const res = await fetch('/api/upload', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            })
            const data = await readUploadApiResponse(res)
            const uploadedUrl = data.data?.url

            if (!res.ok || !data.success || typeof uploadedUrl !== 'string' || !uploadedUrl) {
                throw new Error(data.error || 'Erro ao enviar flyer')
            }

            setForm((prev) => ({ ...prev, posterImageUrl: uploadedUrl }))
            toast.success('Flyer enviado!')
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Erro ao enviar flyer')
        } finally {
            setUploadingFlyer(false)
            setFlyerUploadStep('idle')
        }
    }

    const handleFlyerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            await uploadFlyerFile(file)
        } finally {
            e.target.value = ''
        }
    }

    const handleFlyerDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        if (uploadingFlyer) return
        setFlyerDragOver(true)
    }

    const handleFlyerDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setFlyerDragOver(false)
    }

    const handleFlyerDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setFlyerDragOver(false)

        if (uploadingFlyer) return

        const file = e.dataTransfer.files?.[0]
        if (!file) return

        await uploadFlyerFile(file)
    }

    const handleDelete = async (event: EventItem) => {
        if (!confirm(`Excluir evento "${event.title}"?`)) return

        try {
            const res = await fetch(`/api/events/${event.slug}`, {
                method: 'DELETE',
                credentials: 'include',
            })
            const data = await res.json()

            if (!data.success) {
                throw new Error(data.error || 'Erro ao excluir')
            }

            toast.success('Evento removido')
            fetchEvents()
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Erro ao excluir evento')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.startDate) {
            toast.error('Data/hora do evento é obrigatória')
            return
        }

        const startDate = new Date(form.startDate)
        if (Number.isNaN(startDate.getTime())) {
            toast.error('Data/hora inicial inválida')
            return
        }

        const endDate = form.endDate ? new Date(form.endDate) : null
        if (endDate && Number.isNaN(endDate.getTime())) {
            toast.error('Data/hora final inválida')
            return
        }

        const ticketPrice = form.ticketPrice.trim() ? Number(form.ticketPrice) : null
        if (ticketPrice !== null && (!Number.isFinite(ticketPrice) || ticketPrice < 0)) {
            toast.error('Valor do ingresso inválido')
            return
        }

        const payload = {
            title: form.title,
            slug: form.slug,
            description: form.description,
            fullDescription: form.fullDescription,
            eventType: form.eventType,
            startDate: startDate.toISOString(),
            endDate: endDate ? endDate.toISOString() : undefined,
            posterImageUrl: form.posterImageUrl || undefined,
            djName: form.djName || undefined,
            bands: form.bandsText
                .split(',')
                .map(item => item.trim())
                .filter(Boolean),
            ticketPrice: ticketPrice ?? undefined,
            isFeatured: form.isFeatured,
            isActive: form.isActive,
        }

        setSaving(true)

        try {
            const url = editingEvent ? `/api/events/${editingEvent.slug}` : '/api/events'
            const method = editingEvent ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()
            if (!data.success) {
                throw new Error(data.error || 'Erro ao salvar evento')
            }

            toast.success(editingEvent ? 'Evento atualizado' : 'Evento criado')
            setIsModalOpen(false)
            fetchEvents()
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar evento')
        } finally {
            setSaving(false)
        }
    }

    const typeLabel = (type: string) => EVENT_TYPES.find(item => item.value === type)?.label || type

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Programação de Eventos</h1>
                    <p className="text-[#8a5c3f]">Cadastre release, flyer, atrações e linha de programação da casa.</p>
                </div>
                <Button onClick={openCreateModal}>
                    <Plus className="h-4 w-4" />
                    Novo Evento
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : events.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Music className="h-12 w-12 text-[#e0d5c7] mx-auto mb-4" />
                        <p className="text-[#8a5c3f] mb-4">Nenhum evento cadastrado.</p>
                        <Button onClick={openCreateModal}>
                            <Plus className="h-4 w-4" />
                            Criar primeiro evento
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                    {events.map(event => (
                        <Card key={event.id} className={!event.isActive ? 'opacity-70' : ''}>
                            <CardContent className="p-5 space-y-4">
                                {event.posterImageUrl && (
                                    <div className="w-full max-w-[180px] aspect-[4/5] rounded-xl border border-[#e0d5c7] bg-[#f5f0eb] overflow-hidden">
                                        <div
                                            className="h-full w-full bg-contain bg-top bg-no-repeat"
                                            style={{ backgroundImage: `url(${event.posterImageUrl})` }}
                                        />
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary">{typeLabel(event.eventType)}</Badge>
                                    {event.isFeatured && <Badge variant="info">Destaque</Badge>}
                                    {!event.isActive && <Badge variant="warning">Inativo</Badge>}
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold text-[#2a2a2a]">{event.title}</h3>
                                    {event.description && (
                                        <p className="text-sm text-[#8a5c3f] mt-1 line-clamp-3">{event.description}</p>
                                    )}
                                </div>

                                <div className="grid sm:grid-cols-2 gap-3 text-sm text-[#8a5c3f]">
                                    <p className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4" />{new Date(event.startDate).toLocaleDateString('pt-BR')}</p>
                                    <p className="inline-flex items-center gap-2"><Clock className="h-4 w-4" />{new Date(event.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                    {event.djName && <p className="inline-flex items-center gap-2"><Music className="h-4 w-4" />{event.djName}</p>}
                                    {event.ticketPrice !== null && (
                                        <p className="inline-flex items-center gap-2"><Ticket className="h-4 w-4" />{formatCurrency(Number(event.ticketPrice))}</p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    <Button variant="secondary" size="sm" onClick={() => openEditModal(event)}>
                                        <Pencil className="h-4 w-4" />
                                        Editar evento
                                    </Button>

                                    <Link
                                        href={`/admin/calendario?date=${encodeURIComponent(toLocalISODate(event.startDate))}&title=${encodeURIComponent(event.title)}&release=${encodeURIComponent(event.description || '')}&flyer=${encodeURIComponent(event.posterImageUrl || '')}`}
                                    >
                                        <Button size="sm">
                                            <CalendarClock className="h-4 w-4" />
                                            Abrir no calendário comercial
                                        </Button>
                                    </Link>

                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(event)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
                <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <ModalHeader>
                        <ModalTitle>{editingEvent ? 'Editar evento' : 'Novo evento'}</ModalTitle>
                    </ModalHeader>

                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input
                                label="Título"
                                value={form.title}
                                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value, slug: generateSlug(e.target.value) }))}
                                required
                            />
                            <Input
                                label="Slug"
                                value={form.slug}
                                onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[#2a2a2a] mb-1.5">Tipo</label>
                                <select
                                    value={form.eventType}
                                    onChange={(e) => setForm(prev => ({ ...prev, eventType: e.target.value }))}
                                    className="w-full h-11 px-4 rounded-lg border border-[#e0d5c7] text-sm focus:ring-2 focus:ring-[#d4a574]"
                                >
                                    {EVENT_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                            <Input
                                label="Início"
                                type="datetime-local"
                                value={form.startDate}
                                onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                                required
                            />
                            <Input
                                label="Fim (opcional)"
                                type="datetime-local"
                                value={form.endDate}
                                onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                        </div>

                        <Textarea
                            label="Release curto"
                            value={form.description}
                            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            placeholder="Texto principal para exibir no site/calendário"
                        />

                        <Textarea
                            label="Release completo"
                            value={form.fullDescription}
                            onChange={(e) => setForm(prev => ({ ...prev, fullDescription: e.target.value }))}
                            rows={4}
                            placeholder="Detalhes completos do evento"
                        />

                        <div className="space-y-3">
                            <Input
                                label="Flyer (poster URL)"
                                value={form.posterImageUrl}
                                onChange={(e) => setForm(prev => ({ ...prev, posterImageUrl: e.target.value }))}
                                placeholder="https://... ou /events/arquivo.avif"
                            />
                            <input
                                ref={flyerInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFlyerUpload}
                                disabled={uploadingFlyer}
                            />
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => flyerInputRef.current?.click()}
                                    isLoading={uploadingFlyer}
                                >
                                    <Upload className="h-4 w-4" />
                                    {form.posterImageUrl ? 'Trocar flyer' : 'Enviar flyer'}
                                </Button>
                                {form.posterImageUrl && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setForm(prev => ({ ...prev, posterImageUrl: '' }))}
                                    >
                                        <X className="h-4 w-4" />
                                        Remover
                                    </Button>
                                )}
                            </div>
                            <div
                                onDragOver={handleFlyerDragOver}
                                onDragLeave={handleFlyerDragLeave}
                                onDrop={handleFlyerDrop}
                                className={`rounded-lg border-2 border-dashed p-3 transition-colors ${
                                    flyerDragOver
                                        ? 'border-[#d4a574] bg-[#f9efe5]'
                                        : 'border-[#e0d5c7] bg-[#f5f0eb]/40'
                                }`}
                            >
                                {uploadingFlyer ? (
                                    <div className="flex items-center gap-2 text-sm text-[#8a5c3f]">
                                        <Spinner size="sm" />
                                        <span>
                                            {flyerUploadStep === 'optimizing'
                                                ? 'Otimizando imagem...'
                                                : 'Enviando imagem otimizada...'}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="text-xs text-[#8a5c3f]">
                                        Arraste e solte uma imagem aqui para upload rápido.
                                    </p>
                                )}
                            </div>
                            <p className="text-xs text-[#8a5c3f]/70">
                                Use flyer em retrato para melhor exibição na home e no popup.
                            </p>
                        </div>

                        <div className="w-full max-w-[220px] aspect-[4/5] rounded-xl border border-[#e0d5c7] bg-[#f5f0eb] overflow-hidden">
                            {form.posterImageUrl ? (
                                <div
                                    className="h-full w-full bg-contain bg-top bg-no-repeat"
                                    style={{ backgroundImage: `url(${form.posterImageUrl})` }}
                                />
                            ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center text-[#8a5c3f]">
                                    <ImageIcon className="h-8 w-8 mb-2 opacity-60" />
                                    <p className="text-xs">Nenhum flyer enviado</p>
                                </div>
                            )}
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <Input
                                label="Atração principal (DJ/Artista)"
                                value={form.djName}
                                onChange={(e) => setForm(prev => ({ ...prev, djName: e.target.value }))}
                                placeholder="Ex: DJ X"
                            />
                            <Input
                                label="Atrações adicionais"
                                value={form.bandsText}
                                onChange={(e) => setForm(prev => ({ ...prev, bandsText: e.target.value }))}
                                placeholder="Ex: DJ A, DJ B, Banda C"
                            />
                            <Input
                                label="Valor ingresso/couvert"
                                type="number"
                                value={form.ticketPrice}
                                onChange={(e) => setForm(prev => ({ ...prev, ticketPrice: e.target.value }))}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.isFeatured}
                                    onChange={(e) => setForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                                />
                                Destacar no site
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                                />
                                Evento ativo
                            </label>
                        </div>

                        <ModalFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" isLoading={saving}>
                                {editingEvent ? 'Salvar alterações' : 'Criar evento'}
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </AdminLayout>
    )
}
