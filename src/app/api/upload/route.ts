// Images are encoded to AVIF by the shared browser worker before submission.
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { uploadToR2 } from '@/lib/r2'
import { canAccessAdminPanel, getAuthUser } from '@/lib/auth'
import { inspectAvif, MAX_IMAGE_UPLOAD_BYTES } from '@/lib/image-upload'

export async function POST(request: NextRequest) {
    if (!canAccessAdminPanel(getAuthUser(request))) {
        return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    }
    try {
        const length = Number(request.headers.get('content-length'))
        if (length > MAX_IMAGE_UPLOAD_BYTES + 64 * 1024) {
            return NextResponse.json({ success: false, error: 'A imagem deve ter até 4 MB após a conversão.' }, { status: 413 })
        }
        let formData: FormData
        try { formData = await request.formData() } catch {
            return NextResponse.json({ success: false, error: 'Envie a imagem como arquivo.' }, { status: 400 })
        }
        const file = formData.get('file')
        if (!(file instanceof File) || !file.size) {
            return NextResponse.json({ success: false, error: 'Nenhum arquivo válido enviado' }, { status: 400 })
        }
        if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
            return NextResponse.json({ success: false, error: 'A imagem deve ter até 4 MB após a conversão.' }, { status: 413 })
        }
        const bytes = new Uint8Array(await file.arrayBuffer())
        if (!inspectAvif(bytes)) {
            return NextResponse.json({ success: false, error: 'A imagem não foi convertida corretamente para AVIF. Atualize a página e envie novamente.' }, { status: 400 })
        }
        const requestedFolder = formData.get('folder')
        const normalizedFolder = typeof requestedFolder === 'string' ? requestedFolder.trim().replace(/^\/+|\/+$/g, '') : ''
        const folder = normalizedFolder && /^[a-zA-Z0-9/_-]+$/.test(normalizedFolder) ? normalizedFolder : 'menu'
        const result = await uploadToR2(Buffer.from(bytes), `${folder}/${uuid()}.avif`, 'image/avif')
        return NextResponse.json({ success: true, data: {
            url: result.url, key: result.key, size: result.size,
            originalSize: file.size, compressionRatio: 0,
        } })
    } catch (error) {
        console.error('[Upload R2 Error]', error instanceof Error ? error.name : 'UnknownError')
        return NextResponse.json({ success: false, error: 'Não foi possível salvar a imagem. Tente novamente.' }, { status: 500 })
    }
}
