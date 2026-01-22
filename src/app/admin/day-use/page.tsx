// AISSU Beach Lounge - Admin Day Use (CRUD Completo)
'use client'

import { useState } from 'react'
import { Save, Umbrella, UtensilsCrossed, Plus, Trash2, AlertCircle, GripVertical } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal'
import toast from 'react-hot-toast'

interface DayUseConfig {
    id: string
    name: string
    description: string
    price: number
    consumable: number
    limit: string
    icon: 'beach' | 'restaurant' | 'custom'
    isActive: boolean
}

const iconOptions = [
    { value: 'beach', label: 'Praia (Guarda-sol)', icon: Umbrella },
    { value: 'restaurant', label: 'Restaurante', icon: UtensilsCrossed },
]

export default function AdminDayUsePage() {
    const [saving, setSaving] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<DayUseConfig | null>(null)

    const [configs, setConfigs] = useState<DayUseConfig[]>([
        {
            id: 'day-use-carnaval',
            name: 'Day Use Carnaval',
            description: 'Espreguiçadeira + Guarda-sol • Mesas de praia (8)',
            price: 200,
            consumable: 150,
            limit: '40 pessoas',
            icon: 'beach',
            isActive: true,
        },
        {
            id: 'mesas-restaurante',
            name: 'Mesas de Restaurante',
            description: 'Para 4 a 6 pessoas • 4 mesas',
            price: 200,
            consumable: 150,
            limit: '4 mesas',
            icon: 'restaurant',
            isActive: true,
        },
    ])

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '200',
        consumable: '150',
        limit: '',
        icon: 'beach' as 'beach' | 'restaurant' | 'custom',
    })

    const openModal = (item?: DayUseConfig) => {
        if (item) {
            setEditingItem(item)
            setFormData({
                name: item.name,
                description: item.description,
                price: item.price.toString(),
                consumable: item.consumable.toString(),
                limit: item.limit,
                icon: item.icon,
            })
        } else {
            setEditingItem(null)
            setFormData({
                name: '',
                description: '',
                price: '200',
                consumable: '150',
                limit: '',
                icon: 'beach',
            })
        }
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (editingItem) {
            // Editar existente
            setConfigs(prev =>
                prev.map(config =>
                    config.id === editingItem.id
                        ? {
                            ...config,
                            name: formData.name,
                            description: formData.description,
                            price: parseFloat(formData.price) || 0,
                            consumable: parseFloat(formData.consumable) || 0,
                            limit: formData.limit,
                            icon: formData.icon,
                        }
                        : config
                )
            )
            toast.success('Item atualizado!')
        } else {
            // Criar novo
            const newItem: DayUseConfig = {
                id: `custom-${Date.now()}`,
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price) || 0,
                consumable: parseFloat(formData.consumable) || 0,
                limit: formData.limit,
                icon: formData.icon,
                isActive: true,
            }
            setConfigs(prev => [...prev, newItem])
            toast.success('Novo item criado!')
        }

        setIsModalOpen(false)
    }

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este item?')) {
            setConfigs(prev => prev.filter(config => config.id !== id))
            toast.success('Item excluído!')
        }
    }

    const toggleActive = (id: string) => {
        setConfigs(prev =>
            prev.map(config =>
                config.id === id ? { ...config, isActive: !config.isActive } : config
            )
        )
    }

    const handleSaveAll = async () => {
        setSaving(true)
        try {
            // Simular salvamento - futuramente conectar com API
            await new Promise(resolve => setTimeout(resolve, 800))
            toast.success('Todas as configurações salvas!')
        } catch {
            toast.error('Erro ao salvar configurações')
        } finally {
            setSaving(false)
        }
    }

    const getIcon = (iconType: string) => {
        switch (iconType) {
            case 'beach': return Umbrella
            case 'restaurant': return UtensilsCrossed
            default: return Umbrella
        }
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Day Use & Mesas</h1>
                    <p className="text-[#8a5c3f]">Gerencie áreas não-reserváveis (Pulseira Prata)</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" onClick={() => openModal()}>
                        <Plus className="h-4 w-4" />
                        Novo Item
                    </Button>
                    <Button onClick={handleSaveAll} isLoading={saving}>
                        <Save className="h-4 w-4" />
                        Salvar Tudo
                    </Button>
                </div>
            </div>

            {/* Info Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-amber-800">Áreas por Ordem de Chegada</p>
                    <p className="text-sm text-amber-700">
                        Estas áreas aparecem na página de reservas como opções de Day Use (não reserváveis online).
                    </p>
                </div>
            </div>

            {/* Config Cards */}
            <div className="space-y-4">
                {configs.map(config => {
                    const Icon = getIcon(config.icon)
                    return (
                        <Card key={config.id} className={!config.isActive ? 'opacity-60' : ''}>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    {/* Drag Handle */}
                                    <div className="pt-1 cursor-grab text-[#c9b8a8] hover:text-[#8a5c3f]">
                                        <GripVertical className="h-5 w-5" />
                                    </div>

                                    {/* Icon */}
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
                                        <Icon className="h-6 w-6 text-gray-600" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-serif text-lg font-bold text-[#2a2a2a]">{config.name}</h3>
                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                Pulseira PRATA
                                            </span>
                                            {!config.isActive && (
                                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                                    Inativo
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-[#8a5c3f] mb-3">{config.description}</p>

                                        <div className="flex items-center gap-6 text-sm">
                                            <div>
                                                <span className="text-xl font-bold text-[#2a2a2a]">R$ {config.price}</span>
                                                <span className="text-[#8a5c3f] ml-1">/pessoa</span>
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                                                R$ {config.consumable} consumação
                                            </div>
                                            <div className="text-[#8a5c3f]">
                                                {config.limit}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleActive(config.id)}
                                            className="text-xs"
                                        >
                                            {config.isActive ? 'Desativar' : 'Ativar'}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => openModal(config)}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(config.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Empty State */}
            {configs.length === 0 && (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Umbrella className="h-12 w-12 text-[#e0d5c7] mx-auto mb-4" />
                        <p className="text-[#8a5c3f] mb-4">Nenhum item de Day Use cadastrado</p>
                        <Button onClick={() => openModal()}>
                            <Plus className="h-4 w-4" />
                            Criar Primeiro Item
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Nota */}
            <p className="text-center text-sm text-[#8a5c3f] mt-8">
                * As alterações serão refletidas imediatamente na página de reservas
            </p>

            {/* Modal */}
            <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
                <ModalContent>
                    <ModalHeader>
                        <ModalTitle>{editingItem ? 'Editar Item' : 'Novo Item Day Use'}</ModalTitle>
                    </ModalHeader>

                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        <Input
                            label="Nome"
                            value={formData.name}
                            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                            placeholder="Ex: Day Use Praia, Mesas VIP..."
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-[#2a2a2a] mb-1.5">Descrição</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                className="w-full px-4 py-2 rounded-lg border border-[#e0d5c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a574] resize-none"
                                rows={2}
                                placeholder="Descrição que aparecerá na página de reservas"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Preço (R$)"
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))}
                                min="0"
                                step="10"
                                required
                            />
                            <Input
                                label="Consumação (R$)"
                                type="number"
                                value={formData.consumable}
                                onChange={(e) => setFormData(p => ({ ...p, consumable: e.target.value }))}
                                min="0"
                                step="10"
                                required
                            />
                        </div>

                        <Input
                            label="Limite/Disponibilidade"
                            value={formData.limit}
                            onChange={(e) => setFormData(p => ({ ...p, limit: e.target.value }))}
                            placeholder="Ex: 40 pessoas, 4 mesas..."
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-[#2a2a2a] mb-1.5">Ícone</label>
                            <div className="grid grid-cols-2 gap-3">
                                {iconOptions.map(option => {
                                    const Icon = option.icon
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, icon: option.value as 'beach' | 'restaurant' }))}
                                            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${formData.icon === option.value
                                                ? 'border-[#d4a574] bg-[#faf8f5]'
                                                : 'border-[#e0d5c7] hover:border-[#c9b8a8]'
                                                }`}
                                        >
                                            <Icon className="h-5 w-5 text-[#8a5c3f]" />
                                            <span className="text-sm text-[#2a2a2a]">{option.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <ModalFooter className="pt-4">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">
                                {editingItem ? 'Salvar' : 'Criar'}
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </AdminLayout>
    )
}
