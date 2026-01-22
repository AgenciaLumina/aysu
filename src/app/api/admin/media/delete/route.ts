// AISSU Beach Lounge - API para Deletar Arquivo do R2
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

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

export async function DELETE(request: NextRequest) {
    try {
        const { key } = await request.json()

        if (!key) {
            return NextResponse.json(
                { success: false, error: 'Key do arquivo não fornecida' },
                { status: 400 }
            )
        }

        const command = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET || process.env.R2_BUCKET_NAME!,
            Key: key,
        })

        await client.send(command)

        return NextResponse.json({
            success: true,
            message: 'Arquivo deletado com sucesso',
        })
    } catch (error) {
        console.error('[R2 Delete Error]', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao deletar arquivo' },
            { status: 500 }
        )
    }
}
