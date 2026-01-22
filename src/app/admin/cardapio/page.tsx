// AISSU Beach Lounge - Admin Cardápio (Layout Lista Compacta)
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Eye, EyeOff, UtensilsCrossed, Search, Upload, X, Filter, ChevronsUpDown } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

interface MenuItem {
    id: string
    name: string
    description: string
    price: number
    isAvailable: boolean
    tags: string[]
    categoryId: string
    imageUrl?: string
    category: { id: string; name: string; slug: string }
}

interface Category {
    id: string
    name: string
    slug: string
    displayOrder?: number
}

export default function AdminMenuPage() {
    const [items, setItems] = useState<MenuItem[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [expandedCategories, setExpandedCategories] = useState<string[]>([])
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        tags: '',
        imageUrl: ''
    })
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => { fetchData() }, [])

    async function fetchData() {
        try {
            const [itemsRes, catsRes] = await Promise.all([
                fetch('/api/menu/items'),
                fetch('/api/menu/categories')
            ])
            const itemsData = await itemsRes.json()
            const catsData = await catsRes.json()
            if (itemsData.success) setItems(itemsData.data)
            if (catsData.success) {
                setCategories(catsData.data)
                // Expandir todas categorias inicialmente
                setExpandedCategories(catsData.data.map((c: Category) => c.id))
            }
        } catch {
            toast.error('Erro ao carregar')
        } finally {
            setLoading(false)
        }
    }

    // Agrupar itens por categoria
    const itemsByCategory = useMemo(() => {
        const grouped: Record<string, MenuItem[]> = {}

        const filtered = items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )

        filtered.forEach(item => {
            const catId = item.categoryId || 'sem-categoria'
            if (!grouped[catId]) grouped[catId] = []
            grouped[catId].push(item)
        })

        return grouped
    }, [items, searchQuery])

    // Categorias ordenadas
    const sortedCategories = useMemo(() => {
        return categories.map(cat => ({
            ...cat,
            count: itemsByCategory[cat.id]?.length || 0
        })).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    }, [categories, itemsByCategory])

    const openModal = (item?: MenuItem) => {
        if (item) {
            setEditingItem(item)
            setFormData({
                name: item.name,
                description: item.description || '',
                price: item.price.toString(),
                categoryId: item.categoryId,
                tags: item.tags?.join(', ') || '',
                imageUrl: item.imageUrl || ''
            })
        } else {
            setEditingItem(null)
            setFormData({
                name: '',
                description: '',
                price: '',
                categoryId: selectedCategory !== 'all' ? selectedCategory : (categories[0]?.id || ''),
                tags: '',
                imageUrl: ''
            })
        }
        setIsModalOpen(true)
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formDataUpload = new FormData()
        formDataUpload.append('file', file)
        formDataUpload.append('folder', 'menu')

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload })
            const data = await res.json()
            if (data.success) {
                setFormData(p => ({ ...p, imageUrl: data.data.url }))
                toast.success('Imagem enviada!')
            } else {
                toast.error(data.error || 'Erro no upload')
            }
        } catch {
            toast.error('Erro ao enviar imagem')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const payload = {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            categoryId: formData.categoryId,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
            imageUrl: formData.imageUrl || null
        }

        try {
            const url = editingItem ? `/api/menu/items/${editingItem.id}` : '/api/menu/items'
            const res = await fetch(url, {
                method: editingItem ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()

            if (data.success) {
                toast.success(editingItem ? 'Atualizado!' : 'Criado!')
                setIsModalOpen(false)
                fetchData()
            } else {
                toast.error(data.error || 'Erro ao salvar')
            }
        } catch {
            toast.error('Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    const handleToggle = async (item: MenuItem) => {
        try {
            const res = await fetch(`/api/menu/items/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isAvailable: !item.isAvailable })
            })
            if (res.ok) {
                toast.success(item.isAvailable ? 'Item desativado' : 'Item ativado')
                fetchData()
            }
        } catch {
            toast.error('Erro ao atualizar')
        }
    }

    const handleDelete = async (item: MenuItem) => {
        if (!confirm(`Excluir "${item.name}"?`)) return
        try {
            const res = await fetch(`/api/menu/items/${item.id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Item excluído')
                fetchData()
            }
        } catch {
            toast.error('Erro ao excluir')
        }
    }

    const toggleCategory = (catId: string) => {
        setExpandedCategories(prev =>
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        )
    }

    // Filtrar categorias
    const categoriesToShow = sortedCategories.filter(c => {
        const hasItems = (itemsByCategory[c.id]?.length || 0) > 0
        const isSelected = selectedCategory === 'all' || selectedCategory === c.id
        // Mostrar se tem itens E está selecionada (ou todas)
        // Se busca ativa, só mostra categorias com matches
        return hasItems && isSelected
    })

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Cardápio</h1>
                    <p className="text-[#8a5c3f]">
                        Gerenciamento de itens e preços
                    </p>
                </div>
                <Button onClick={() => openModal()}>
                    <Plus className="h-4 w-4" />
                    Novo Item
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 sticky top-0 bg-[#f8f6f3] z-10 py-2 border-b border-[#e0d5c7]/50">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a5c3f]" />
                    <input
                        type="text"
                        placeholder="Buscar item..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e0d5c7] text-sm focus:ring-2 focus:ring-[#d4a574] bg-white"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-[#8a5c3f]" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2.5 rounded-xl border border-[#e0d5c7] text-sm focus:ring-2 focus:ring-[#d4a574] bg-white min-w-[180px]"
                    >
                        <option value="all">Todas</option>
                        {sortedCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name} ({cat.count})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Spinner size="lg" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-[#e0d5c7]">
                    <p className="text-[#8a5c3f]">Nenhum item cadastrado.</p>
                </div>
            ) : categoriesToShow.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-[#8a5c3f]">Nenhum item encontrado nesta busca.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {categoriesToShow.map(category => {
                        const categoryItems = itemsByCategory[category.id] || []
                        const isExpanded = expandedCategories.includes(category.id)

                        return (
                            <div key={category.id} className="bg-white rounded-xl border border-[#e0d5c7] overflow-hidden shadow-sm">
                                {/* Category Header */}
                                <div
                                    className="px-6 py-4 bg-[#faf8f5] flex items-center justify-between cursor-pointer hover:bg-[#f5f0e8] transition-colors"
                                    onClick={() => toggleCategory(category.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <ChevronsUpDown className={`h-4 w-4 text-[#8a5c3f] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        <h2 className="font-bold text-[#2a2a2a]">{category.name}</h2>
                                        <Badge variant="secondary" className="text-xs">{categoryItems.length} itens</Badge>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => { e.stopPropagation(); setSelectedCategory(category.id); openModal(); }}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>

                                {/* Items List (Table-like) */}
                                {isExpanded && (
                                    <div className="divide-y divide-[#f0e8dd]">
                                        {categoryItems.map(item => (
                                            <div key={item.id} className={`flex items-center gap-4 p-4 hover:bg-[#faf9f7] transition-colors ${!item.isAvailable ? 'opacity-60 bg-gray-50' : ''}`}>
                                                {/* Image Thumb */}
                                                <div className="relative h-12 w-12 rounded-lg bg-[#f0e8dd] overflow-hidden flex-shrink-0">
                                                    {item.imageUrl ? (
                                                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-[#cbb8a5]"><UtensilsCrossed className="h-4 w-4" /></div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                                    <div className="md:col-span-5">
                                                        <p className="font-medium text-[#2a2a2a] truncate">{item.name}</p>
                                                        {item.description && <p className="text-xs text-[#8a5c3f] truncate">{item.description}</p>}
                                                    </div>

                                                    <div className="md:col-span-3">
                                                        <p className="font-medium text-[#d4a574]">{formatCurrency(item.price)}</p>
                                                    </div>

                                                    <div className="md:col-span-4 flex items-center gap-2 md:justify-end">
                                                        {/* Status Badge */}
                                                        {!item.isAvailable && <Badge variant="warning" className="text-[10px] px-1.5 h-5">Indisponível</Badge>}

                                                        {/* Actions */}
                                                        <div className="flex items-center gap-1 opacity-100 transition-opacity">
                                                            <button title="Editar" onClick={() => openModal(item)} className="p-2 text-[#8a5c3f] hover:bg-[#e0d5c7] rounded-lg transition-colors">
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                            <button title={item.isAvailable ? 'Desativar' : 'Ativar'} onClick={() => handleToggle(item)} className="p-2 text-[#8a5c3f] hover:bg-[#e0d5c7] rounded-lg transition-colors">
                                                                {item.isAvailable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                            </button>
                                                            <button title="Excluir" onClick={() => handleDelete(item)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modal mantida igual */}
            <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
                <ModalContent className="max-w-lg">
                    <ModalHeader>
                        <ModalTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</ModalTitle>
                    </ModalHeader>
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        {/* Image upload */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Imagem do Produto</label>
                            <div className="flex items-start gap-4">
                                <div className="w-24 h-24 rounded-lg bg-[#f1c595]/30 border-2 border-dashed border-[#d4a574] flex items-center justify-center overflow-hidden relative">
                                    {formData.imageUrl ? (
                                        <>
                                            <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" />
                                            <button type="button" onClick={() => setFormData(p => ({ ...p, imageUrl: '' }))} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"><X className="h-3 w-3" /></button>
                                        </>
                                    ) : <UtensilsCrossed className="h-8 w-8 text-[#d4a574]/50" />}
                                </div>
                                <div className="flex-1">
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} isLoading={uploading}><Upload className="h-4 w-4" /> {formData.imageUrl ? 'Trocar' : 'Enviar'}</Button>
                                    <p className="text-xs text-[#8a5c3f]/70 mt-2">JPG, PNG ou WebP. Max 5MB.</p>
                                </div>
                            </div>
                        </div>

                        <Input label="Nome do Item" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} required />

                        <div>
                            <label className="block text-sm font-medium text-[#2a2a2a] mb-1.5">Descrição</label>
                            <textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-[#e0d5c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a574] resize-none" rows={2} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Preço (R$)" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))} required />
                            <div>
                                <label className="block text-sm font-medium text-[#2a2a2a] mb-1.5">Categoria</label>
                                <select value={formData.categoryId} onChange={(e) => setFormData(p => ({ ...p, categoryId: e.target.value }))} className="w-full h-11 px-4 rounded-lg border border-[#e0d5c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a574]" required>
                                    <option value="">Selecione...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <Input label="Tags" value={formData.tags} onChange={(e) => setFormData(p => ({ ...p, tags: e.target.value }))} placeholder="sem glúten, vegano..." />

                        <ModalFooter className="pt-4">
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" isLoading={saving}>{editingItem ? 'Salvar' : 'Criar'}</Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </AdminLayout>
    )
}
