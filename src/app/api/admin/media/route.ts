// AISSU Beach Lounge - API para Listar Arquivos do R2
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { canAccessAdminPanel, getAuthUser } from '@/lib/auth'

// Construir endpoint do R2 a partir do account ID
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
const R2_BUCKET = process.env.R2_BUCKET || 'aysu'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://cdn.aysubeachlounge.com.br'

const client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
})

export async function GET(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canAccessAdminPanel(authUser)) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const folder = searchParams.get('folder') || ''
        const limit = parseInt(searchParams.get('limit') || '200')

        console.log('[R2 List] Bucket:', R2_BUCKET, 'Prefix:', folder, 'Endpoint:', R2_ENDPOINT)

        const command = new ListObjectsV2Command({
            Bucket: R2_BUCKET,
            Prefix: folder,
            MaxKeys: limit,
        })

        const response = await client.send(command)

        console.log('[R2 List] Found:', response.Contents?.length || 0, 'items')

        const files = (response.Contents || []).map(item => ({
            key: item.Key!,
            size: item.Size!,
            lastModified: item.LastModified!,
            url: `${R2_PUBLIC_URL}/${item.Key}`,
        }))

        return NextResponse.json({
            success: true,
            data: {
                files,
                count: files.length,
                hasMore: response.IsTruncated || false,
                debug: {
                    bucket: R2_BUCKET,
                    prefix: folder,
                    endpoint: R2_ENDPOINT ? 'configured' : 'missing',
                }
            },
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'desconhecido'
        console.error('[R2 List Error]', message || error)
        return NextResponse.json(
            {
                success: false,
                error: 'Erro ao listar arquivos: ' + message,
                debug: {
                    bucket: R2_BUCKET,
                    hasAccountId: !!R2_ACCOUNT_ID,
                    hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
                    hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
                }
            },
            { status: 500 }
        )
    }
}
