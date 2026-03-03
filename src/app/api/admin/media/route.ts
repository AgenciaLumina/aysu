// AISSU Beach Lounge - API para Listar Arquivos do R2
import { NextRequest, NextResponse } from 'next/server'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import { canAccessAdminPanel, getAuthUser } from '@/lib/auth'
import { R2_CONFIG, R2_ENDPOINT, r2Client } from '@/lib/r2'

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

        console.log('[R2 List] Bucket:', R2_CONFIG.bucket, 'Prefix:', folder, 'Endpoint:', R2_ENDPOINT)

        const command = new ListObjectsV2Command({
            Bucket: R2_CONFIG.bucket,
            Prefix: folder,
            MaxKeys: limit,
        })

        const response = await r2Client.send(command)

        console.log('[R2 List] Found:', response.Contents?.length || 0, 'items')

        const files = (response.Contents || []).map(item => ({
            key: item.Key!,
            size: item.Size!,
            lastModified: item.LastModified!,
            url: `${R2_CONFIG.publicUrl}/${item.Key}`,
        }))

        return NextResponse.json({
            success: true,
            data: {
                files,
                count: files.length,
                hasMore: response.IsTruncated || false,
                debug: {
                    bucket: R2_CONFIG.bucket,
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
                    bucket: R2_CONFIG.bucket,
                    hasAccountId: !!R2_CONFIG.accountId,
                    hasAccessKey: !!R2_CONFIG.accessKeyId,
                    hasSecretKey: !!R2_CONFIG.secretAccessKey,
                }
            },
            { status: 500 }
        )
    }
}
