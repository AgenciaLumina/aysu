import { getCabinSpaceKey, getCabinSpaceLabel, SPACE_SLUG_PREFIX } from './space-slugs'

export interface CalendarSpace { id: string; label: string }

/** Keep shared category rules and append every independent catalog entry. */
export function getCalendarSpaces(cabins: Array<{ id: string; name: string; slug?: string | null }>): CalendarSpace[] {
    const options = new Map<string, CalendarSpace>(Object.entries(SPACE_SLUG_PREFIX).map(([id, label]) => [id, { id, label }]))
    for (const cabin of cabins) {
        const id = getCabinSpaceKey(cabin)
        if (!options.has(id)) options.set(id, { id, label: getCabinSpaceLabel(cabin) })
    }
    return [...options.values()]
}
