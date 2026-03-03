const ALLOWED_IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
]

const MODERN_OUTPUT_FORMATS = [
    { mimeType: 'image/avif', extension: 'avif' },
    { mimeType: 'image/webp', extension: 'webp' },
] as const

const MAX_OUTPUT_DIMENSION = 2200
const QUALITY_STEPS = [0.82, 0.74, 0.66, 0.58]
const TARGET_OPTIMIZED_BYTES = 4 * 1024 * 1024

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

export function validateImageUpload(file: File): string | null {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
        return 'Formato não suportado. Use JPG, PNG, WebP, GIF ou AVIF.'
    }

    return null
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
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) return file

    try {
        const bitmap = await createImageBitmap(file)

        const maxDimension = Math.max(bitmap.width, bitmap.height)
        const scale = maxDimension > MAX_OUTPUT_DIMENSION ? MAX_OUTPUT_DIMENSION / maxDimension : 1
        const targetWidth = Math.max(1, Math.round(bitmap.width * scale))
        const targetHeight = Math.max(1, Math.round(bitmap.height * scale))

        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight

        const context = canvas.getContext('2d', { alpha: false })
        if (!context) {
            bitmap.close()
            return file
        }

        context.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
        bitmap.close()

        for (const output of MODERN_OUTPUT_FORMATS) {
            let bestBlob: Blob | null = null

            for (const quality of QUALITY_STEPS) {
                const blob = await canvasToBlob(canvas, output.mimeType, quality)
                if (!blob) break

                if (!bestBlob || blob.size < bestBlob.size) {
                    bestBlob = blob
                }

                if (blob.size <= TARGET_OPTIMIZED_BYTES) {
                    return new File(
                        [blob],
                        buildOptimizedFilename(file.name, output.extension),
                        { type: output.mimeType, lastModified: Date.now() }
                    )
                }
            }

            if (bestBlob) {
                return new File(
                    [bestBlob],
                    buildOptimizedFilename(file.name, output.extension),
                    { type: output.mimeType, lastModified: Date.now() }
                )
            }
        }

        return file
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
            normalizedBody.includes('payload too large')
        ) {
            return {
                success: false,
                error: 'Falha no upload pelo proxy. A imagem já foi otimizada, tente novamente.',
            }
        }

        return {
            success: false,
            error: `Falha no upload (HTTP ${response.status})`,
        }
    }
}
