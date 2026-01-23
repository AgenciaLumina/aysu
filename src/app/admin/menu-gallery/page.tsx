// AISSU Beach Lounge - Admin Galeria do Menu (com seleção múltipla)
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Trash2, Upload, ImageIcon, Loader2, Check, X, FolderOpen } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

interface MenuGalleryImage {
    id: string
    imageUrl: string
    caption: string | null
    displayOrder: number
    isActive: boolean
}

interface MediaFile {
    key: string
    url: string
    size: number
}

const FOLDERS = [
    { value: '', label: '📁 Todas' },
    { value: 'menu/', label: '🍽️ Menu' },
    { value: 'gallery/', label: '📸 Galeria' },
]

export default function AdminMenuGalleryPage() {
    const [images, setImages] = useState<MenuGalleryImage[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)

    // Multi-select state for R2 browser
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
    const [loadingMedia, setLoadingMedia] = useState(false)
    const [selectedUrls, setSelectedUrls] = useState<string[]>([])
    const [currentFolder, setCurrentFolder] = useState('')

    useEffect(() => { fetchImages() }, [])

    async function fetchImages() {
        try {
            const res = await fetch('/api/admin/menu-gallery')
            const data = await res.json()
            if (data.success) {
                setImages(data.data)
            }
        } catch {
            toast.error('Erro ao carregar galeria')
        } finally {
            setLoading(false)
        }
    }

    async function fetchMediaFiles(folder: string) {
        setLoadingMedia(true)
        try {
            const res = await fetch(`/api/admin/media?folder=${folder}&limit=200`)
            const data = await res.json()
            if (data.success) {
                const imageFiles = data.data.files.filter((f: MediaFile) =>
                    f.key.match(/\.(jpg|jpeg|png|webp|avif)$/i)
                )
                setMediaFiles(imageFiles)
            }
        } catch {
            toast.error('Erro ao carregar mídia')
        } finally {
            setLoadingMedia(false)
        }
    }

    const handleOpenModal = () => {
        setSelectedUrls([])
        setIsModalOpen(true)
        fetchMediaFiles(currentFolder)
    }

    const toggleImageSelection = (url: string) => {
        setSelectedUrls(prev =>
            prev.includes(url)
                ? prev.filter(u => u !== url)
                : [...prev, url]
        )
    }

    const handleFolderChange = (folder: string) => {
        setCurrentFolder(folder)
        fetchMediaFiles(folder)
    }

    const handleSubmit = async () => {
        if (selectedUrls.length === 0) {
            toast.error('Selecione pelo menos uma imagem')
            return
        }

        setSaving(true)
        try {
            const res = await fetch('/api/admin/menu-gallery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: selectedUrls.map(url => ({ imageUrl: url }))
                })
            })

            const data = await res.json()
            if (data.success) {
                toast.success(`${data.count} imagem(ns) adicionada(s)!`)
                setIsModalOpen(false)
                setSelectedUrls([])
                fetchImages()
            } else {
                toast.error(data.error || 'Erro ao adicionar')
            }
        } catch {
            toast.error('Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Remover esta imagem da galeria?')) return

        setDeleting(id)
        try {
            const res = await fetch(`/api/admin/menu-gallery/${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success('Imagem removida!')
                fetchImages()
            } else {
                toast.error('Erro ao remover')
            }
        } catch {
            toast.error('Erro ao remover')
        } finally {
            setDeleting(null)
        }
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Galeria do Menu</h1>
                    <p className="text-[#8a5c3f]">Imagens que aparecem na página Cardápio</p>
                </div>
                <Button onClick={handleOpenModal}>
                    <Plus className="h-4 w-4" />
                    Adicionar Imagens
                </Button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : images.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <ImageIcon className="h-12 w-12 text-[#e0d5c7] mx-auto mb-4" />
                        <p className="text-[#8a5c3f] mb-4">Nenhuma imagem na galeria do menu</p>
                        <Button onClick={handleOpenModal}>
                            <Plus className="h-4 w-4" />
                            Adicionar Imagens
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {images.map((image) => (
                        <Card key={image.id} className="overflow-hidden group">
                            <div className="relative aspect-square">
                                <Image
                                    src={image.imageUrl}
                                    alt={image.caption || 'Menu item'}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleDelete(image.id)}
                                        disabled={deleting === image.id}
                                        className="bg-red-500 hover:bg-red-600 text-white border-none"
                                    >
                                        {deleting === image.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                            {image.caption && (
                                <div className="p-2 bg-white">
                                    <p className="text-xs text-[#8a5c3f] truncate">{image.caption}</p>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            <p className="text-center text-sm text-[#8a5c3f] mt-6">
                💡 Dica: As imagens aparecem na página /cardapio do site
            </p>

            {/* Modal de Seleção Múltipla */}
            <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
                <ModalContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                    <ModalHeader>
                        <ModalTitle>Selecionar Imagens do R2</ModalTitle>
                    </ModalHeader>

                    <div className="p-4">
                        {/* Pasta Filter */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            <span className="text-sm text-[#8a5c3f] self-center">Pasta:</span>
                            {FOLDERS.map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => handleFolderChange(f.value)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${currentFolder === f.value
                                            ? 'bg-[#d4a574] text-white'
                                            : 'bg-[#f5f0eb] text-[#8a5c3f] hover:bg-[#e0d5c7]'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Selection Info */}
                        {selectedUrls.length > 0 && (
                            <div className="flex items-center gap-2 mb-4 p-2 bg-[#d4a574]/10 rounded-lg">
                                <Check className="h-4 w-4 text-[#d4a574]" />
                                <span className="text-sm text-[#8a5c3f]">
                                    {selectedUrls.length} imagem(ns) selecionada(s)
                                </span>
                                <button
                                    onClick={() => setSelectedUrls([])}
                                    className="ml-auto text-xs text-[#8a5c3f] hover:text-[#d4a574]"
                                >
                                    Limpar seleção
                                </button>
                            </div>
                        )}

                        {/* Grid */}
                        <div className="max-h-[50vh] overflow-y-auto">
                            {loadingMedia ? (
                                <div className="flex justify-center py-16">
                                    <Spinner size="lg" />
                                </div>
                            ) : mediaFiles.length === 0 ? (
                                <div className="text-center py-16 text-[#8a5c3f]">
                                    <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>Nenhuma imagem encontrada</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                    {mediaFiles.map((file) => {
                                        const isSelected = selectedUrls.includes(file.url)
                                        return (
                                            <div
                                                key={file.key}
                                                onClick={() => toggleImageSelection(file.url)}
                                                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${isSelected
                                                        ? 'border-[#d4a574] ring-2 ring-[#d4a574]/50'
                                                        : 'border-transparent hover:border-[#e0d5c7]'
                                                    }`}
                                            >
                                                <Image
                                                    src={file.url}
                                                    alt={file.key}
                                                    fill
                                                    className="object-cover"
                                                    sizes="150px"
                                                />
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#d4a574] rounded-full flex items-center justify-center">
                                                        <Check className="h-4 w-4 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <ModalFooter className="p-4 border-t">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            isLoading={saving}
                            disabled={selectedUrls.length === 0}
                        >
                            Adicionar {selectedUrls.length > 0 ? `(${selectedUrls.length})` : ''}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </AdminLayout>
    )
}
