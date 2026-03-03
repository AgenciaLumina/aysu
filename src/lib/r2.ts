// AISSU Beach Lounge - Cloudflare R2 Storage Client
// S3-compatible storage for images with AVIF conversion

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

function sanitizeEnvValue(value?: string): string | undefined {
    if (typeof value !== 'string') return undefined

    let normalized = value.trim()
    // Alguns provedores/syncs escrevem "\\n" no final da env.
    normalized = normalized.replace(/(?:\\r\\n|\\n|\\r)+$/g, '').trim()
    normalized = normalized.replace(/[\r\n]+$/g, '').trim()

    return normalized || undefined
}

function readEnv(keys: string[], fallback?: string): string {
    for (const key of keys) {
        const value = sanitizeEnvValue(process.env[key])
        if (value) return value
    }

    if (fallback !== undefined) return fallback
    return ''
}

export const R2_CONFIG = {
    accountId: readEnv(['R2_ACCOUNT_ID'], '082470a50b13e1a72fb29987889950ea'),
    accessKeyId: readEnv(['R2_ACCESS_KEY_ID']),
    secretAccessKey: readEnv(['R2_SECRET_ACCESS_KEY']),
    bucket: readEnv(['R2_BUCKET', 'R2_BUCKET_NAME'], 'aysu'),
    publicUrl: readEnv(['R2_PUBLIC_URL'], 'https://cdn.aysubeachlounge.com.br'),
}

export const R2_ENDPOINT = readEnv(
    ['R2_ENDPOINT'],
    `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`
)

function hasRequiredR2Config(): boolean {
    return Boolean(
        R2_CONFIG.accountId &&
        R2_CONFIG.accessKeyId &&
        R2_CONFIG.secretAccessKey &&
        R2_CONFIG.bucket
    )
}

function assertR2Config(): void {
    if (!R2_CONFIG.accountId || !R2_CONFIG.accessKeyId || !R2_CONFIG.secretAccessKey || !R2_CONFIG.bucket) {
        throw new Error('Configuração do R2 ausente ou inválida')
    }
}

// Cliente S3 para R2
export const r2Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_CONFIG.accessKeyId || '',
        secretAccessKey: R2_CONFIG.secretAccessKey || '',
    },
})

export interface UploadResult {
    url: string
    key: string
    size: number
    contentType: string
}

/**
 * Faz upload de um arquivo para o R2
 */
export async function uploadToR2(
    buffer: Buffer,
    key: string,
    contentType: string
): Promise<UploadResult> {
    if (!hasRequiredR2Config()) {
        assertR2Config()
    }

    console.log('[R2 Upload Start]', {
        bucket: R2_CONFIG.bucket,
        key,
        contentType,
        bufferSize: buffer.length,
        endpoint: R2_ENDPOINT
    })

    try {
        await r2Client.send(
            new PutObjectCommand({
                Bucket: R2_CONFIG.bucket,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                CacheControl: 'public, max-age=31536000, immutable',
            })
        )

        const url = `${R2_CONFIG.publicUrl}/${key}`
        console.log('[R2 Upload Success]', { url })

        return {
            url,
            key,
            size: buffer.length,
            contentType,
        }
    } catch (error) {
        console.error('[R2 Upload Failed]', error)
        throw error
    }
}

/**
 * Remove um arquivo do R2
 */
export async function deleteFromR2(key: string): Promise<void> {
    if (!hasRequiredR2Config()) {
        assertR2Config()
    }

    await r2Client.send(
        new DeleteObjectCommand({
            Bucket: R2_CONFIG.bucket,
            Key: key,
        })
    )
}

/**
 * Extrai a key do R2 a partir de uma URL pública
 */
export function getKeyFromUrl(url: string): string | null {
    if (!url.includes(R2_CONFIG.publicUrl)) return null
    return url.replace(`${R2_CONFIG.publicUrl}/`, '')
}
