// AISSU Beach Lounge - Admin Cabins (Refatorado)
'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Users, DollarSign } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Cabin {
    id: string
    name: string
    capacity: number
    pricePerHour: number
    description: string
    category: string
    isActive: boolean
}

const categories = ['CABANA', 'VIP', 'MESA', 'ESPREGUICADEIRA']

export default function AdminCabinsPage() {
    const [cabins, setCabins] = useState<Cabin[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCabin, setEditingCabin] = useState<Cabin | null>(null)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        capacity: '6',
        pricePerHour: '100',
        description: '',
        category: 'CABANA',
    })

    useEffect(() => { fetchCabins() }, [])

    async function fetchCabins() {
        try {
            const res = await fetch('/api/cabins')
            const data = await res.json()
            if (data.success) setCabins(data.data)
        } catch (error) {
            console.error('Erro:', error)
            toast.error('Erro ao carregar bangalôs')
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
                pricePerHour: cabin.pricePerHour.toString(),
                description: cabin.description || '',
                category: cabin.category,
            })
        } else {
            setEditingCabin(null)
            setFormData({ name: '', capacity: '6', pricePerHour: '100', description: '', category: 'CABANA' })
        }
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const payload = {
            name: formData.name,
            capacity: parseInt(formData.capacity),
            pricePerHour: parseFloat(formData.pricePerHour),
            description: formData.description,
            category: formData.category,
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
                toast.success(editingCabin ? 'Bangalô atualizado!' : 'Bangalô criado!')
                setIsModalOpen(false)
                fetchCabins()
            } else {
                toast.error(data.error || 'Erro ao salvar')
            }
        } catch (error) {
            toast.error('Erro ao salvar bangalô')
        } finally {
            setSaving(false)
        }
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Espaços</h1>
                    <p className="text-[#8a5c3f]">Gerencie bangalôs, cabanas e espaços</p>
                </div>
                <Button onClick={() => openModal()}>
                    <Plus className="h-4 w-4" />
                    Novo Espaço
                </Button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : cabins.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Users className="h-12 w-12 text-[#e0d5c7] mx-auto mb-4" />
                        <p className="text-[#8a5c3f] mb-4">Nenhum bangalô cadastrado</p>
                        <Button onClick={() => openModal()}>
                            <Plus className="h-4 w-4" />
                            Criar Primeiro Bangalô
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cabins.map(cabin => (
                        <Card key={cabin.id} className={!cabin.isActive ? 'opacity-60' : ''}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <Badge variant="secondary">{cabin.category}</Badge>
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
                                        <DollarSign className="h-4 w-4" />
                                        <span>{formatCurrency(cabin.pricePerHour)}/h</span>
                                    </div>
                                </div>

                                <Button variant="secondary" size="sm" className="w-full" onClick={() => openModal(cabin)}>
                                    <Pencil className="h-4 w-4" />
                                    Editar
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
                <ModalContent>
                    <ModalHeader>
                        <ModalTitle>{editingCabin ? 'Editar Bangalô' : 'Novo Bangalô'}</ModalTitle>
                    </ModalHeader>

                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
                                label="Preço/hora (R$)"
                                type="number"
                                step="0.01"
                                value={formData.pricePerHour}
                                onChange={(e) => setFormData(p => ({ ...p, pricePerHour: e.target.value }))}
                                min="0"
                                required
                            />
                        </div>

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

                        <ModalFooter className="pt-4">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" isLoading={saving}>
                                {editingCabin ? 'Salvar' : 'Criar'}
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </AdminLayout>
    )
}
