'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import {
    Upload, Trash2, FolderIcon, ImageIcon, Loader2,
    Search, Filter, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'

interface MediaFile {
    key: string
    size: number
    lastModified: Date
    url: string
}

const FOLDERS = [
    { value: '', label: 'Todos' },
    { value: 'menu/', label: '🍽️ Cardápio' },
    { value: 'cabins/', label: '🏖️ Bangalôs' },
    { value: 'gallery/', label: '📸 Galeria' },
    { value: 'eventos/', label: '🎉 Eventos' },
]

export default function AdminMediaPage() {
    const [files, setFiles] = useState<MediaFile[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [selectedFolder, setSelectedFolder] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetchFiles()
    }, [selectedFolder])

    const fetchFiles = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/media?folder=${selectedFolder}`)
            const data = await res.json()

            if (data.success) {
                setFiles(data.data.files)
            }
        } catch (error) {
            console.error('Error fetching files:', error)
            toast.error('Erro ao carregar arquivos')
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return

        setUploading(true)

        for (const file of Array.from(fileList)) {
            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('folder', selectedFolder.replace('/', ''))

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                const data = await res.json()

                if (data.success) {
                    toast.success(`${file.name} convertido e enviado!`)
                } else {
                    toast.error(`Erro: ${file.name}`)
                }
            } catch (error) {
                console.error('Upload error:', error)
                toast.error(`Erro ao enviar ${file.name}`)
            }
        }

        setUploading(false)
        fetchFiles()
    }

    const handleDelete = async (key: string) => {
        if (!confirm('Tem certeza que deseja deletar este arquivo?')) return

        try {
            const res = await fetch('/api/admin/media/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key }),
            })

            const data = await res.json()

            if (data.success) {
                toast.success('Arquivo deletado')
                setFiles(files.filter((f: MediaFile) => f.key !== key))
            } else {
                toast.error('Erro ao deletar')
            }
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Erro ao deletar')
        }
    }

    const handleBulkDelete = async () => {
        if (selectedFiles.size === 0) return
        if (!confirm(`Deletar ${selectedFiles.size} arquivo(s)?`)) return

        for (const key of selectedFiles) {
            await handleDelete(key)
        }

        setSelectedFiles(new Set())
    }

    const toggleFileSelection = (key: string) => {
        const newSelected = new Set(selectedFiles)
        if (newSelected.has(key)) {
            newSelected.delete(key)
        } else {
            newSelected.add(key)
        }
        setSelectedFiles(newSelected)
    }

    const filteredFiles = files.filter(file =>
        file.key.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const isImage = (key: string) => {
        return /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(key)
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Mídia R2</h1>
                    <p className="text-[#8a5c3f]">
                        Todos arquivos são convertidos para AVIF e otimizados automaticamente
                    </p>
                </div>
                <div>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        id="media-upload"
                        onChange={(e) => handleUpload(e.target.files)}
                        disabled={uploading}
                    />
                    <label htmlFor="media-upload">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${uploading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#2a2a2a] text-white hover:bg-[#1a1a1a]'
                            }`}>
                            <Upload className="h-4 w-4" />
                            {uploading ? 'Enviando...' : 'Upload'}
                        </span>
                    </label>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8a5c3f]" />
                        <input
                            type="text"
                            placeholder="Buscar arquivo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e0d5c7] focus:ring-2 focus:ring-[#d4a574] focus:border-[#d4a574]"
                        />
                    </div>
                </div>
                <select
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-[#e0d5c7] bg-white focus:ring-2 focus:ring-[#d4a574]"
                >
                    {FOLDERS.map(folder => (
                        <option key={folder.value} value={folder.value}>
                            {folder.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Bulk Actions */}
            {selectedFiles.size > 0 && (
                <div className="bg-[#f5f0e8] rounded-lg p-4 mb-6 flex items-center justify-between">
                    <span className="text-[#2a2a2a]">
                        {selectedFiles.size} arquivo(s) selecionado(s)
                    </span>
                    <Button variant="destructive" onClick={handleBulkDelete}>
                        <Trash2 className="h-4 w-4" />
                        Deletar Selecionados
                    </Button>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 text-[#d4a574] animate-spin" />
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredFiles.length === 0 && (
                <Card>
                    <CardContent className="py-20 text-center">
                        <ImageIcon className="h-12 w-12 text-[#d4a574] mx-auto mb-4" />
                        <p className="text-[#8a5c3f]">Nenhum arquivo encontrado</p>
                    </CardContent>
                </Card>
            )}

            {/* Grid */}
            {!loading && filteredFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredFiles.map((file) => (
                        <Card key={file.key} className="group relative">
                            <CardContent className="p-0">
                                {/* Checkbox */}
                                <div className="absolute top-2 left-2 z-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedFiles.has(file.key)}
                                        onChange={() => toggleFileSelection(file.key)}
                                        className="w-5 h-5 rounded border-gray-300 text-[#d4a574] focus:ring-[#d4a574]"
                                    />
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={() => handleDelete(file.key)}
                                    className="absolute top-2 right-2 z-10 p-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="h-4 w-4 text-white" />
                                </button>

                                {/* Preview */}
                                {isImage(file.key) ? (
                                    <div className="relative aspect-square">
                                        <Image
                                            src={file.url}
                                            alt={file.key}
                                            fill
                                            className="object-cover rounded-t-lg"
                                        />
                                    </div>
                                ) : (
                                    <div className="aspect-square bg-[#f5f0e8] rounded-t-lg flex items-center justify-center">
                                        <FolderIcon className="h-12 w-12 text-[#d4a574]" />
                                    </div>
                                )}

                                {/* Info */}
                                <div className="p-3">
                                    <p className="text-xs text-[#2a2a2a] truncate" title={file.key}>
                                        {file.key.split('/').pop()}
                                    </p>
                                    <p className="text-xs text-[#8a5c3f] mt-1">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Stats */}
            {!loading && filteredFiles.length > 0 && (
                <div className="mt-8 text-center text-sm text-[#8a5c3f]">
                    {filteredFiles.length} arquivo(s) • Total:{' '}
                    {formatFileSize(filteredFiles.reduce((sum: number, f: MediaFile) => sum + f.size, 0))}
                </div>
            )}
        </AdminLayout>
    )
}
