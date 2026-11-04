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

/** Named entries have their own identity; known categories can supply shared rules. */
export function getSpaceCategoryKey(key: string): string {
    return SPACE_SLUGS.find(slug => key.startsWith(`${slug}-`)) || key
}

export function isIndividualCabinSlug(key: string): boolean {
    return getSpaceCategoryKey(key) !== key && /-[1-9]\d*$/.test(key)
}

export function inferCabinIdentity(name: string): string | null {
    const slug = normalize(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    // Preserve the established Sunbed category while allowing any name/suffix.
    return slug.replace(/^sun-?bed(?:-casal)?(?=-|$)/, 'sunbed-casal') || null
}

export function cabinMatchesSpace(input: { id: string; name: string; slug?: string | null }, key: string): boolean {
    const identity = getCabinSpaceKey(input)
    return identity === key || (isSpaceSlug(key) && getSpaceCategoryKey(identity) === key)
}

export function getSpacePrefix(slug: SpaceSlug): string {
    return SPACE_SLUG_PREFIX[slug]
}

export function resolveCabinSlugFromName(cabinName: string): SpaceSlug | null {
    const normalized = normalize(cabinName)

    if (normalized.includes('sunbed') || normalized.includes('sun bed')) return 'sunbed-casal'
    if (normalized.includes('day use') && normalized.includes('praia')) return 'day-use-praia'
    if (normalized.includes('mesa') && normalized.includes('restaurante')) return 'mesa-restaurante'
    if (normalized.includes('mesa') && normalized.includes('praia')) return 'mesa-praia'

    if (normalized.includes('lateral')) return 'bangalo-lateral'
    if (normalized.includes('piscina')) return 'bangalo-piscina'
    if (normalized.includes('frente') && normalized.includes('mar')) return 'bangalo-frente-mar'
    if (normalized.includes('central')) return 'bangalo-central'

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
    if (slug && !isSpaceSlug(slug)) return input.name
    if (slug && isSpaceSlug(slug)) {
        return getSpacePrefix(slug)
    }

    const resolved = resolveCabinSlug(input)
    if (resolved) {
        return getSpacePrefix(resolved)
    }

    return input.name
}

/** A named category is a real offering, even when retired. Old links with no such record aggregate children. */
export function getInventoryMembers<T extends { id: string; name: string; slug?: string | null; isActive: boolean; deletedAt?: unknown }>(cabins: T[], spaceKey: string): T[] {
    const hasOwnOffering = cabins.some(cabin => !cabin.deletedAt && getCabinSpaceKey(cabin) === spaceKey)
    return cabins.filter(cabin => !cabin.deletedAt && (hasOwnOffering ? getCabinSpaceKey(cabin) === spaceKey : cabinMatchesSpace(cabin, spaceKey)))
}
