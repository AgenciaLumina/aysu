// AISSU Beach Lounge - Admin Eventos (Refatorado)
'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Calendar, Clock, Music } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate, formatTime, generateSlug } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Event {
    id: string
    title: string
    slug: string
    description: string
    eventType: string
    startDate: string
    djName?: string
    isActive: boolean
    isFeatured: boolean
}

const eventTypes = [
    { value: 'DJ_NIGHT', label: 'DJ Night' },
    { value: 'LIVE_MUSIC', label: 'Música ao Vivo' },
    { value: 'THEMED_PARTY', label: 'Festa Temática' },
    { value: 'WEDDING', label: 'Casamento' },
    { value: 'CORPORATE', label: 'Corporativo' },
    { value: 'OTHER', label: 'Outro' },
]

export default function AdminEventsPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        description: '',
        eventType: 'DJ_NIGHT',
        startDate: '',
        djName: '',
        isFeatured: false,
    })

    useEffect(() => { fetchEvents() }, [])

    async function fetchEvents() {
        try {
            const res = await fetch('/api/events')
            const data = await res.json()
            if (data.success) setEvents(data.data)
        } catch (error) {
            toast.error('Erro ao carregar eventos')
        } finally {
            setLoading(false)
        }
    }

    const openModal = (event?: Event) => {
        if (event) {
            setEditingEvent(event)
            setFormData({
                title: event.title,
                slug: event.slug,
                description: event.description || '',
                eventType: event.eventType,
                startDate: event.startDate.slice(0, 16),
                djName: event.djName || '',
                isFeatured: event.isFeatured,
            })
        } else {
            setEditingEvent(null)
            setFormData({
                title: '',
                slug: '',
                description: '',
                eventType: 'DJ_NIGHT',
                startDate: '',
                djName: '',
                isFeatured: false,
            })
        }
        setIsModalOpen(true)
    }

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value
        setFormData(p => ({ ...p, title, slug: generateSlug(title) }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const payload = {
            title: formData.title,
            slug: formData.slug,
            description: formData.description,
            eventType: formData.eventType,
            startDate: formData.startDate,
            djName: formData.djName || null,
            isFeatured: formData.isFeatured,
        }

        try {
            const url = editingEvent ? `/api/events/${editingEvent.slug}` : '/api/events'
            const method = editingEvent ? 'PATCH' : 'POST'

            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            const data = await res.json()

            if (data.success) {
                toast.success(editingEvent ? 'Evento atualizado!' : 'Evento criado!')
                setIsModalOpen(false)
                fetchEvents()
            } else {
                toast.error(data.error || 'Erro ao salvar')
            }
        } catch {
            toast.error('Erro ao salvar evento')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (event: Event) => {
        if (!confirm(`Excluir "${event.title}"?`)) return
        const res = await fetch(`/api/events/${event.slug}`, { method: 'DELETE' })
        if (res.ok) { toast.success('Excluído'); fetchEvents() }
    }

    const typeLabel = (t: string) => eventTypes.find(e => e.value === t)?.label || t

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Eventos</h1>
                    <p className="text-[#8a5c3f]">Gerencie a programação do beach club</p>
                </div>
                <Button onClick={() => openModal()}>
                    <Plus className="h-4 w-4" />
                    Novo Evento
                </Button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : events.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Music className="h-12 w-12 text-[#e0d5c7] mx-auto mb-4" />
                        <p className="text-[#8a5c3f] mb-4">Nenhum evento</p>
                        <Button onClick={() => openModal()}><Plus className="h-4 w-4" /> Criar Evento</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <Card key={event.id}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <Badge variant="secondary">{typeLabel(event.eventType)}</Badge>
                                    {event.isFeatured && <Badge>⭐ Destaque</Badge>}
                                </div>
                                <h3 className="font-serif text-lg font-bold text-[#2a2a2a] mb-2">{event.title}</h3>
                                <p className="text-sm text-[#8a5c3f] line-clamp-2 mb-3">{event.description}</p>

                                <div className="space-y-1 text-sm text-[#8a5c3f] mb-4">
                                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />{formatDate(event.startDate)}</div>
                                    <div className="flex items-center gap-2"><Clock className="h-4 w-4" />{formatTime(event.startDate)}</div>
                                    {event.djName && <div className="flex items-center gap-2"><Music className="h-4 w-4" />{event.djName}</div>}
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => openModal(event)}>
                                        <Pencil className="h-4 w-4" /> Editar
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(event)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
                <ModalContent>
                    <ModalHeader><ModalTitle>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</ModalTitle></ModalHeader>
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        <Input label="Título" value={formData.title} onChange={handleTitleChange} required />
                        <Input label="Slug" value={formData.slug} onChange={(e) => setFormData(p => ({ ...p, slug: e.target.value }))} required />
                        <div>
                            <label className="block text-sm font-medium text-[#2a2a2a] mb-1.5">Descrição</label>
                            <textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                className="w-full px-4 py-2 rounded-lg border border-[#e0d5c7] text-sm focus:ring-2 focus:ring-[#d4a574]" rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[#2a2a2a] mb-1.5">Tipo</label>
                                <select value={formData.eventType} onChange={(e) => setFormData(p => ({ ...p, eventType: e.target.value }))}
                                    className="w-full h-11 px-4 rounded-lg border border-[#e0d5c7] text-sm focus:ring-2 focus:ring-[#d4a574]">
                                    {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <Input label="Data/Hora" type="datetime-local" value={formData.startDate} onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))} required />
                        </div>
                        <Input label="DJ/Artista" value={formData.djName} onChange={(e) => setFormData(p => ({ ...p, djName: e.target.value }))} />
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData(p => ({ ...p, isFeatured: e.target.checked }))} className="rounded" />
                            <span className="text-sm">Destacar este evento</span>
                        </label>
                        <ModalFooter className="pt-4">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" isLoading={saving}>{editingEvent ? 'Salvar' : 'Criar'}</Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </AdminLayout>
    )
}
