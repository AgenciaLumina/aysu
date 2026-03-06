export function parseDateOnly(value?: string | null): Date | null {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
    return new Date(`${value}T12:00:00.000Z`)
}

export function serializeDateOnly(value?: Date | string | null): string | null {
    if (!value) return null

    if (typeof value === 'string') {
        const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
        if (match) return match[1]
    }

    const date = typeof value === 'string' ? new Date(value) : value
    if (Number.isNaN(date.getTime())) return null

    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export function formatDateOnlyLabel(
    value: Date | string | null | undefined,
    fallback = 'Sem data',
): string {
    const serialized = serializeDateOnly(value)
    if (!serialized) return fallback

    const date = new Date(`${serialized}T12:00:00.000Z`)
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    })
}
