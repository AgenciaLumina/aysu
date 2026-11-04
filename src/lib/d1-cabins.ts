import { randomUUID } from 'node:crypto'
import type { z } from 'zod'
import prisma from './db'
import { createD1DomainReader } from './d1-reader'
import { getD1Database, type D1Statement } from './d1-batch'
import { D1SnapshotConflict } from './d1-read-snapshot'
import { getCabinGroupKey, listCabinGroupMembers, sumCabinUnits, getNormalizedCabinUnits } from './cabin-groups'
import { inferCabinIdentity, isIndividualCabinSlug, getSpaceCategoryKey, getCabinSpaceKey } from './space-slugs'
import { buildDeletedCabinName } from './cabin-trash'
import { getCabinGallery, MAX_CABIN_IMAGES } from './cabin-gallery'
import type { createCabinSchema, updateCabinSchema } from './validations'

export class CabinMutationError extends Error {
    constructor(message: string, readonly status = 409) { super(message) }
}

type Input = z.infer<typeof updateCabinSchema>
const columns = ['name', 'slug', 'capacity', 'units', 'pricePerHour', 'description', 'imageUrl', 'galleryImages', 'category', 'visibilityStatus', 'isActive', 'deletedOriginalName']
function value(input: unknown): string | number | null {
    if (input === null || input === undefined) return null
    if (typeof input === 'boolean') return input ? 1 : 0
    if (typeof input === 'number' || typeof input === 'string') return input
    return JSON.stringify(input)
}

/** Preserve the existing group/stock rules using a guarded native D1 batch. */
async function saveCabin(actorId: string, requestedId: string | null, input: Input) {
    const id = requestedId || randomUUID()
    for (let attempt = 0; ; attempt++) {
        const { reader, snapshot } = createD1DomainReader()
        try {
            const actor = await reader.user.findUnique({ where: { id: actorId }, select: { role: true, isActive: true } })
            if (!actor?.isActive || !['ADMIN', 'MANAGER'].includes(actor.role)) throw new CabinMutationError('Acesso negado.', 403)
            const current = requestedId ? await reader.cabin.findUnique({ where: { id } }) : null
            if (requestedId && !current) throw new CabinMutationError('Bangalô não encontrado', 404)
            if (current?.deletedAt) throw new CabinMutationError('Este espaço está na lixeira. Restaure antes de editar.', 409)

            const statements: D1Statement[] = [], expectations: D1Statement[] = []
            const now = new Date().toISOString().replace('Z', '+00:00')
            const write = (targetId: string, fields: Record<string, unknown>, create = false) => {
                const entries = Object.entries(fields).filter(([, entry]) => entry !== undefined)
                if (entries.some(([key]) => !columns.includes(key))) throw new Error('UNSUPPORTED_CABIN_FIELD')
                entries.push(['updatedAt', now])
                if (create) entries.push(['createdAt', now])
                const names = entries.map(([key]) => `"${key}"`), params = entries.map(([, entry]) => value(entry))
                statements.push({
                    sql: create ? `INSERT INTO Cabin (id,${names.join(',')}) VALUES (?,${params.map(() => '?').join(',')})`
                        : `UPDATE Cabin SET ${names.map(name => `${name}=?`).join(',')} WHERE id=?`,
                    params: create ? [targetId, ...params] : [...params, targetId],
                })
                expectations.push({ sql: `SELECT COUNT(*) n FROM Cabin WHERE id=? AND ${names.map(name => `${name} IS ?`).join(' AND ')}`, params: [targetId, ...params] })
            }

            const fields: Input = { ...input }
            if (input.galleryImages !== undefined) {
                fields.imageUrl = input.galleryImages[0]?.imageUrl || null
            } else if (input.imageUrl !== undefined) {
                fields.galleryImages = input.imageUrl
                    ? getCabinGallery(current?.galleryImages, input.imageUrl)
                    : []
            }
            if ((fields.galleryImages?.length ?? 0) > MAX_CABIN_IMAGES) throw new CabinMutationError('Use até 20 fotos por espaço', 400)
            const photosOnly = !!current && Object.keys(input).every(key => ['imageUrl', 'galleryImages'].includes(key))
            if (photosOnly) {
                // A photo-only edit never changes quantities, visibility or prices.
                write(id, fields)
            } else {
                const all = await reader.cabin.findMany({ orderBy: { id: 'asc' } })
                const nextName = input.name ?? current?.name
                if (!nextName) throw new CabinMutationError('Nome é obrigatório', 400)
                const nameConflict = all.find(cabin => cabin.id !== id && cabin.name === nextName)
                if (nameConflict) {
                    if (!current && nameConflict.deletedAt && !nameConflict.deletedOriginalName) {
                        write(nameConflict.id, { name: buildDeletedCabinName(nameConflict.name, nameConflict.id), deletedOriginalName: nameConflict.name })
                    } else throw new CabinMutationError('Já existe um bangalô com este nome', 409)
                }
                const inferredSlug = input.slug?.trim() || current?.slug || inferCabinIdentity(nextName) || null
                const members = current ? listCabinGroupMembers(all.filter(cabin => !cabin.deletedAt), current) : []
                const memberIds = new Set(members.map(cabin => cabin.id))
                const nextGroup = getCabinGroupKey({ id, name: nextName, slug: inferredSlug })
                if (!current || nextGroup !== getCabinGroupKey(current)) {
                    if (all.some(cabin => !cabin.deletedAt && !memberIds.has(cabin.id) && getCabinGroupKey(cabin) === nextGroup)) {
                        throw new CabinMutationError('Este tipo de espaço já existe. Edite o cadastro existente.', 409)
                    }
                    // Do not expose a pooled stock alongside its physical units.
                    if (all.some(cabin => !cabin.deletedAt && cabin.isActive && !memberIds.has(cabin.id)
                        && getSpaceCategoryKey(getCabinSpaceKey(cabin)) === getSpaceCategoryKey(nextGroup)
                        && isIndividualCabinSlug(getCabinSpaceKey(cabin)) !== isIndividualCabinSlug(nextGroup))) {
                        throw new CabinMutationError('Esta categoria já possui estoque cadastrado. Edite as unidades existentes para não duplicar vagas.', 409)
                    }
                }
                const active = members.filter(cabin => cabin.isActive)
                const units = input.units ?? (current ? active.length ? sumCabinUnits(active) : getNormalizedCabinUnits(current.units) : 1)
                if (isIndividualCabinSlug(nextGroup) && units !== 1) throw new CabinMutationError('Um bangalô numerado representa uma unidade. Mantenha a quantidade em 1.', 400)
                write(id, { ...fields, name: nextName, slug: inferredSlug, units, ...(!current ? { isActive: true } : {}) }, !current)
                for (const member of members) {
                    if (member.id !== id) write(member.id, { isActive: false, visibilityStatus: 'HIDDEN' })
                }
            }

            try { await snapshot.commit(statements) }
            catch (error) {
                if (error instanceof D1SnapshotConflict) throw error
                // An uncertain response is checked; do not blindly replay a write.
                const db = getD1Database()
                let applied = true
                for (const expected of expectations) {
                    const result = await db.prepare(expected.sql).bind(...expected.params).all<{ n: number }>().catch(() => null)
                    if (!result?.results[0]?.n) applied = false
                }
                if (!applied) throw error
            }
            return await prisma.cabin.findUniqueOrThrow({ where: { id } })
        } catch (error) {
            if (!(error instanceof D1SnapshotConflict)) throw error
            if (attempt >= 3) throw new CabinMutationError('O espaço foi alterado por outra operação. Atualize a página e tente novamente.', 409)
        } finally { await reader.$disconnect() }
    }
}

export function updateD1Cabin(actorId: string, id: string, input: Input) {
    return saveCabin(actorId, id, input)
}

export function createD1Cabin(actorId: string, input: z.infer<typeof createCabinSchema>) {
    return saveCabin(actorId, null, input)
}
