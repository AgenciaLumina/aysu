import { inspectAvif, MAX_IMAGE_UPLOAD_BYTES } from './image-upload'

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

const TARGET_OPTIMIZED_BYTES = MAX_IMAGE_UPLOAD_BYTES
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
    return `Imagem grande detectada (${formatSizeInMb(file.size)}). Vamos otimizar automaticamente para AVIF antes do envio, com limite de (${TARGET_OPTIMIZED_LABEL}).`
}

export function getUploadPayloadError(file: File): string | null {
    if (file.size <= TARGET_OPTIMIZED_BYTES) return null
    return `Após otimização, o arquivo ficou com ${formatSizeInMb(file.size)} e ainda excede o limite de upload (${TARGET_OPTIMIZED_LABEL}). Reduza a resolução/qualidade e tente novamente.`
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

// Keep batches from starting one WASM instance per selected image at once.
let conversionQueue: Promise<unknown> = Promise.resolve()

export function optimizeImageBeforeUpload(file: File): Promise<File> {
    const conversion = conversionQueue.then(() => encodeAvif(file))
    conversionQueue = conversion.catch(() => undefined)
    return conversion
}

async function encodeAvif(file: File): Promise<File> {
    if (typeof window === 'undefined') throw new Error('A conversão de imagens requer um navegador.')
    const validation = validateImageUpload(file)
    if (validation) throw new Error(validation)
    // Always encode, including small JPEG/PNG files. Canvas.toBlob may silently
    // return PNG when AVIF encoding is unsupported, so it is not an AVIF encoder.
    const worker = new Worker(new URL('./image-upload.worker.ts', import.meta.url), { type: 'module' })
    try {
        const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('A conversão demorou demais. Tente uma imagem menor.')), 90000)
            worker.onmessage = (event: MessageEvent<{ data?: ArrayBuffer; error?: string }>) => {
                clearTimeout(timeout)
                if (event.data.error || !event.data.data) reject(new Error(event.data.error || 'Falha na conversão para AVIF.'))
                else resolve(event.data.data)
            }
            worker.onerror = () => {
                clearTimeout(timeout)
                reject(new Error('Não foi possível carregar o conversor de imagens. Atualize a página e tente novamente.'))
            }
            worker.postMessage(file)
        })
        if (!inspectAvif(new Uint8Array(bytes))) throw new Error('O arquivo convertido não é um AVIF válido.')
        return new File([bytes], buildOptimizedFilename(file.name, 'avif'), { type: 'image/avif', lastModified: Date.now() })
    } finally {
        worker.terminate()
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
                error: `Upload bloqueado por limite de tamanho. Reduza a imagem para até ${TARGET_OPTIMIZED_LABEL} (ou converta para JPG/WebP/AVIF) e tente novamente.`,
            }
        }

        return {
            success: false,
            error: `Falha no upload (HTTP ${response.status})`,
        }
    }
}
