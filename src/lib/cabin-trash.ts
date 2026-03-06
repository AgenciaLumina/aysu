export function buildDeletedCabinName(originalName: string, cabinId: string): string {
    const suffix = ` [lixeira ${cabinId.slice(0, 8)}]`
    const baseName = originalName.trim() || 'Espaco'
    return `${baseName}${suffix}`
}

export function getCabinTrashDisplayName(input: {
    name: string
    deletedOriginalName?: string | null
}): string {
    return input.deletedOriginalName?.trim() || input.name
}
