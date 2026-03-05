export const SPACE_SLUG_PREFIX = {
    'bangalo-lateral': 'Bangalô Lateral',
    'bangalo-piscina': 'Bangalô Piscina',
    'bangalo-frente-mar': 'Bangalô Frente Mar',
    'bangalo-central': 'Bangalô Central',
    'sunbed-casal': 'Sunbed Casal',
    'mesa-restaurante': 'Mesa Restaurante',
    'mesa-praia': 'Mesa Praia',
    'day-use-praia': 'Day Use Praia',
} as const

export type SpaceSlug = keyof typeof SPACE_SLUG_PREFIX

export const SPACE_SLUGS = Object.keys(SPACE_SLUG_PREFIX) as SpaceSlug[]

function normalize(input: string): string {
    return input
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
}

export function isSpaceSlug(value: string): value is SpaceSlug {
    return SPACE_SLUGS.includes(value as SpaceSlug)
}

export function getSpacePrefix(slug: SpaceSlug): string {
    return SPACE_SLUG_PREFIX[slug]
}

export function resolveCabinSlugFromName(cabinName: string): SpaceSlug | null {
    const normalized = normalize(cabinName)

    if (normalized.includes('lateral')) return 'bangalo-lateral'
    if (normalized.includes('piscina')) return 'bangalo-piscina'
    if (normalized.includes('frente') && normalized.includes('mar')) return 'bangalo-frente-mar'
    if (normalized.includes('central')) return 'bangalo-central'
    if (normalized.includes('sunbed') || normalized.includes('sun bed')) return 'sunbed-casal'
    if (normalized.includes('mesa') && normalized.includes('restaurante')) return 'mesa-restaurante'
    if (normalized.includes('mesa') && normalized.includes('praia')) return 'mesa-praia'
    if (normalized.includes('day use') && normalized.includes('praia')) return 'day-use-praia'

    return null
}

export function resolveCabinSlug(input: { name: string; slug?: string | null } | string): SpaceSlug | null {
    if (typeof input === 'string') {
        return resolveCabinSlugFromName(input)
    }

    if (input.slug && isSpaceSlug(input.slug)) {
        return input.slug
    }

    return resolveCabinSlugFromName(input.name)
}

export function getCabinSpaceKey(input: { id: string; name: string; slug?: string | null }): string {
    const slug = typeof input.slug === 'string' ? input.slug.trim() : ''
    if (slug) return slug

    const resolved = resolveCabinSlug(input)
    if (resolved) return resolved

    return input.id
}

export function getCabinSpaceLabel(input: { name: string; slug?: string | null }): string {
    const slug = typeof input.slug === 'string' ? input.slug.trim() : ''
    if (slug && isSpaceSlug(slug)) {
        return getSpacePrefix(slug)
    }

    const resolved = resolveCabinSlug(input)
    if (resolved) {
        return getSpacePrefix(resolved)
    }

    return input.name
}
