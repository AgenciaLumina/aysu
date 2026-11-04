export interface MediaFile {
    key: string
    url: string
    size: number
    lastModified: string
}

// R2 pages are ordered by key, not by upload time. Read every page before
// sorting so new files cannot disappear behind a lexicographic page boundary.
export async function fetchMediaFiles(folder: string, signal?: AbortSignal): Promise<MediaFile[]> {
    const files = new Map<string, MediaFile>()
    const cursors = new Set<string>()
    let cursor: string | undefined
    do {
        const params = new URLSearchParams({ folder, limit: '200' })
        if (cursor) params.set('cursor', cursor)
        const response = await fetch(`/api/admin/media?${params}`, { cache: 'no-store', signal })
        const result = await response.json()
        if (!response.ok || !result.success || !Array.isArray(result.data?.files)) {
            throw new Error(result.error || 'Não foi possível carregar a biblioteca de imagens.')
        }
        for (const file of result.data.files as MediaFile[]) files.set(file.key, file)
        if (!result.data.hasMore) break
        const nextCursor = result.data.nextCursor
        if (typeof nextCursor !== 'string' || !nextCursor || cursors.has(nextCursor)) {
            throw new Error('A biblioteca não foi carregada por completo. Atualize a página e tente novamente.')
        }
        cursors.add(nextCursor)
        cursor = nextCursor
    } while (cursor)
    return [...files.values()].sort((a, b) =>
        (Date.parse(b.lastModified) || 0) - (Date.parse(a.lastModified) || 0) || a.key.localeCompare(b.key)
    )
}
