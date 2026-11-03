// AISSU Beach Lounge - Cloudflare R2 Storage Client
// S3-compatible storage for images with AVIF conversion

import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getCloudflareContext } from '@opennextjs/cloudflare'

type MediaBucket = {
    put(key: string, bytes: Uint8Array, options: { httpMetadata: { contentType: string; cacheControl: string } }): Promise<unknown>
    delete(key: string): Promise<void>
    list(options: { prefix: string; limit: number }): Promise<{ objects: Array<{ key: string; size: number; uploaded: Date }>; truncated: boolean }>
}

function nativeMediaBucket(): MediaBucket | null {
    let context: ReturnType<typeof getCloudflareContext>
    try { context = getCloudflareContext() } catch { return null }
    const bucket = (context.env as unknown as { MEDIA_BUCKET?: MediaBucket }).MEDIA_BUCKET
    if (!bucket) throw new Error('MEDIA_BUCKET binding unavailable')
    return bucket
}

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

function assertR2Config(): void {
    if (!R2_CONFIG.accountId || !R2_CONFIG.accessKeyId || !R2_CONFIG.secretAccessKey || !R2_CONFIG.bucket) {
        throw new Error('Configuração do R2 ausente ou inválida')
    }
}

// Cliente S3 para R2
export const r2Client = new S3Client({
    region: 'auto',
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
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
    const bucket = nativeMediaBucket()
    const cacheControl = 'public, max-age=31536000, immutable'
    if (bucket) {
        await bucket.put(key, new Uint8Array(buffer), { httpMetadata: { contentType, cacheControl } })
    } else {
        assertR2Config()
        await r2Client.send(new PutObjectCommand({
            Bucket: R2_CONFIG.bucket, Key: key, Body: buffer,
            ContentType: contentType, CacheControl: cacheControl,
        }))
    }
    return { url: `${R2_CONFIG.publicUrl}/${key}`, key, size: buffer.length, contentType }
}

/**
 * Remove um arquivo do R2
 */
export async function deleteFromR2(key: string): Promise<void> {
    const bucket = nativeMediaBucket()
    if (bucket) await bucket.delete(key)
    else {
        assertR2Config()
        await r2Client.send(new DeleteObjectCommand({ Bucket: R2_CONFIG.bucket, Key: key }))
    }
}

/**
 * Extrai a key do R2 a partir de uma URL pública
 */
export function getKeyFromUrl(url: string): string | null {
    if (!url.includes(R2_CONFIG.publicUrl)) return null
    return url.replace(`${R2_CONFIG.publicUrl}/`, '')
}

export async function listR2Files(prefix: string, limit: number) {
    const bucket = nativeMediaBucket()
    if (bucket) {
        const result = await bucket.list({ prefix, limit })
        return { files: result.objects.map(item => ({ key: item.key, size: item.size, lastModified: item.uploaded, url: `${R2_CONFIG.publicUrl}/${item.key}` })), hasMore: result.truncated }
    }
    assertR2Config()
    const result = await r2Client.send(new ListObjectsV2Command({ Bucket: R2_CONFIG.bucket, Prefix: prefix, MaxKeys: limit }))
    return { files: (result.Contents || []).map(item => ({ key: item.Key!, size: item.Size!, lastModified: item.LastModified!, url: `${R2_CONFIG.publicUrl}/${item.Key}` })), hasMore: result.IsTruncated || false }
}
