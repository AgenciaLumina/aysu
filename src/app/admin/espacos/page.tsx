// AISSU Beach Lounge - Admin Cabins com Upload de Imagem
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Users, DollarSign, ImageIcon } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { MediaPicker } from '@/components/ui/MediaPicker'
import { formatCurrency } from '@/lib/utils'
import { getSpacePrefix, isSpaceSlug, resolveCabinSlug } from '@/lib/space-slugs'
import { getCabinTrashDisplayName } from '@/lib/cabin-trash'
import toast from 'react-hot-toast'

interface Cabin {
    id: string
    name: string
    slug?: string | null
    capacity: number
    units: number
    visibilityStatus?: 'AVAILABLE' | 'UNAVAILABLE' | 'HIDDEN'
    pricePerHour: number
    description: string
    category: string
    isActive: boolean
    imageUrl?: string
    deletedAt?: string | null
    deletedOriginalName?: string | null
}

const categories = ['CABANA', 'LOUNGE', 'VIP', 'MESA'] as const
type CabinCategory = (typeof categories)[number]

function normalizeCabinCategory(category: string): CabinCategory {
    if (category === 'ESPREGUICADEIRA') return 'MESA'
    return categories.includes(category as CabinCategory) ? (category as CabinCategory) : 'CABANA'
}

function getVisibilityPriority(status?: Cabin['visibilityStatus']): number {
    if (status === 'HIDDEN') return 3
    if (status === 'UNAVAILABLE') return 2
    return 1
}

function groupCabins(rawCabins: Cabin[], options?: { preserveDeletedBatches?: boolean }): Cabin[] {
    const grouped = new Map<string, Cabin>()

    rawCabins.forEach((cabin) => {
        const resolvedSlug = resolveCabinSlug({ name: cabin.name, slug: cabin.slug }) || null
        const batchSuffix = options?.preserveDeletedBatches && cabin.deletedAt ? `:${cabin.deletedAt}` : ''
        const key = `${resolvedSlug ?? cabin.id}${batchSuffix}`
        const normalizedUnits = Math.max(1, cabin.units || 1)
        const displayName = options?.preserveDeletedBatches
            ? getCabinTrashDisplayName(cabin)
            : (resolvedSlug && isSpaceSlug(resolvedSlug) ? getSpacePrefix(resolvedSlug) : cabin.name)

        if (!grouped.has(key)) {
            grouped.set(key, {
                ...cabin,
                name: displayName,
                slug: resolvedSlug,
                units: normalizedUnits,
                visibilityStatus: cabin.visibilityStatus || 'AVAILABLE',
                deletedAt: cabin.deletedAt || null,
                deletedOriginalName: cabin.deletedOriginalName || null,
            })
            return
        }

        const current = grouped.get(key)!
        current.units += normalizedUnits
        current.isActive = current.isActive || cabin.isActive
        current.deletedAt = current.deletedAt || cabin.deletedAt || null
        current.deletedOriginalName = current.deletedOriginalName || cabin.deletedOriginalName || null
        if (getVisibilityPriority(cabin.visibilityStatus) > getVisibilityPriority(current.visibilityStatus)) {
            current.visibilityStatus = cabin.visibilityStatus || 'AVAILABLE'
        }
    })

    return Array.from(grouped.values())
}

export default function AdminCabinsPage() {
    const [cabins, setCabins] = useState<Cabin[]>([])
    const [trashCabins, setTrashCabins] = useState<Cabin[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCabin, setEditingCabin] = useState<Cabin | null>(null)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [restoringId, setRestoringId] = useState<string | null>(null)
    const [showMediaPicker, setShowMediaPicker] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        capacity: '6',
        units: '1',
        visibilityStatus: 'AVAILABLE' as 'AVAILABLE' | 'UNAVAILABLE' | 'HIDDEN',
        pricePerHour: '100',
        description: '',
        category: 'CABANA',
        imageUrl: '',
    })

    useEffect(() => { fetchCabins() }, [])

    async function fetchCabins() {
        try {
            setLoading(true)

            const [activeRes, trashRes] = await Promise.all([
                fetch('/api/cabins?isActive=true', { cache: 'no-store' }),
                fetch('/api/cabins?deleted=true', { cache: 'no-store' }),
            ])

            const [activeData, trashData] = await Promise.all([
                activeRes.json(),
                trashRes.json(),
            ])

            if (!activeData.success || !Array.isArray(activeData.data)) {
                throw new Error(activeData.error || 'Erro ao carregar espaços ativos')
            }

            if (!trashData.success || !Array.isArray(trashData.data)) {
                throw new Error(trashData.error || 'Erro ao carregar lixeira')
            }

            setCabins(groupCabins(activeData.data))
            setTrashCabins(groupCabins(trashData.data, { preserveDeletedBatches: true }))
        } catch (error) {
            console.error('Erro:', error)
            setCabins([])
            setTrashCabins([])
            toast.error(error instanceof Error ? error.message : 'Erro ao carregar espaços')
        } finally {
            setLoading(false)
        }
    }

    const openModal = (cabin?: Cabin) => {
        if (cabin) {
            setEditingCabin(cabin)
            setFormData({
                name: cabin.name,
                capacity: cabin.capacity.toString(),
                units: cabin.units.toString(),
                visibilityStatus: cabin.visibilityStatus || 'AVAILABLE',
                pricePerHour: cabin.pricePerHour.toString(),
                description: cabin.description || '',
                category: normalizeCabinCategory(cabin.category),
                imageUrl: cabin.imageUrl || '',
            })
        } else {
            setEditingCabin(null)
            setFormData({ name: '', capacity: '6', units: '1', visibilityStatus: 'AVAILABLE', pricePerHour: '100', description: '', category: 'CABANA', imageUrl: '' })
        }
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const payload = {
            name: formData.name,
            capacity: parseInt(formData.capacity),
            units: parseInt(formData.units),
            visibilityStatus: formData.visibilityStatus,
            pricePerHour: parseFloat(formData.pricePerHour),
            description: formData.description,
            category: normalizeCabinCategory(formData.category),
            imageUrl: formData.imageUrl || undefined,
            slug: editingCabin?.slug || undefined,
        }

        try {
            const url = editingCabin ? `/api/cabins/${editingCabin.id}` : '/api/cabins'
            const method = editingCabin ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (data.success) {
                toast.success(editingCabin ? 'Espaço atualizado!' : 'Espaço criado!')
                setIsModalOpen(false)
                fetchCabins()
            } else {
                toast.error(data.error || 'Erro ao salvar')
            }
        } catch {
            toast.error('Erro ao salvar espaço')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (cabin: Cabin) => {
        const confirmed = window.confirm(`Mover "${cabin.name}" para a lixeira? O espaço sairá das vendas e reservas, mas poderá ser restaurado depois.`)
        if (!confirmed) return

        setDeletingId(cabin.id)
        try {
            const res = await fetch(`/api/cabins/${cabin.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            })

            const data = await res.json()
            if (data.success) {
                toast.success('Espaço enviado para a lixeira!')
                if (editingCabin?.id === cabin.id) {
                    setIsModalOpen(false)
                }
                fetchCabins()
            } else {
                toast.error(data.error || 'Erro ao excluir espaço')
            }
        } catch {
            toast.error('Erro ao excluir espaço')
        } finally {
            setDeletingId(null)
        }
    }

    const handleRestore = async (cabin: Cabin) => {
        const confirmed = window.confirm(`Restaurar "${cabin.name}" da lixeira?`)
        if (!confirmed) return

        setRestoringId(cabin.id)
        try {
            const res = await fetch(`/api/cabins/${cabin.id}/restore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })

            const data = await res.json()
            if (data.success) {
                toast.success('Espaço restaurado com sucesso!')
                fetchCabins()
            } else {
                toast.error(data.error || 'Erro ao restaurar espaço')
            }
        } catch {
            toast.error('Erro ao restaurar espaço')
        } finally {
            setRestoringId(null)
        }
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Espaços</h1>
                    <p className="text-[#8a5c3f]">Gerencie bangalôs, mesas, lounges e demais espaços</p>
                </div>
                <Button onClick={() => openModal()}>
                    <Plus className="h-4 w-4" />
                    Novo Espaço
                </Button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : (
                <div className="space-y-10">
                    <section className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-[#2a2a2a]">Espaços ativos</h2>
                                <p className="text-sm text-[#8a5c3f]">Cadastro base de estoque, capacidade e preço padrão.</p>
                            </div>
                            <Badge variant="secondary">{cabins.length} tipos</Badge>
                        </div>

                        {cabins.length === 0 ? (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <Users className="h-12 w-12 text-[#e0d5c7] mx-auto mb-4" />
                                    <p className="text-[#8a5c3f] mb-4">Nenhum espaço ativo cadastrado</p>
                                    <Button onClick={() => openModal()}>
                                        <Plus className="h-4 w-4" />
                                        Criar Primeiro Espaço
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {cabins.map(cabin => (
                                    <Card key={cabin.id} className={!cabin.isActive || cabin.visibilityStatus === 'HIDDEN' ? 'opacity-60' : ''}>
                                        <CardContent className="p-0">
                                            <div className="relative aspect-[5/6] bg-[#f5f0eb]">
                                                {cabin.imageUrl ? (
                                                    <Image
                                                        src={cabin.imageUrl}
                                                        alt={cabin.name}
                                                        fill
                                                        className="object-contain object-center"
                                                        unoptimized={cabin.imageUrl.startsWith('http')}
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <ImageIcon className="h-12 w-12 text-[#e0d5c7]" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge variant="secondary">{cabin.category}</Badge>
                                                    {cabin.visibilityStatus === 'AVAILABLE' && <Badge variant="success">Disponível</Badge>}
                                                    {cabin.visibilityStatus === 'UNAVAILABLE' && <Badge variant="warning">Indisponível</Badge>}
                                                    {cabin.visibilityStatus === 'HIDDEN' && <Badge variant="outline">Oculto</Badge>}
                                                    {!cabin.isActive && <Badge variant="warning">Inativo</Badge>}
                                                </div>
                                                <h3 className="font-serif text-lg font-bold text-[#2a2a2a] mb-2">{cabin.name}</h3>
                                                <p className="text-sm text-[#8a5c3f] mb-4 line-clamp-2">{cabin.description}</p>

                                                <div className="flex items-center gap-4 text-sm text-[#8a5c3f] mb-4">
                                                    <div className="flex items-center gap-1">
                                                        <Users className="h-4 w-4" />
                                                        <span>{cabin.capacity} pessoas</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Badge variant="secondary">{cabin.units} un.</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="h-4 w-4" />
                                                        <span>{formatCurrency(cabin.pricePerHour)}/h</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => openModal(cabin)}>
                                                        <Pencil className="h-4 w-4" />
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDelete(cabin)}
                                                        isLoading={deletingId === cabin.id}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Excluir
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-[#2a2a2a]">Lixeira</h2>
                                <p className="text-sm text-[#8a5c3f]">Espaços excluídos aguardando restauração.</p>
                            </div>
                            <Badge variant="outline">{trashCabins.length} itens</Badge>
                        </div>

                        {trashCabins.length === 0 ? (
                            <Card>
                                <CardContent className="py-10 text-center">
                                    <Trash2 className="h-10 w-10 text-[#e0d5c7] mx-auto mb-4" />
                                    <p className="text-[#8a5c3f]">Nenhum espaço na lixeira</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {trashCabins.map(cabin => (
                                    <Card key={cabin.id} className="border-dashed opacity-80">
                                        <CardContent className="p-0">
                                            <div className="relative aspect-[5/6] bg-[#f8f4ef]">
                                                {cabin.imageUrl ? (
                                                    <Image
                                                        src={cabin.imageUrl}
                                                        alt={cabin.name}
                                                        fill
                                                        className="object-contain object-center grayscale"
                                                        unoptimized={cabin.imageUrl.startsWith('http')}
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <ImageIcon className="h-12 w-12 text-[#e0d5c7]" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge variant="outline">{cabin.category}</Badge>
                                                    <Badge variant="warning">Na lixeira</Badge>
                                                </div>
                                                <h3 className="font-serif text-lg font-bold text-[#2a2a2a] mb-2">{cabin.name}</h3>
                                                <p className="text-sm text-[#8a5c3f] mb-4 line-clamp-2">{cabin.description}</p>

                                                <div className="flex items-center gap-4 text-sm text-[#8a5c3f] mb-4">
                                                    <div className="flex items-center gap-1">
                                                        <Users className="h-4 w-4" />
                                                        <span>{cabin.capacity} pessoas</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Badge variant="secondary">{cabin.units} un.</Badge>
                                                    </div>
                                                </div>

                                                {cabin.deletedAt && (
                                                    <p className="mb-4 text-xs text-[#8a5c3f]/80">
                                                        Excluído em {new Date(cabin.deletedAt).toLocaleString('pt-BR')}
                                                    </p>
                                                )}

                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => handleRestore(cabin)}
                                                    isLoading={restoringId === cabin.id}
                                                >
                                                    Restaurar
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}

            {/* Modal de Edição */}
            <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
                <ModalContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <ModalHeader>
                        <ModalTitle>{editingCabin ? 'Editar Espaço' : 'Novo Espaço'}</ModalTitle>
                    </ModalHeader>

                    <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-2">
                        {/* Imagem */}
                        <div>
                            <label className="block text-sm font-medium text-[#2a2a2a] mb-2">Imagem</label>
                            <div
                                onClick={() => setShowMediaPicker(true)}
                                className="relative mx-auto w-full max-w-[220px] aspect-[5/6] bg-[#f5f0eb] rounded-lg border-2 border-dashed border-[#e0d5c7] hover:border-[#d4a574] cursor-pointer transition-colors overflow-hidden"
                            >
                                {formData.imageUrl ? (
                                    <Image
                                        src={formData.imageUrl}
                                        alt="Preview"
                                        fill
                                        className="object-contain object-center"
                                        unoptimized={formData.imageUrl.startsWith('http')}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8a5c3f]">
                                        <ImageIcon className="h-8 w-8 mb-2" />
                                        <span className="text-sm">Clique para selecionar</span>
                                    </div>
                                )}
                            </div>
                            {formData.imageUrl && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, imageUrl: '' }))}
                                    className="text-sm text-red-500 mt-1 hover:underline"
                                >
                                    Remover imagem
                                </button>
                            )}
                        </div>

                        <Input
                            label="Nome"
                            value={formData.name}
                            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                            placeholder="Bangalô Premium 1"
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-[#2a2a2a] mb-1.5">Descrição</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                className="w-full px-4 py-2 rounded-lg border border-[#e0d5c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                                rows={3}
                                placeholder="Descrição do espaço..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Capacidade"
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => setFormData(p => ({ ...p, capacity: e.target.value }))}
                                min="1"
                                required
                            />
                            <Input
                                label="Quantidade"
                                type="number"
                                value={formData.units}
                                onChange={(e) => setFormData(p => ({ ...p, units: e.target.value }))}
                                min="1"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#2a2a2a] mb-1.5">Status na Reserva</label>
                            <select
                                value={formData.visibilityStatus}
                                onChange={(e) => setFormData(p => ({ ...p, visibilityStatus: e.target.value as 'AVAILABLE' | 'UNAVAILABLE' | 'HIDDEN' }))}
                                className="w-full h-11 px-4 rounded-lg border border-[#e0d5c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                            >
                                <option value="AVAILABLE">Disponível</option>
                                <option value="UNAVAILABLE">Indisponível</option>
                                <option value="HIDDEN">Oculto</option>
                            </select>
                        </div>

                        <Input
                            label="Preço/hora (R$)"
                            type="number"
                            step="0.01"
                            value={formData.pricePerHour}
                            onChange={(e) => setFormData(p => ({ ...p, pricePerHour: e.target.value }))}
                            min="0"
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-[#2a2a2a] mb-1.5">Categoria</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                                className="w-full h-11 px-4 rounded-lg border border-[#e0d5c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <ModalFooter className="pt-4 sm:justify-between sm:space-x-0">
                            <div className="flex justify-start">
                                {editingCabin ? (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => handleDelete(editingCabin)}
                                        isLoading={deletingId === editingCabin.id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Excluir Espaço
                                    </Button>
                                ) : <div />}
                            </div>
                            <div className="flex flex-col-reverse gap-2 sm:flex-row">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" isLoading={saving}>
                                    {editingCabin ? 'Salvar' : 'Criar'}
                                </Button>
                            </div>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>

            {/* Media Picker */}
            <MediaPicker
                open={showMediaPicker}
                onClose={() => setShowMediaPicker(false)}
                onSelect={(url) => {
                    setFormData(p => ({ ...p, imageUrl: url }))
                    setShowMediaPicker(false)
                }}
                defaultFolder="cabins/"
            />
        </AdminLayout>
    )
}
