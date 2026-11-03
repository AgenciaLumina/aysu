import createAvifEncoder from '@jsquash/avif/codec/enc/avif_enc.js'
import { defaultOptions } from '@jsquash/avif/meta.js'
import { inspectAvif, MAX_IMAGE_DIMENSION, MAX_IMAGE_UPLOAD_BYTES } from './image-upload'

// Runs off the UI thread. WASM and HEIC decoder assets are hosted with this app.
self.onmessage = async (event: MessageEvent<File>) => {
    let bitmap: ImageBitmap | undefined
    try {
        const file = event.data
        try {
            bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
        } catch {
            if (!/\.(heic|heif)$/i.test(file.name) && !/^image\/hei[cf]/.test(file.type)) {
                throw new Error('Não foi possível ler a imagem. Verifique se o arquivo está íntegro.')
            }
            const { heicTo } = await import('heic-to/next')
            bitmap = await heicTo({ blob: file, type: 'bitmap' })
        }
        const encoder = await createAvifEncoder()
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height))
        for (const resize of [1, 0.8, 0.6]) {
            const width = Math.max(1, Math.round(bitmap.width * scale * resize))
            const height = Math.max(1, Math.round(bitmap.height * scale * resize))
            const canvas = new OffscreenCanvas(width, height)
            const context = canvas.getContext('2d')
            if (!context) throw new Error('Não foi possível preparar a imagem neste navegador.')
            context.drawImage(bitmap, 0, 0, width, height)
            const image = context.getImageData(0, 0, width, height)
            for (const quality of [72, 55, 40]) {
                const output = encoder.encode(new Uint8Array(image.data.buffer), width, height, {
                    ...defaultOptions, quality, speed: 8,
                })
                if (!output) throw new Error('Falha na conversão para AVIF.')
                if (output.byteLength <= MAX_IMAGE_UPLOAD_BYTES) {
                    const data = output.slice().buffer
                    if (!inspectAvif(new Uint8Array(data))) throw new Error('A conversão não gerou um AVIF válido.')
                    self.postMessage({ data }, { transfer: [data] })
                    return
                }
            }
        }
        throw new Error('Não foi possível reduzir a imagem para 4 MB. Tente uma imagem com resolução menor.')
    } catch (error) {
        self.postMessage({ error: error instanceof Error ? error.message : 'Não foi possível converter a imagem para AVIF.' })
    } finally {
        bitmap?.close()
    }
}
