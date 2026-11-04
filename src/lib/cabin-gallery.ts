export interface CabinImage {
    imageUrl: string
    caption: string
}

export const MAX_CABIN_IMAGES = 20

/** Existing single-image cabins remain valid without copying any media. */
export function getCabinGallery(value: unknown, cover?: string | null): CabinImage[] {
    const images: CabinImage[] = []
    if (Array.isArray(value)) {
        for (const entry of value) {
            if (entry && typeof entry.imageUrl === 'string' && entry.imageUrl.trim()) {
                if (!images.some(image => image.imageUrl === entry.imageUrl)) {
                    images.push({ imageUrl: entry.imageUrl, caption: typeof entry.caption === 'string' ? entry.caption : '' })
                }
            }
        }
    }
    if (cover?.trim()) {
        const index = images.findIndex(image => image.imageUrl === cover)
        const image = index >= 0 ? images.splice(index, 1)[0] : { imageUrl: cover, caption: '' }
        images.unshift(image)
    }
    return images
}
