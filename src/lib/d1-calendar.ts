import { randomUUID } from 'node:crypto'
import prisma, { Prisma } from './db'
import { createD1DomainReader } from './d1-reader'
import { D1SnapshotConflict } from './d1-read-snapshot'
import { getD1Database, type D1Statement } from './d1-batch'
import { DEFAULT_GLOBAL_PRICE_OVERRIDES, DEFAULT_RESERVABLE_ITEMS, toDbDate } from './day-config'

export class CalendarMutationError extends Error {
    constructor(message: string, readonly status = 409) { super(message) }
}
type Table = 'ReservationDayConfig' | 'ReservationGlobalConfig'
type Fields = Record<string, unknown>
const columns = ['commercialPeriodId','date','status','reservationsEnabled','title','release','flyerImageUrl','highlightOnHome','priceOverrides','commercialConditions','ticketLots','reservableItems']
const quote = (name: string) => `"${name}"`
function value(input: unknown): string | number | null {
    if (input === undefined || input === null || input === Prisma.DbNull) return null
    if (input === Prisma.JsonNull) return 'null'
    if (input instanceof Date) return input.toISOString().replace('Z','+00:00')
    if (typeof input === 'boolean') return input ? 1 : 0
    if (typeof input === 'number' || typeof input === 'string') return input
    return JSON.stringify(input)
}
function validDate(date: Date) {
    if (!Number.isFinite(date.getTime()) || date.getUTCHours() !== 12 || date.getUTCMinutes() !== 0) throw new CalendarMutationError('Data inválida.',400)
}

async function calendarOperation<T>(actorId: string, plan: (reader: ReturnType<typeof createD1DomainReader>['reader'], write: (table: Table, id: string, fields: Fields, create?: boolean) => void, remove: (id: string) => void) => Promise<T>) {
    for (let attempt = 0; ; attempt++) {
        const { reader, snapshot } = createD1DomainReader()
        try {
            const actor = await reader.user.findUnique({ where:{ id:actorId },select:{ id:true,role:true,isActive:true } })
            if (!actor?.isActive || !['ADMIN','MANAGER','CASHIER','STAFF'].includes(actor.role)) throw new CalendarMutationError('Acesso negado.',403)
            const statements: D1Statement[] = [], expectations: D1Statement[] = []
            const now = new Date().toISOString().replace('Z','+00:00')
            const write = (table: Table, id: string, fields: Fields, create = false) => {
                const entries = Object.entries(fields).filter(([,v]) => v !== undefined)
                if (entries.some(([key]) => !columns.includes(key) || (table === 'ReservationGlobalConfig' && !['priceOverrides','commercialConditions','reservableItems'].includes(key)))) throw new Error('UNSUPPORTED_CALENDAR_FIELD')
                entries.push(['updatedAt',now])
                const names = entries.map(([key]) => quote(key)), params = entries.map(([,v]) => value(v))
                statements.push({ sql:create ? `INSERT INTO ${table} (id,${names.join(',')}) VALUES (?,${params.map(() => '?').join(',')})` : `UPDATE ${table} SET ${names.map(name => `${name}=?`).join(',')} WHERE id=?`,params:create ? [id,...params] : [...params,id] })
                expectations.push({ sql:`SELECT COUNT(*) n FROM ${table} WHERE id=? AND ${names.map(name => `${name} IS ?`).join(' AND ')}`,params:[id,...params] })
            }
            const remove = (id: string) => {
                statements.push({ sql:'DELETE FROM ReservationDayConfig WHERE id=?',params:[id] })
                expectations.push({ sql:'SELECT NOT EXISTS(SELECT 1 FROM ReservationDayConfig WHERE id=?) n',params:[id] })
            }
            const result = await plan(reader,write,remove)
            if (!statements.length) return result
            try { await snapshot.commit(statements) }
            catch (error) {
                if (error instanceof D1SnapshotConflict) throw error
                // These operations only set fields. Verify every intended row
                // after an ambiguous acknowledgement instead of replaying writes.
                const db = getD1Database()
                let applied = true
                for (const expected of expectations) {
                    const found = await db.prepare(expected.sql).bind(...expected.params).all<{ n:number }>().catch(() => null)
                    if (!found?.results[0]?.n) applied = false
                }
                if (!applied) throw error
            }
            return result
        } catch (error) {
            if (!(error instanceof D1SnapshotConflict)) throw error
            if (attempt >= 3) throw new CalendarMutationError('As configurações foram alteradas. Atualize e tente novamente.',409)
        } finally { await reader.$disconnect() }
    }
}

export async function saveD1CalendarPeriod(actorId: string, dates: Date[], fields: Fields) {
    if (!dates.length || dates.length > 367) throw new CalendarMutationError('Período inválido.',400)
    dates.forEach(validDate)
    const ids = await calendarOperation(actorId,async (reader,write) => {
        const current = await reader.reservationDayConfig.findMany({ where:{ date:{ gte:dates[0],lte:dates.at(-1)! } } })
        const start = current.find(row => row.date.getTime() === dates[0].getTime())
        const periodId = dates.length > 1 ? start?.commercialPeriodId || randomUUID() : null
        const ids: string[] = []
        for (const date of dates) {
            const row = current.find(config => config.date.getTime() === date.getTime())
            if (dates.length > 1 && row && row.commercialPeriodId !== periodId && (row.status !== 'NORMAL' || start?.commercialPeriodId)) continue
            const id = row?.id || randomUUID()
            write('ReservationDayConfig',id,{ ...fields,date,commercialPeriodId:periodId },!row)
            ids.push(id)
        }
        return ids
    })
    return Promise.all(ids.map(id => prisma.reservationDayConfig.findUniqueOrThrow({ where:{ id } })))
}

export async function updateD1CalendarDate(actorId: string, id: string, fields: Fields) {
    await calendarOperation(actorId,async (reader,write) => {
        const current = await reader.reservationDayConfig.findUnique({ where:{ id } })
        if (!current) throw new CalendarMutationError('Configuração não encontrada.',404)
        if (fields.date instanceof Date) validDate(fields.date)
        write('ReservationDayConfig',id,{ ...fields,commercialPeriodId:null,...((fields.status ?? current.status) === 'WAITING_RELEASE' ? { reservationsEnabled:false } : {}) })
    })
    return prisma.reservationDayConfig.findUniqueOrThrow({ where:{ id } })
}

export async function deleteD1CalendarDate(actorId: string, id: string) {
    return calendarOperation(actorId,async (reader,_write,remove) => {
        const current = await reader.reservationDayConfig.findUnique({ where:{ id } })
        if (!current) throw new CalendarMutationError('Configuração não encontrada.',404)
        remove(id)
    })
}

export async function updateD1CalendarDefaults(actorId: string, fields: Fields) {
    await calendarOperation(actorId,async (reader,write) => {
        const current = await reader.reservationGlobalConfig.findUnique({ where:{ id:'default' } })
        write('ReservationGlobalConfig','default',{ ...(!current ? { reservableItems:DEFAULT_RESERVABLE_ITEMS,priceOverrides:DEFAULT_GLOBAL_PRICE_OVERRIDES } : {}),...fields },!current)
    })
    return prisma.reservationGlobalConfig.findUniqueOrThrow({ where:{ id:'default' } })
}

export function calendarDate(value: string) {
    const date = toDbDate(value)
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value) throw new CalendarMutationError('Data inválida.',400)
    return date
}
