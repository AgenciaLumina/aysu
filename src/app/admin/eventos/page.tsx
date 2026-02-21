// AISSU Beach Lounge - Admin Eventos (Refatorado com Lotes e Release)
'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Calendar, Clock, Music, Image as ImageIcon, DollarSign } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { formatDateUTC, formatTime, generateSlug } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Event {
    id: string
    title: string
    slug: string
    description: string
    fullDescription?: string
    bannerImageUrl?: string
    eventType: string
    startDate: string
    djName?: string
    isActive: boolean
    isFeatured: boolean
    spacePricesOverrides?: any
}

const eventTypes = [
    { value: 'DJ_NIGHT', label: 'DJ Night' },
    { value: 'LIVE_MUSIC', label: 'Música ao Vivo' },
    { value: 'THEMED_PARTY', label: 'Festa Temática' },
    { value: 'WEDDING', label: 'Casamento' },
    { value: 'CORPORATE', label: 'Corporativo' },
    { value: 'OTHER', label: 'Outro' },
]

// Lista de espaços para overrrides (Lotes)
const spaceOverridesList = [
    { id: 'bangalo-lateral', label: 'Bangalô Lateral' },
    { id: 'bangalo-piscina', label: 'Bangalô Piscina' },
    { id: 'bangalo-frente-mar', label: 'Bangalô Frente Mar' },
    { id: 'bangalo-central', label: 'Bangalô Central' },
    { id: 'sunbed-casal', label: 'Sunbed Casal' },
    { id: 'day-use-praia', label: 'Day Use Praia' },
    { id: 'mesa-praia', label: 'Mesa de Praia' },
    { id: 'mesa-restaurante', label: 'Mesa de Restaurante' },
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
        fullDescription: '',
        bannerImageUrl: '',
        eventType: 'DJ_NIGHT',
        startDate: '',
        djName: '',
        isFeatured: false,
    })

    // Estado separado para overrides de preço
    const [pricesOverrides, setPricesOverrides] = useState<Record<string, { price: string, consumable: string }>>({})

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
                fullDescription: event.fullDescription || '',
                bannerImageUrl: event.bannerImageUrl || '',
                eventType: event.eventType,
                startDate: event.startDate.slice(0, 16),
                djName: event.djName || '',
                isFeatured: event.isFeatured,
            })

            // Parse overrides se houver
            let po = {}
            if (event.spacePricesOverrides) {
                try {
                    po = typeof event.spacePricesOverrides === 'string'
                        ? JSON.parse(event.spacePricesOverrides)
                        : event.spacePricesOverrides
                } catch (e) { console.error(e) }
            }
            setPricesOverrides(po as any)

        } else {
            setEditingEvent(null)
            setFormData({
                title: '',
                slug: '',
                description: '',
                fullDescription: '',
                bannerImageUrl: '',
                eventType: 'DJ_NIGHT',
                startDate: '',
                djName: '',
                isFeatured: false,
            })
            setPricesOverrides({})
        }
        setIsModalOpen(true)
    }

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value
        if (!editingEvent) {
            setFormData(p => ({ ...p, title, slug: generateSlug(title) }))
        } else {
            setFormData(p => ({ ...p, title }))
        }
    }

    const handleOverrideChange = (spaceId: string, field: 'price' | 'consumable', value: string) => {
        setPricesOverrides(prev => ({
            ...prev,
            [spaceId]: {
                ...prev[spaceId],
                [field]: value
            }
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        // Limpa overrides vazios
        const cleanedOverrides: Record<string, any> = {}
        Object.entries(pricesOverrides).forEach(([key, val]) => {
            if (val.price || val.consumable) {
                cleanedOverrides[key] = val
            }
        })

        const payload = {
            title: formData.title,
            slug: formData.slug,
            description: formData.description,
            fullDescription: formData.fullDescription,
            bannerImageUrl: formData.bannerImageUrl,
            eventType: formData.eventType,
            startDate: formData.startDate,
            djName: formData.djName || null,
            isFeatured: formData.isFeatured,
            spacePricesOverrides: Object.keys(cleanedOverrides).length > 0 ? cleanedOverrides : null
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
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Eventos & Lotes</h1>
                    <p className="text-[#8a5c3f]">Gerencie programação, crie o release do calendário e gerencie lotes (preços de bangalôs).</p>
                </div>
                <Button onClick={() => openModal()}>
                    <Plus className="h-4 w-4 mr-2" />
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
                        <Button onClick={() => openModal()}><Plus className="h-4 w-4 mr-2" /> Criar Evento</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <Card key={event.id} className="hover:border-[#d4a574]/40 transition-colors">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <Badge variant="secondary" className="bg-[#f5f0e8] text-[#8B4513] border-[#e0d5c7]">{typeLabel(event.eventType)}</Badge>
                                    {event.isFeatured && <Badge className="bg-[#2a2a2a] text-[#d4a574] border-none">⭐ Destaque</Badge>}
                                </div>
                                <h3 className="font-serif text-xl font-bold text-[#2a2a2a] mb-2">{event.title}</h3>
                                {event.fullDescription && (
                                    <p className="text-xs text-[#2a2a2a] font-medium mb-1 border-l-2 border-[#d4a574] pl-2">Contém Release de Calendário cadastrado</p>
                                )}
                                {event.spacePricesOverrides && Object.keys(event.spacePricesOverrides).length > 0 && (
                                    <p className="text-xs text-[#8B4513] font-medium mb-3 border-l-2 border-[#8B4513] pl-2">Contém {Object.keys(event.spacePricesOverrides).length} preços de Lote cadastrados</p>
                                )}
                                <p className="text-sm text-[#8a5c3f] line-clamp-2 mb-4">{event.description}</p>

                                <div className="space-y-1.5 text-sm text-[#8a5c3f] mb-5 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[#d4a574]" />{formatDateUTC(event.startDate)}</div>
                                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#d4a574]" />{formatTime(event.startDate)}</div>
                                    {event.djName && <div className="flex items-center gap-2"><Music className="h-4 w-4 text-[#d4a574]" />{event.djName}</div>}
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" className="flex-1 border-[#e0d5c7] hover:bg-[#f5f0e8]" onClick={() => openModal(event)}>
                                        <Pencil className="h-4 w-4 mr-1.5" /> Editar Evento
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(event)} className="hover:bg-red-50">
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
                <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <ModalHeader className="border-b border-gray-100 pb-4 mb-4">
                        <ModalTitle className="text-2xl font-serif text-[#2a2a2a]">{editingEvent ? 'Editar Evento e Lotes' : 'Criar Novo Evento'}</ModalTitle>
                    </ModalHeader>
                    <form onSubmit={handleSubmit} className="p-2 space-y-8">

                        {/* Seção 1: Informações Básicas */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-[#2a2a2a] flex items-center gap-2 border-b pb-2">
                                <span className="w-6 h-6 rounded-full bg-[#f5f0e8] text-[#8B4513] flex items-center justify-center text-xs">1</span>
                                Dados Principais
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Nome do Evento" value={formData.title} onChange={handleTitleChange} required placeholder="Ex: Sexta DJ Night" />
                                <Input label="Slug (URL Amigável)" value={formData.slug} onChange={(e) => setFormData(p => ({ ...p, slug: e.target.value }))} required />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-medium text-[#2a2a2a] mb-1.5">Tipo do Evento</label>
                                    <select value={formData.eventType} onChange={(e) => setFormData(p => ({ ...p, eventType: e.target.value }))}
                                        className="w-full h-[42px] px-4 rounded-lg border border-[#e0d5c7] text-sm focus:ring-2 focus:ring-[#d4a574] bg-white">
                                        {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-1">
                                    <Input label="Data e Hora de Início" type="datetime-local" value={formData.startDate} onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))} required />
                                </div>
                                <div className="md:col-span-1">
                                    <Input label="Line-up / Atração (Opcional)" value={formData.djName} onChange={(e) => setFormData(p => ({ ...p, djName: e.target.value }))} placeholder="Ex: DJ Lucas" />
                                </div>
                            </div>
                        </div>

                        {/* Seção 2: Textos e Mídia */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-[#2a2a2a] flex items-center gap-2 border-b pb-2">
                                <span className="w-6 h-6 rounded-full bg-[#f5f0e8] text-[#8B4513] flex items-center justify-center text-xs">2</span>
                                Exibição e Divulgação
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-[#2a2a2a] mb-1.5">Descrição Curta (Subtítulo geral)</label>
                                <textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-lg border border-[#e0d5c7] text-sm focus:ring-2 focus:ring-[#d4a574]" rows={2} placeholder="Um resumo curto do evento" />
                            </div>

                            <div className="bg-[#fbf9f6] p-4 rounded-xl border border-[#e0d5c7]/50">
                                <label className="block text-sm font-bold text-[#8B4513] mb-1.5">RELEASE DO CALENDÁRIO (Aparecerá no Float de Reservas)</label>
                                <p className="text-xs text-[#8a5c3f] mb-3">Este é o texto que saltará aos olhos do cliente quando ele clicar na data do evento no calendário interativo da página de reservas.</p>
                                <textarea value={formData.fullDescription} onChange={(e) => setFormData(p => ({ ...p, fullDescription: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-lg border border-[#e0d5c7] text-sm focus:ring-2 focus:ring-[#d4a574] bg-white shadow-inner" rows={4} placeholder="Digite aqui o Release ou Atração Especial da data..." />
                            </div>

                            <Input label="URL do Banner Principal (Capa na Home / Opcional)" value={formData.bannerImageUrl} onChange={(e) => setFormData(p => ({ ...p, bannerImageUrl: e.target.value }))} placeholder="/eventos/poster1.jpg" />

                            <label className="flex items-center gap-3 cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors w-fit mt-2">
                                <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData(p => ({ ...p, isFeatured: e.target.checked }))} className="w-5 h-5 rounded border-gray-300 text-[#2a2a2a] focus:ring-[#2a2a2a]" />
                                <span className="text-sm font-medium">Destacar este evento nas Vitrines</span>
                            </label>
                        </div>

                        {/* Seção 3: Lotes (Overrides de Preço) */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-[#2a2a2a] flex items-center gap-2 border-b pb-2">
                                <span className="w-6 h-6 rounded-full bg-[#f5f0e8] text-[#8B4513] flex items-center justify-center text-xs">3</span>
                                Configuração de Lote (Preços Específicos do Evento)
                            </h3>
                            <p className="text-sm text-[#8a5c3f] mb-4">Deixe em branco para usar o preço padrão do espaço. Preencha apenas os espaços onde o valor irá mudar nesta data.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {spaceOverridesList.map(space => (
                                    <div key={space.id} className="bg-white border text-sm border-gray-200 rounded-xl p-3 shadow-sm hover:border-[#d4a574]/40 transition-colors">
                                        <p className="font-bold text-[#2a2a2a] mb-3 whitespace-nowrap overflow-hidden text-ellipsis">{space.label}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Preço Final (R$)</label>
                                                <div className="relative">
                                                    <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="number"
                                                        placeholder="Ex: 2500"
                                                        className="w-full pl-8 pr-3 py-1.5 rounded-md border border-gray-300 text-sm focus:ring-1 focus:ring-[#d4a574] focus:border-[#d4a574]"
                                                        value={pricesOverrides[space.id]?.price || ''}
                                                        onChange={(e) => handleOverrideChange(space.id, 'price', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Consumação (R$)</label>
                                                <div className="relative">
                                                    <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="number"
                                                        placeholder="Ex: 2000"
                                                        className="w-full pl-8 pr-3 py-1.5 rounded-md border border-gray-300 text-sm focus:ring-1 focus:ring-[#d4a574] focus:border-[#d4a574]"
                                                        value={pricesOverrides[space.id]?.consumable || ''}
                                                        onChange={(e) => handleOverrideChange(space.id, 'consumable', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <ModalFooter className="pt-6 border-t font-serif mt-8">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="px-6 py-5">Voltar</Button>
                            <Button type="submit" isLoading={saving} className="px-10 py-5 text-base">{editingEvent ? 'Salvar Evento e Substituir Lote' : 'Cadastrar Evento e Aplicar Lotes'}</Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </AdminLayout>
    )
}
