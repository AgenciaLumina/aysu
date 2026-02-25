// AISSU Beach Lounge - Correção COMPLETA de Reservas
// Corrige DATAS e VALORES de reservas com problemas

import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================
// CONFIGURAÇÃO
// ============================================================

interface PriceConfig {
    normalPrice: number
    normalConsumable: number
    holidayPrice: number
    holidayConsumable: number
}

const CORRECT_PRICES: Record<string, PriceConfig> = {
    'bangalo-lateral': {
        normalPrice: 600,
        normalConsumable: 500,
        holidayPrice: 1000,
        holidayConsumable: 700,
    },
    'bangalo-piscina': {
        normalPrice: 600,
        normalConsumable: 500,
        holidayPrice: 1800,
        holidayConsumable: 1300,
    },
    'bangalo-frente-mar': {
        normalPrice: 720,
        normalConsumable: 600,
        holidayPrice: 1800,
        holidayConsumable: 1300,
    },
    'bangalo-central': {
        normalPrice: 1500,
        normalConsumable: 1200,
        holidayPrice: 2500,
        holidayConsumable: 2000,
    },
    'sunbed-casal': {
        normalPrice: 250,
        normalConsumable: 200,
        holidayPrice: 500,
        holidayConsumable: 350,
    },
}

const HOLIDAY_DATES = [
    '2026-02-13', '2026-02-14', '2026-02-15',
    '2026-02-16', '2026-02-17', '2026-02-18',
]

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function toLocalISODate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function isHoliday(dateStr: string): boolean {
    return HOLIDAY_DATES.includes(dateStr)
}

function getCabinType(cabinName: string): string | null {
    if (cabinName.startsWith('Bangalô Lateral')) return 'bangalo-lateral'
    if (cabinName.startsWith('Bangalô Piscina')) return 'bangalo-piscina'
    if (cabinName.startsWith('Bangalô Frente Mar')) return 'bangalo-frente-mar'
    if (cabinName.startsWith('Bangalô Central')) return 'bangalo-central'
    if (cabinName.startsWith('Sunbed Casal')) return 'sunbed-casal'
    return null
}

function getExpectedPrice(cabinType: string, dateStr: string): number {
    const config = CORRECT_PRICES[cabinType]
    if (!config) return 0
    return isHoliday(dateStr) ? config.holidayPrice : config.normalPrice
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

// ============================================================
// AUDITORIA COMPLETA
// ============================================================

interface ReservationFix {
    id: string
    customerName: string
    cabinName: string

    // Datas
    currentCheckIn: Date
    currentCheckOut: Date
    correctCheckIn: Date | null
    correctCheckOut: Date | null
    dateNeedsfix: boolean

    // Valores
    currentPrice: number
    correctPrice: number
    priceNeedsFix: boolean

    // Análise
    issue: string
    severity: 'HIGH' | 'MEDIUM' | 'LOW'
}

async function auditReservations(): Promise<ReservationFix[]> {
    console.log('🔍 Iniciando auditoria COMPLETA de reservas...\n')

    const reservations = await prisma.reservation.findMany({
        include: { cabin: true },
        orderBy: { checkIn: 'asc' },
    })

    console.log(`📊 Total de reservas: ${reservations.length}\n`)

    const fixes: ReservationFix[] = []

    for (const reservation of reservations) {
        const cabinType = getCabinType(reservation.cabin.name)
        if (!cabinType) continue

        const currentCheckInStr = toLocalISODate(reservation.checkIn)
        const currentPrice = Number(reservation.totalPrice)

        // 1. Verifica se a data precisa de correção
        // Se o preço foi calculado corretamente para "amanhã", significa que a data está errada
        let dateNeedsFix = false
        let correctCheckIn: Date | null = null
        let correctCheckOut: Date | null = null
        let correctDateStr = currentCheckInStr

        // Tenta detectar se a data está 1 dia antes
        const nextDayStr = toLocalISODate(addDays(reservation.checkIn, 1))
        const expectedPriceNextDay = getExpectedPrice(cabinType, nextDayStr)

        // Se o preço atual bate com o preço do dia seguinte, a data está errada
        const pricePerHour = Number(reservation.cabin.pricePerHour)
        const calculatedPrice = pricePerHour * 8

        if (Math.abs(calculatedPrice - expectedPriceNextDay) < 1) {
            // Data provavelmente está 1 dia antes!
            dateNeedsFix = true
            correctCheckIn = addDays(reservation.checkIn, 1)
            correctCheckOut = addDays(reservation.checkOut, 1)
            correctDateStr = nextDayStr
        }

        // 2. Verifica se o preço precisa de correção
        const correctPrice = getExpectedPrice(cabinType, correctDateStr)
        const priceNeedsFix = Math.abs(currentPrice - correctPrice) > 1

        // 3. Se há algum problema, adiciona à lista
        if (dateNeedsFix || priceNeedsFix) {
            let issue = ''
            let severity: ReservationFix['severity'] = 'MEDIUM'

            if (dateNeedsFix && priceNeedsFix) {
                issue = 'DATA E VALOR INCORRETOS'
                severity = 'HIGH'
            } else if (dateNeedsFix) {
                issue = 'DATA INCORRETA (1 dia antes)'
                severity = 'HIGH'
            } else if (priceNeedsFix) {
                issue = 'VALOR INCORRETO'
                severity = 'MEDIUM'
            }

            fixes.push({
                id: reservation.id,
                customerName: reservation.customerName,
                cabinName: reservation.cabin.name,
                currentCheckIn: reservation.checkIn,
                currentCheckOut: reservation.checkOut,
                correctCheckIn,
                correctCheckOut,
                dateNeedsfix: dateNeedsFix,
                currentPrice,
                correctPrice,
                priceNeedsFix,
                issue,
                severity,
            })
        }
    }

    return fixes
}

// ============================================================
// RELATÓRIO
// ============================================================

function printReport(fixes: ReservationFix[]) {
    console.log('\n' + '='.repeat(80))
    console.log('📋 RELATÓRIO DE AUDITORIA COMPLETA')
    console.log('='.repeat(80) + '\n')

    if (fixes.length === 0) {
        console.log('✅ Nenhum problema encontrado!\n')
        return
    }

    const high = fixes.filter(f => f.severity === 'HIGH')
    const medium = fixes.filter(f => f.severity === 'MEDIUM')

    console.log(`🔴 Alta prioridade: ${high.length}`)
    console.log(`🟡 Média prioridade: ${medium.length}`)
    console.log(`📊 Total de problemas: ${fixes.length}\n`)
    console.log('─'.repeat(80) + '\n')

    fixes.forEach((fix, idx) => {
        const emoji = fix.severity === 'HIGH' ? '🔴' : '🟡'

        console.log(`${emoji} #${idx + 1} - ${fix.issue}`)
        console.log(`   ID: ${fix.id.slice(0, 8)}...`)
        console.log(`   Cliente: ${fix.customerName}`)
        console.log(`   Bangalô: ${fix.cabinName}`)

        if (fix.dateNeedsfix && fix.correctCheckIn) {
            console.log(`   📅 Data Atual: ${toLocalISODate(fix.currentCheckIn)}`)
            console.log(`   📅 Data Correta: ${toLocalISODate(fix.correctCheckIn)} (+1 dia)`)
        }

        if (fix.priceNeedsFix) {
            console.log(`   💰 Valor Atual: R$ ${fix.currentPrice.toFixed(2)}`)
            console.log(`   💰 Valor Correto: R$ ${fix.correctPrice.toFixed(2)}`)
        }

        console.log('')
    })

    console.log('─'.repeat(80) + '\n')
}

// ============================================================
// CORREÇÃO
// ============================================================

async function applyFixes(fixes: ReservationFix[], dryRun: boolean = true) {
    if (fixes.length === 0) {
        console.log('✅ Nada para corrigir!\n')
        return
    }

    console.log('\n' + '='.repeat(80))
    if (dryRun) {
        console.log('🔍 MODO DRY RUN - Simulação')
    } else {
        console.log('⚠️  MODO PRODUÇÃO - Aplicando correções!')
    }
    console.log('='.repeat(80) + '\n')

    let fixedCount = 0

    for (const fix of fixes) {
        const updates: Prisma.ReservationUpdateInput = {}

        if (fix.priceNeedsFix) {
            updates.totalPrice = fix.correctPrice
        }

        if (fix.dateNeedsfix && fix.correctCheckIn && fix.correctCheckOut) {
            updates.checkIn = fix.correctCheckIn
            updates.checkOut = fix.correctCheckOut
        }

        if (dryRun) {
            console.log(`✏️  [DRY RUN] ${fix.id.slice(0, 8)}... - ${fix.customerName}`)
            if (fix.dateNeedsfix && fix.correctCheckIn) {
                console.log(`   Data: ${toLocalISODate(fix.currentCheckIn)} → ${toLocalISODate(fix.correctCheckIn)}`)
            }
            if (fix.priceNeedsFix) {
                console.log(`   Valor: R$ ${fix.currentPrice.toFixed(2)} → R$ ${fix.correctPrice.toFixed(2)}`)
            }
        } else {
            await prisma.reservation.update({
                where: { id: fix.id },
                data: updates,
            })
            console.log(`✅ [APLICADO] ${fix.id.slice(0, 8)}... - ${fix.customerName}`)
            if (fix.dateNeedsfix && fix.correctCheckIn) {
                console.log(`   Data: ${toLocalISODate(fix.currentCheckIn)} → ${toLocalISODate(fix.correctCheckIn)}`)
            }
            if (fix.priceNeedsFix) {
                console.log(`   Valor: R$ ${fix.currentPrice.toFixed(2)} → R$ ${fix.correctPrice.toFixed(2)}`)
            }
            fixedCount++
        }
        console.log('')
    }

    if (dryRun) {
        console.log(`\n📝 ${fixes.length} reservas SERIAM corrigidas\n`)
    } else {
        console.log(`\n✅ ${fixedCount} reservas FORAM corrigidas!\n`)
    }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
    console.log('\n🏖️  AISSU Beach Lounge - Correção COMPLETA\n')

    try {
        const fixes = await auditReservations()
        printReport(fixes)

        if (fixes.length === 0) {
            await prisma.$disconnect()
            return
        }

        console.log('\n🔍 Simulação (DRY RUN)...\n')
        await applyFixes(fixes, true)

        console.log('='.repeat(80))
        console.log('⚠️  Para aplicar as correções, execute:')
        console.log('   npx tsx scripts/fix-reservations-complete.ts --apply')
        console.log('='.repeat(80) + '\n')

        if (process.argv.includes('--apply')) {
            console.log('\n⚠️  APLICANDO CORREÇÕES...\n')
            await applyFixes(fixes, false)
        }

    } catch (error) {
        console.error('❌ Erro:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
