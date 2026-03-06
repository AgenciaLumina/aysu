import { getCabinSpaceKey } from '@/lib/space-slugs'

export type CabinVisibilityValue = 'AVAILABLE' | 'UNAVAILABLE' | 'HIDDEN'

export interface CabinGroupable {
    id: string
    name: string
    slug?: string | null
    units?: number | null
    visibilityStatus?: CabinVisibilityValue | null
    isActive?: boolean
}

export function getCabinGroupKey(cabin: Pick<CabinGroupable, 'id' | 'name' | 'slug'>): string {
    return getCabinSpaceKey({
        id: cabin.id,
        name: cabin.name,
        slug: cabin.slug,
    })
}

export function getNormalizedCabinUnits(units?: number | null): number {
    return Math.max(1, Number(units || 1))
}

export function getCabinVisibilityPriority(status?: CabinVisibilityValue | null): number {
    if (status === 'HIDDEN') return 3
    if (status === 'UNAVAILABLE') return 2
    return 1
}

export function listCabinGroupMembers<T extends Pick<CabinGroupable, 'id' | 'name' | 'slug'>>(
    cabins: T[],
    target: Pick<CabinGroupable, 'id' | 'name' | 'slug'>,
): T[] {
    const targetKey = getCabinGroupKey(target)
    return cabins.filter((cabin) => getCabinGroupKey(cabin) === targetKey)
}

export function sumCabinUnits<T extends Pick<CabinGroupable, 'units'>>(cabins: T[]): number {
    return cabins.reduce((sum, cabin) => sum + getNormalizedCabinUnits(cabin.units), 0)
}
