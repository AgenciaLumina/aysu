// Media Picker Component - Escolher entre Upload ou Selecionar do R2
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Upload, FolderOpen, X, Check, Loader2 } from 'lucide-react'
import { Modal, ModalContent, ModalHeader, ModalTitle } from './Modal'
import { Button } from './Button'
import toast from 'react-hot-toast'

interface MediaFile {
    key: string
    url: string
    size: number
    lastModified: Date
}

interface MediaPickerProps {
    open: boolean
    onClose: () => void
    onSelect: (url: string) => void
    folder?: string
}

export function MediaPicker({ open, onClose, onSelect, folder = '' }: MediaPickerProps) {
    const [mode, setMode] = useState<'upload' | 'browse'>('upload')
    const [files, setFiles] = useState<MediaFile[]>([])
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null)

    useEffect(() => {
        if (open && mode === 'browse') {
            fetchMediaFiles()
        }
    }, [open, mode, folder])

    const fetchMediaFiles = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/media?folder=${folder}`)
            const data = await res.json()
            if (data.success) {
                // Filtrar apenas imagens
                const imageFiles = data.data.files.filter((f: MediaFile) =>
                    f.key.match(/\.(jpg|jpeg|png|webp|avif)$/i)
                )
                setFiles(imageFiles)
            }
        } catch (error) {
            toast.error('Erro ao carregar arquivos')
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return

        setUploading(true)
        const file = fileList[0] // Pegar apenas o primeiro

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', folder.replace('/', ''))

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (data.success) {
                toast.success('Upload concluído!')
                onSelect(data.data.url)
                onClose()
            } else {
                toast.error('Erro no upload')
            }
        } catch (error) {
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

    return (
        <Modal open={open} onOpenChange={onClose}>
            <ModalContent className="max-w-4xl">
                <ModalHeader>
                    <ModalTitle>Selecionar Imagem</ModalTitle>
                </ModalHeader>

                <div className="p-6">
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
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#d4a574]" />
                                </div>
                            ) : files.length === 0 ? (
                                <div className="text-center py-12 text-[#8a5c3f]">
                                    Nenhuma imagem encontrada nesta pasta
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-4 gap-4 max-h-[400px] overflow-y-auto">
                                        {files.map((file) => (
                                            <div
                                                key={file.key}
                                                onClick={() => setSelectedUrl(file.url)}
                                                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedUrl === file.url
                                                        ? 'border-[#d4a574] ring-2 ring-[#d4a574]/30'
                                                        : 'border-transparent hover:border-[#e0d5c7]'
                                                    }`}
                                            >
                                                <Image
                                                    src={file.url}
                                                    alt={file.key}
                                                    fill
                                                    className="object-cover"
                                                />
                                                {selectedUrl === file.url && (
                                                    <div className="absolute inset-0 bg-[#d4a574]/20 flex items-center justify-center">
                                                        <Check className="h-8 w-8 text-white drop-shadow-lg" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
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
