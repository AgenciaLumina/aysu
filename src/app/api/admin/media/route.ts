// AISSU Beach Lounge - API para Listar Arquivos do R2
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

// Construir endpoint do R2 a partir do account ID
const R2_ENDPOINT = process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

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
        const { searchParams } = new URL(request.url)
        const folder = searchParams.get('folder') || ''
        const limit = parseInt(searchParams.get('limit') || '100')

        const command = new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET || process.env.R2_BUCKET_NAME!,
            Prefix: folder,
            MaxKeys: limit,
        })

        const response = await client.send(command)

        const files = (response.Contents || []).map(item => ({
            key: item.Key!,
            size: item.Size!,
            lastModified: item.LastModified!,
            url: `${process.env.R2_PUBLIC_URL}/${item.Key}`,
        }))

        return NextResponse.json({
            success: true,
            data: {
                files,
                count: files.length,
                hasMore: response.IsTruncated || false,
            },
        })
    } catch (error) {
        console.error('[R2 List Error]', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao listar arquivos' },
            { status: 500 }
        )
    }
}
