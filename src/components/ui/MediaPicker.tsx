// Media Picker Component - Escolher entre Upload ou Selecionar do R2
'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Upload, FolderOpen, Check, Loader2, ImageIcon } from 'lucide-react'
import { Modal, ModalContent, ModalHeader, ModalTitle } from './Modal'
import { Button } from './Button'
import toast from 'react-hot-toast'
import {
    getLargeImageWarning,
    getUploadPayloadError,
    optimizeImageBeforeUpload,
    readUploadApiResponse,
    validateImageUpload,
} from '@/lib/upload-client'

interface MediaFile {
    key: string
    url: string
    size: number
    lastModified: string
}

interface MediaPickerProps {
    open: boolean
    onClose: () => void
    onSelect: (url: string) => void
    defaultFolder?: string
    initialMode?: 'upload' | 'browse'
}

const FOLDERS = [
    { value: '', label: '📁 Todas as pastas' },
    { value: 'menu/', label: '🍽️ Cardápio' },
    { value: 'cabins/', label: '🏖️ Bangalôs' },
    { value: 'gallery/', label: '📸 Galeria' },
    { value: 'galeria-eventos/', label: '🎉 Galeria de Eventos' },
]

function formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatFileDate(value: string): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Data indisponível'
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function getFileLabel(key: string): string {
    return key.split('/').pop() || key
}

export function MediaPicker({
    open,
    onClose,
    onSelect,
    defaultFolder = '',
    initialMode = 'upload',
}: MediaPickerProps) {
    const [mode, setMode] = useState<'upload' | 'browse'>(initialMode)
    const [files, setFiles] = useState<MediaFile[]>([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null)
    const [currentFolder, setCurrentFolder] = useState(defaultFolder)

    useEffect(() => {
        if (!open) return
        setMode(initialMode)
        setCurrentFolder(defaultFolder)
        setSelectedUrl(null)
    }, [open, defaultFolder, initialMode])

    const fetchMediaFiles = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/media?folder=${currentFolder}&limit=200`)
            const data = await res.json()
            if (data.success) {
                // Filtrar apenas imagens
                const imageFiles = data.data.files.filter((f: MediaFile) =>
                    f.key.match(/\.(jpg|jpeg|png|webp|avif)$/i)
                )
                setFiles(imageFiles)
            } else {
                toast.error('Erro ao carregar: ' + (data.error || 'desconhecido'))
            }
        } catch (error) {
            console.error('Fetch error:', error)
            toast.error('Erro ao carregar arquivos')
        } finally {
            setLoading(false)
        }
    }, [currentFolder])

    useEffect(() => {
        if (open && mode === 'browse') {
            fetchMediaFiles()
        }
    }, [open, mode, fetchMediaFiles])

    useEffect(() => {
        if (mode === 'browse') {
            setSelectedUrl(null)
        }
    }, [currentFolder, mode])

    const handleUpload = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return

        setUploading(true)
        const file = fileList[0]

        try {
            const validationError = validateImageUpload(file)
            if (validationError) {
                toast.error(validationError)
                return
            }

            const largeImageWarning = getLargeImageWarning(file)
            if (largeImageWarning) {
                toast(largeImageWarning)
            }

            const optimizedFile = await optimizeImageBeforeUpload(file)
            const payloadError = getUploadPayloadError(optimizedFile)
            if (payloadError) {
                toast.error(payloadError)
                return
            }

            const normalizedFolder = currentFolder.trim().replace(/^\/+|\/+$/g, '')
            const formData = new FormData()
            formData.append('file', optimizedFile)
            formData.append('folder', normalizedFolder || 'gallery')

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await readUploadApiResponse(res)

            const uploadedUrl = data.data?.url
            if (res.ok && data.success && typeof uploadedUrl === 'string' && uploadedUrl) {
                toast.success('Upload concluído!')
                onSelect(uploadedUrl)
                onClose()
            } else {
                toast.error('Erro no upload: ' + (data.error || 'desconhecido'))
            }
        } catch {
            toast.error('Erro ao fazer upload')
        } finally {
            setUploading(false)
        }
    }

    const handleConfirm = () => {
        if (!selectedUrl) return
        onSelect(selectedUrl)
        onClose()
    }

    const selectedFile = files.find((file) => file.url === selectedUrl) || null

    return (
        <Modal open={open} onOpenChange={onClose}>
            <ModalContent className="max-w-6xl max-h-[92vh] overflow-hidden p-0">
                <ModalHeader className="border-b border-[#eadfce] px-6 py-5">
                    <ModalTitle>Selecionar Imagem</ModalTitle>
                </ModalHeader>

                <div className="overflow-y-auto p-6">
                    {/* Mode Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-[#e0d5c7]">
                        <button
                            onClick={() => setMode('upload')}
                            className={`px-4 py-2 font-medium transition-colors ${mode === 'upload'
                                ? 'text-[#d4a574] border-b-2 border-[#d4a574]'
                                : 'text-[#8a5c3f] hover:text-[#d4a574]'
                                }`}
                        >
                            <Upload className="h-4 w-4 inline mr-2" />
                            Fazer Upload
                        </button>
                        <button
                            onClick={() => setMode('browse')}
                            className={`px-4 py-2 font-medium transition-colors ${mode === 'browse'
                                ? 'text-[#d4a574] border-b-2 border-[#d4a574]'
                                : 'text-[#8a5c3f] hover:text-[#d4a574]'
                                }`}
                        >
                            <FolderOpen className="h-4 w-4 inline mr-2" />
                            Explorar R2
                        </button>
                    </div>

                    {/* Upload Mode */}
                    {mode === 'upload' && (
                        <div className="space-y-4">
                            {/* Folder selector for upload */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-[#8a5c3f]">Salvar em:</span>
                                <select
                                    value={currentFolder}
                                    onChange={(e) => setCurrentFolder(e.target.value)}
                                    className="px-3 py-1.5 rounded-lg border border-[#e0d5c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                                >
                                    {FOLDERS.filter(f => f.value !== '').map(f => (
                                        <option key={f.value} value={f.value}>{f.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="border-2 border-dashed border-[#e0d5c7] rounded-xl p-12 text-center hover:border-[#d4a574] transition-colors">
                                <input
                                    type="file"
                                    id="media-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleUpload(e.target.files)}
                                    disabled={uploading}
                                />
                                <label
                                    htmlFor="media-upload"
                                    className="cursor-pointer block"
                                >
                                    {uploading ? (
                                        <Loader2 className="h-12 w-12 text-[#d4a574] mx-auto mb-4 animate-spin" />
                                    ) : (
                                        <Upload className="h-12 w-12 text-[#d4a574] mx-auto mb-4" />
                                    )}
                                    <p className="text-[#2a2a2a] font-medium mb-2">
                                        {uploading ? 'Fazendo upload...' : 'Clique para selecionar'}
                                    </p>
                                    <p className="text-sm text-[#8a5c3f]">
                                        Será convertido para AVIF automaticamente
                                    </p>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Browse Mode */}
                    {mode === 'browse' && (
                        <div className="space-y-4">
                            {/* Folder selector */}
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                <span className="text-sm text-[#8a5c3f]">Pasta:</span>
                                <div className="flex flex-wrap gap-2">
                                    {FOLDERS.map(f => (
                                        <button
                                            key={f.value}
                                            onClick={() => setCurrentFolder(f.value)}
                                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${currentFolder === f.value
                                                    ? 'bg-[#d4a574] text-white'
                                                    : 'bg-[#f5f0eb] text-[#8a5c3f] hover:bg-[#e0d5c7]'
                                                }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#d4a574]" />
                                </div>
                            ) : files.length === 0 ? (
                                <div className="text-center py-12 text-[#8a5c3f]">
                                    <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Nenhuma imagem encontrada</p>
                                    <p className="text-sm mt-2">Tente selecionar outra pasta ou faça upload</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-[#8a5c3f]">{files.length} imagens encontradas</p>
                                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)]">
                                        <div className="rounded-2xl border border-[#eadfce] bg-[#fcfaf7] p-3">
                                            <div className="grid max-h-[52vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
                                                {files.map((file) => (
                                                    <button
                                                        key={file.key}
                                                        type="button"
                                                        onClick={() => setSelectedUrl(file.url)}
                                                        className={`group overflow-hidden rounded-2xl border bg-white text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#d4a574] focus:ring-offset-2 ${selectedUrl === file.url
                                                                ? 'border-[#d4a574] shadow-md shadow-[#d4a574]/15'
                                                                : 'border-[#efe7dc] hover:border-[#d8bea3] hover:shadow-sm'
                                                            }`}
                                                    >
                                                        <div className="relative aspect-[4/5] bg-[#f2e9df]">
                                                            <Image
                                                                src={file.url}
                                                                alt={getFileLabel(file.key)}
                                                                fill
                                                                unoptimized
                                                                className="object-cover"
                                                                sizes="(max-width: 768px) 45vw, (max-width: 1280px) 30vw, 220px"
                                                            />
                                                            {selectedUrl === file.url && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-[#2a2a2a]/20">
                                                                    <span className="rounded-full bg-white/95 p-2 text-[#8a5c3f] shadow-lg">
                                                                        <Check className="h-5 w-5" />
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-1 px-3 py-2">
                                                            <p className="truncate text-xs font-medium text-[#2a2a2a]">
                                                                {getFileLabel(file.key)}
                                                            </p>
                                                            <p className="text-[11px] text-[#8a5c3f]">
                                                                {formatFileSize(file.size)}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-[#eadfce] bg-white p-4">
                                            {selectedFile ? (
                                                <div className="space-y-4">
                                                    <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl bg-[#f7f0e8]">
                                                        <Image
                                                            src={selectedFile.url}
                                                            alt={getFileLabel(selectedFile.key)}
                                                            fill
                                                            unoptimized
                                                            className="object-contain"
                                                            sizes="(max-width: 1024px) 90vw, 360px"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <p className="break-all text-sm font-medium text-[#2a2a2a]">
                                                            {getFileLabel(selectedFile.key)}
                                                        </p>
                                                        <p className="text-xs text-[#8a5c3f]">
                                                            Caminho: {selectedFile.key}
                                                        </p>
                                                        <p className="text-xs text-[#8a5c3f]">
                                                            Tamanho: {formatFileSize(selectedFile.size)}
                                                        </p>
                                                        <p className="text-xs text-[#8a5c3f]">
                                                            Atualizado: {formatFileDate(selectedFile.lastModified)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#e6d8c6] bg-[#fcfaf7] px-6 text-center text-[#8a5c3f]">
                                                    <ImageIcon className="mb-4 h-10 w-10 text-[#d4a574]" />
                                                    <p className="font-medium text-[#2a2a2a]">Selecione uma imagem</p>
                                                    <p className="mt-2 text-sm">
                                                        A prévia maior aparece aqui para evitar distorções e facilitar a escolha.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-4 border-t border-[#e0d5c7]">
                                        <Button variant="secondary" onClick={onClose}>
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={handleConfirm}
                                            disabled={!selectedUrl}
                                        >
                                            Confirmar Seleção
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </ModalContent>
        </Modal>
    )
}
