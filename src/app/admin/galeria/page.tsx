// AISSU Beach Lounge - Admin Gallery Page
'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Upload, Trash2, ExternalLink, GripVertical, X, Check, ImageIcon, Loader2 } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { MediaPicker } from '@/components/ui/MediaPicker'
import toast from 'react-hot-toast'

interface GalleryImage {
    id: string
    imageUrl: string
    caption: string | null
    permalink: string | null
    displayOrder: number
    isActive: boolean
    createdAt: string
}

export default function AdminGalleryPage() {
    const [images, setImages] = useState<GalleryImage[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState({ caption: '', permalink: '' })
    const [dragOver, setDragOver] = useState(false)
    const [draggedItem, setDraggedItem] = useState<GalleryImage | null>(null)
    const [dragOverItem, setDragOverItem] = useState<string | null>(null)
    const [showMediaPicker, setShowMediaPicker] = useState(false)

    // Fetch images
    const fetchImages = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/gallery')
            const data = await res.json()
            if (data.success) {
                setImages(data.data)
            }
        } catch (error) {
            console.error('Error fetching images:', error)
            toast.error('Erro ao carregar galeria')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchImages()
    }, [fetchImages])

    // Handle file upload
    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        setUploading(true)

        for (const file of Array.from(files)) {
            try {
                // 1. Upload to R2
                const formData = new FormData()
                formData.append('file', file)
                formData.append('folder', 'gallery')

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })
                const uploadData = await uploadRes.json()

                if (!uploadData.success) {
                    toast.error(`Erro ao fazer upload: ${file.name}`)
                    continue
                }

                // 2. Save to database
                const saveRes = await fetch('/api/admin/gallery', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageUrl: uploadData.data.url,
                        caption: '',
                    }),
                })
                const saveData = await saveRes.json()

                if (saveData.success) {
                    toast.success('Imagem adicionada!')
                    fetchImages()
                } else {
                    toast.error('Erro ao salvar imagem')
                }
            } catch (error) {
                console.error('Upload error:', error)
                toast.error(`Erro ao processar: ${file.name}`)
            }
        }

        setUploading(false)
    }

    // Handle drag and drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        handleUpload(e.dataTransfer.files)
    }

    // Handle delete
    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover esta imagem?')) return

        try {
            const res = await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' })
            const data = await res.json()

            if (data.success) {
                toast.success('Imagem removida')
                setImages(images.filter(img => img.id !== id))
            } else {
                toast.error('Erro ao remover imagem')
            }
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Erro ao remover imagem')
        }
    }

    // Handle edit save
    const handleEditSave = async () => {
        if (!editingId) return

        try {
            const res = await fetch(`/api/admin/gallery/${editingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            })
            const data = await res.json()

            if (data.success) {
                toast.success('Imagem atualizada')
                setEditingId(null)
                fetchImages()
            } else {
                toast.error('Erro ao atualizar')
            }
        } catch (error) {
            console.error('Edit error:', error)
            toast.error('Erro ao atualizar')
        }
    }

    // Start editing
    const startEditing = (image: GalleryImage) => {
        setEditingId(image.id)
        setEditForm({
            caption: image.caption || '',
            permalink: image.permalink || '',
        })
    }

    // Drag and drop reordering
    const handleDragStart = (image: GalleryImage) => {
        setDraggedItem(image)
    }

    const handleDragOver = (e: React.DragEvent, imageId: string) => {
        e.preventDefault()
        setDragOverItem(imageId)
    }

    const handleDragLeave = () => {
        setDragOverItem(null)
    }

    const handleDropReorder = async (targetImage: GalleryImage) => {
        if (!draggedItem || draggedItem.id === targetImage.id) {
            setDraggedItem(null)
            setDragOverItem(null)
            return
        }

        // Reordenar localmente
        const draggedIndex = images.findIndex(img => img.id === draggedItem.id)
        const targetIndex = images.findIndex(img => img.id === targetImage.id)

        const newImages = [...images]
        newImages.splice(draggedIndex, 1)
        newImages.splice(targetIndex, 0, draggedItem)

        // Atualizar displayOrder
        const updatedImages = newImages.map((img, index) => ({
            ...img,
            displayOrder: index
        }))

        setImages(updatedImages)
        setDraggedItem(null)
        setDragOverItem(null)

        // Salvar no banco
        try {
            await fetch(`/api/admin/gallery/${draggedItem.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayOrder: targetIndex })
            })
            toast.success('Ordem atualizada!')
        } catch (error) {
            console.error('Reorder error:', error)
            toast.error('Erro ao reordenar')
            fetchImages() // Reverter em caso de erro
        }
    }

    const handleDragEnd = () => {
        setDraggedItem(null)
        setDragOverItem(null)
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Galeria</h1>
                    <p className="text-[#8a5c3f]">Gerencie as imagens exibidas na homepage</p>
                </div>
                <Button onClick={() => setShowMediaPicker(true)}>
                    <Upload className="h-4 w-4" />
                    Adicionar Imagem
                </Button>
            </div>

            {/* Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`
                    border-2 border-dashed rounded-xl p-12 text-center mb-8 transition-all
                    ${dragOver
                        ? 'border-[#d4a574] bg-[#f1c595]/10'
                        : 'border-[#e8e0d5] hover:border-[#d4a574]'
                    }
                    ${uploading ? 'opacity-50 pointer-events-none' : ''}
                `}
            >
                {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 text-[#d4a574] animate-spin" />
                        <p className="text-[#8a5c3f]">Fazendo upload...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <ImageIcon className="h-10 w-10 text-[#d4a574]" />
                        <p className="text-[#8a5c3f]">
                            Arraste imagens aqui ou clique no botão acima
                        </p>
                        <p className="text-xs text-[#b0a090]">
                            Suporta JPG, PNG, WebP • Máximo 10MB por imagem
                        </p>
                    </div>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 text-[#d4a574] animate-spin" />
                </div>
            )}

            {/* Empty State */}
            {!loading && images.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-[#e8e0d5]">
                    <ImageIcon className="h-12 w-12 text-[#d4a574] mx-auto mb-4" />
                    <p className="text-[#8a5c3f] mb-2">Nenhuma imagem na galeria</p>
                    <p className="text-sm text-[#b0a090]">
                        Faça upload de imagens para exibir na homepage
                    </p>
                </div>
            )}

            {/* Gallery Grid */}
            {!loading && images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((image) => (
                        <div
                            key={image.id}
                            draggable
                            onDragStart={() => handleDragStart(image)}
                            onDragOver={(e) => handleDragOver(e, image.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={() => handleDropReorder(image)}
                            onDragEnd={handleDragEnd}
                            className={`bg-white rounded-xl border-2 transition-all cursor-move ${dragOverItem === image.id
                                ? 'border-[#d4a574] scale-105 shadow-xl'
                                : 'border-[#e8e0d5]'
                                } ${draggedItem?.id === image.id ? 'opacity-50' : 'opacity-100'}`}
                        >
                            {/* Drag Handle + Image */}
                            <div className="relative">
                                {/* Drag Handle Icon */}
                                <div className="absolute top-2 left-2 z-10 bg-white/90 p-1.5 rounded-lg shadow-md cursor-move">
                                    <GripVertical className="h-5 w-5 text-[#8a5c3f]" />
                                </div>

                                {/* Image */}
                                <div className="relative aspect-square">
                                    <Image
                                        src={image.imageUrl}
                                        alt={image.caption || 'Imagem da galeria'}
                                        fill
                                        className="object-cover rounded-t-xl"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons - External */}
                            <div className="p-3 border-t border-[#e8e0d5] bg-[#faf8f5]">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    {image.permalink ? (
                                        <a
                                            href={image.permalink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-[#e8e0d5] rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                        >
                                            <ExternalLink className="h-4 w-4 text-[#8a5c3f]" />
                                            <span className="text-[#2a2a2a]">Ver Post</span>
                                        </a>
                                    ) : (
                                        <button
                                            onClick={() => startEditing(image)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#d4a574] text-white rounded-lg hover:bg-[#c49464] transition-colors text-sm"
                                        >
                                            Adicionar Link
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(image.id)}
                                        className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </button>
                                </div>

                                {/* Caption/Edit */}
                                {editingId === image.id ? (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Legenda..."
                                            value={editForm.caption}
                                            onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                                            className="w-full px-3 py-2 border border-[#e0d5c7] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Link Instagram (opcional)"
                                            value={editForm.permalink}
                                            onChange={(e) => setEditForm({ ...editForm, permalink: e.target.value })}
                                            className="w-full px-3 py-2 border border-[#e0d5c7] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleEditSave}
                                                className="flex-1 bg-[#2a2a2a] text-white py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-[#1a1a1a] text-sm"
                                            >
                                                <Check className="h-4 w-4" />
                                                Salvar
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-4 py-2 border border-[#e0d5c7] rounded-lg hover:bg-gray-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => startEditing(image)}
                                        className="cursor-pointer hover:bg-white rounded-lg p-2 -m-2 transition-colors"
                                    >
                                        <p className="text-xs text-[#2a2a2a] line-clamp-2">
                                            {image.caption || 'Clique para adicionar legenda...'}
                                        </p>
                                        {image.permalink && (
                                            <p className="text-xs text-[#d4a574] truncate mt-1">
                                                📸 {image.permalink}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Media Picker Modal */}
            <MediaPicker
                open={showMediaPicker}
                onClose={() => setShowMediaPicker(false)}
                onSelect={async (url) => {
                    try {
                        const res = await fetch('/api/admin/gallery', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                imageUrl: url,
                                caption: '',
                            }),
                        })
                        const data = await res.json()
                        if (data.success) {
                            toast.success('Imagem adicionada!')
                            fetchImages()
                        } else {
                            toast.error('Erro ao salvar')
                        }
                    } catch (error) {
                        toast.error('Erro ao adicionar imagem')
                    }
                }}
                folder="gallery/"
            />
        </AdminLayout>
    )
}
