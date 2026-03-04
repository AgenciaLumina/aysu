const ALLOWED_IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence',
]

const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'heic', 'heif']

const MODERN_OUTPUT_FORMATS = [
    { mimeType: 'image/avif', extension: 'avif' },
    { mimeType: 'image/webp', extension: 'webp' },
    { mimeType: 'image/jpeg', extension: 'jpg' },
] as const

const MAX_OUTPUT_DIMENSION = 2200
const RESIZE_STEPS = [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.42, 0.35]
const QUALITY_STEPS = [0.82, 0.74, 0.66, 0.58, 0.5, 0.42, 0.34, 0.28]
const TARGET_OPTIMIZED_BYTES = 4 * 1024 * 1024
const TARGET_OPTIMIZED_LABEL = '4 MB'

export type UploadApiResponse = {
    success?: boolean
    error?: string
    data?: {
        url?: string
        key?: string
        size?: number
        originalSize?: number
        compressionRatio?: number
    }
}

function formatSizeInMb(bytes: number): string {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileExtension(filename: string): string {
    const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/)
    return match ? match[1] : ''
}

function isAcceptedImageFile(file: File): boolean {
    if (ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) return true

    const extension = getFileExtension(file.name)
    return ALLOWED_IMAGE_EXTENSIONS.includes(extension)
}

export function validateImageUpload(file: File): string | null {
    if (!isAcceptedImageFile(file)) {
        return 'Formato não suportado. Use JPG, PNG, WebP, GIF, AVIF, HEIC ou HEIF.'
    }

    return null
}

export function getLargeImageWarning(file: File): string | null {
    if (file.size <= TARGET_OPTIMIZED_BYTES) return null
    return `Imagem grande detectada (${formatSizeInMb(file.size)}). Vamos otimizar automaticamente antes do envio para caber no limite da Vercel (${TARGET_OPTIMIZED_LABEL}).`
}

export function getUploadPayloadError(file: File): string | null {
    if (file.size <= TARGET_OPTIMIZED_BYTES) return null
    return `Após otimização, o arquivo ficou com ${formatSizeInMb(file.size)} e ainda excede o limite de upload da Vercel (${TARGET_OPTIMIZED_LABEL}). Reduza a resolução/qualidade e tente novamente.`
}

function buildOptimizedFilename(originalName: string, extension: string): string {
    const baseName = originalName
        .replace(/\.[^/.]+$/, '')
        .trim()
        .replace(/[^\w-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()

    return `${baseName || 'imagem'}-${Date.now()}.${extension}`
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob | null> {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), mimeType, quality)
    })
}

export async function optimizeImageBeforeUpload(file: File): Promise<File> {
    if (typeof window === 'undefined') return file
    if (file.size <= TARGET_OPTIMIZED_BYTES) return file

    try {
        const bitmap = await createImageBitmap(file)
        try {
            const maxDimension = Math.max(bitmap.width, bitmap.height)
            const baseScale = maxDimension > MAX_OUTPUT_DIMENSION ? MAX_OUTPUT_DIMENSION / maxDimension : 1
            let bestCandidate: { blob: Blob; output: (typeof MODERN_OUTPUT_FORMATS)[number] } | null = null

            for (const resizeStep of RESIZE_STEPS) {
                const scale = baseScale * resizeStep
                const targetWidth = Math.max(1, Math.round(bitmap.width * scale))
                const targetHeight = Math.max(1, Math.round(bitmap.height * scale))

                const canvas = document.createElement('canvas')
                canvas.width = targetWidth
                canvas.height = targetHeight

                const context = canvas.getContext('2d', { alpha: false })
                if (!context) continue

                context.drawImage(bitmap, 0, 0, targetWidth, targetHeight)

                for (const output of MODERN_OUTPUT_FORMATS) {
                    for (const quality of QUALITY_STEPS) {
                        const blob = await canvasToBlob(canvas, output.mimeType, quality)
                        if (!blob) continue

                        if (!bestCandidate || blob.size < bestCandidate.blob.size) {
                            bestCandidate = { blob, output }
                        }

                        if (blob.size <= TARGET_OPTIMIZED_BYTES) {
                            return new File(
                                [blob],
                                buildOptimizedFilename(file.name, output.extension),
                                { type: output.mimeType, lastModified: Date.now() }
                            )
                        }
                    }
                }
            }

            if (bestCandidate) {
                return new File(
                    [bestCandidate.blob],
                    buildOptimizedFilename(file.name, bestCandidate.output.extension),
                    { type: bestCandidate.output.mimeType, lastModified: Date.now() }
                )
            }

            return file
        } finally {
            bitmap.close()
        }
    } catch {
        return file
    }
}

export async function readUploadApiResponse(response: Response): Promise<UploadApiResponse> {
    const bodyText = await response.text()

    if (!bodyText) {
        return {
            success: false,
            error: `Falha no upload (HTTP ${response.status})`,
        }
    }

    try {
        return JSON.parse(bodyText) as UploadApiResponse
    } catch {
        const normalizedBody = bodyText.toLowerCase()

        if (
            response.status === 413 ||
            normalizedBody.includes('request entity too large') ||
            normalizedBody.includes('body exceeded') ||
            normalizedBody.includes('payload too large') ||
            normalizedBody.includes('entity too large') ||
            normalizedBody.includes('request body too large') ||
            normalizedBody.includes('function_payload_too_large')
        ) {
            return {
                success: false,
                error: `Upload bloqueado por limite de payload da Vercel/proxy. Reduza a imagem para até ${TARGET_OPTIMIZED_LABEL} (ou converta para JPG/WebP/AVIF) e tente novamente.`,
            }
        }

        return {
            success: false,
            error: `Falha no upload (HTTP ${response.status})`,
        }
    }
}
