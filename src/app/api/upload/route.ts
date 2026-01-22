// AISSU Beach Lounge - API de Upload para R2 com conversão AVIF
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { v4 as uuid } from 'uuid'
import { uploadToR2 } from '@/lib/r2'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado' }, { status: 400 })
        }

        // Valida tipo de arquivo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ success: false, error: 'Tipo de arquivo não permitido' }, { status: 400 })
        }

        // Valida tamanho (max 10MB antes da conversão)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
            return NextResponse.json({ success: false, error: 'Arquivo muito grande. Máximo 10MB.' }, { status: 400 })
        }

        // Converte para buffer
        const bytes = await file.arrayBuffer()
        const inputBuffer = Buffer.from(bytes)

        // Converte para AVIF otimizado
        const avifBuffer = await sharp(inputBuffer)
            .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .avif({
                quality: 75,
                effort: 6
            })
            .toBuffer()

        // Gera nome único
        const folder = formData.get('folder') as string || 'menu'
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
    } catch (error) {
        console.error('[Upload R2 Error]', error)
        return NextResponse.json({ success: false, error: 'Erro ao fazer upload' }, { status: 500 })
    }
}
