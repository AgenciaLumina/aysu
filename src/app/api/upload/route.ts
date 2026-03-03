// AISSU Beach Lounge - API de Upload para R2 com conversão AVIF
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { v4 as uuid } from 'uuid'
import { uploadToR2 } from '@/lib/r2'
import { canAccessAdminPanel, getAuthUser } from '@/lib/auth'

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

export async function POST(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canAccessAdminPanel(authUser)) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado' }, { status: 400 })
        }

        // Valida tipo de arquivo
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return NextResponse.json({ success: false, error: 'Tipo de arquivo não permitido' }, { status: 400 })
        }

        // Converte para buffer
        const bytes = await file.arrayBuffer()
        const inputBuffer = Buffer.from(bytes)

        // Converte para AVIF otimizado
        const avifBuffer = await sharp(inputBuffer)
            .rotate()
            .resize(2200, 2200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .avif({
                quality: 72,
                effort: 6
            })
            .toBuffer()

        // Gera nome único
        const requestedFolder = formData.get('folder')
        const normalizedFolder =
            typeof requestedFolder === 'string'
                ? requestedFolder.trim().replace(/^\/+|\/+$/g, '')
                : ''
        const folder = normalizedFolder && /^[a-zA-Z0-9/_-]+$/.test(normalizedFolder) ? normalizedFolder : 'menu'
        const filename = `${folder}/${uuid()}.avif`

        // Upload para R2
        const result = await uploadToR2(avifBuffer, filename, 'image/avif')

        console.log('[Upload Success]', {
            filename,
            url: result.url,
            originalSize: file.size,
            compressedSize: result.size,
            compressionRatio: Math.round((1 - result.size / file.size) * 100)
        })

        return NextResponse.json({
            success: true,
            data: {
                url: result.url,
                key: result.key,
                size: result.size,
                originalSize: file.size,
                compressionRatio: Math.round((1 - result.size / file.size) * 100),
            },
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : ''
        console.error('[Upload R2 Error]', message || error)

        const normalizedMessage = message.toLowerCase()
        if (
            normalizedMessage.includes('unsupported image format') ||
            normalizedMessage.includes('input file contains unsupported image format') ||
            normalizedMessage.includes('unsupported file type')
        ) {
            return NextResponse.json(
                { success: false, error: 'Formato inválido. Use JPG, PNG, WebP, GIF ou AVIF.' },
                { status: 400 }
            )
        }

        if (
            normalizedMessage.includes('configuração do r2') ||
            normalizedMessage.includes('credential') ||
            normalizedMessage.includes('access key')
        ) {
            return NextResponse.json(
                { success: false, error: 'Configuração de storage inválida. Verifique as variáveis do R2.' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: false, error: 'Erro ao fazer upload' }, { status: 500 })
    }
}
