// AISSU Beach Lounge - API para Deletar Arquivo do R2
import { NextRequest, NextResponse } from 'next/server'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { canAccessAdminPanel, getAuthUser } from '@/lib/auth'
import { R2_CONFIG, r2Client } from '@/lib/r2'

export async function DELETE(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canAccessAdminPanel(authUser)) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { key } = await request.json()

        if (!key) {
            return NextResponse.json(
                { success: false, error: 'Key do arquivo não fornecida' },
                { status: 400 }
            )
        }

        const command = new DeleteObjectCommand({
            Bucket: R2_CONFIG.bucket,
            Key: key,
        })

        await r2Client.send(command)

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
