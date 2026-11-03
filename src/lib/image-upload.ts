// Shared limits and byte validation. This module is safe in Workers and browsers.
export const MAX_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024
export const MAX_IMAGE_DIMENSION = 2200

/** Inspect AVIF container boxes; do not trust a filename or browser MIME label. */
export function inspectAvif(bytes: Uint8Array): { width: number; height: number } | null {
    if (bytes.length < 32) return null
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    const text = (offset: number, length: number) => String.fromCharCode(...bytes.subarray(offset, offset + length))
    let avifBrand = false, metadata = false, imageData = false
    let dimensions: { width: number; height: number } | null = null
    function boxes(start: number, end: number, depth: number): boolean {
        if (depth > 5) return false
        let offset = start
        while (offset < end) {
            if (end - offset < 8) return false
            const size = view.getUint32(offset), type = text(offset + 4, 4)
            // Encoders used by the upload flow produce bounded 32-bit boxes.
            if (size < 8 || offset + size > end) return false
            const body = offset + 8, next = offset + size
            if (depth === 0 && type === 'ftyp') {
                if (size < 16 || (size - 16) % 4) return false
                const brands = [text(body, 4)]
                for (let i = body + 8; i < next; i += 4) brands.push(text(i, 4))
                avifBrand = brands.includes('avif')
            } else if (depth === 0 && type === 'meta') {
                metadata = true
                if (size < 12 || !boxes(body + 4, next, depth + 1)) return false
            } else if (type === 'iprp' || type === 'ipco') {
                if (!boxes(body, next, depth + 1)) return false
            } else if (type === 'ispe' && depth > 0) {
                if (size !== 20) return false
                const width = view.getUint32(body + 4), height = view.getUint32(body + 8)
                if (!width || !height || width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) return false
                dimensions = { width, height }
            } else if (depth === 0 && type === 'mdat') imageData = size > 8
            offset = next
        }
        return offset === end
    }
    return boxes(0, bytes.length, 0) && avifBrand && metadata && imageData ? dimensions : null
}
