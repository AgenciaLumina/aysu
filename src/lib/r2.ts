// AISSU Beach Lounge - Cloudflare R2 Storage Client
// S3-compatible storage for images with AVIF conversion

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Configuração do R2
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '082470a50b13e1a72fb29987889950ea'
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET = process.env.R2_BUCKET || 'aysu'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://cdn.aysubeachlounge.com.br'

// Cliente S3 para R2
export const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
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
    console.log('[R2 Upload Start]', {
        bucket: R2_BUCKET,
        key,
        contentType,
        bufferSize: buffer.length,
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    })

    try {
        await r2Client.send(
            new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                CacheControl: 'public, max-age=31536000, immutable',
            })
        )

        const url = `${R2_PUBLIC_URL}/${key}`
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
    await r2Client.send(
        new DeleteObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
        })
    )
}

/**
 * Extrai a key do R2 a partir de uma URL pública
 */
export function getKeyFromUrl(url: string): string | null {
    if (!url.includes(R2_PUBLIC_URL)) return null
    return url.replace(`${R2_PUBLIC_URL}/`, '')
}
