// AISSU Beach Lounge - Auditoria e Correção de Reservas
// Script para identificar e corrigir reservas com problemas de data/valor

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================
// CONFIGURAÇÃO: Preços corretos por tipo de bangalô
// ============================================================

interface PriceConfig {
    normalPrice: number
    normalConsumable: number
    holidayPrice: number
    holidayConsumable: number
}

const CORRECT_PRICES: Record<string, PriceConfig> = {
    // Bangalô Lateral (6 unidades)
    'bangalo-lateral': {
        normalPrice: 600,
        normalConsumable: 500,
        holidayPrice: 1000,
        holidayConsumable: 700,
    },
    // Bangalô Piscina (2 unidades)
    'bangalo-piscina': {
        normalPrice: 600,
        normalConsumable: 500,
        holidayPrice: 1800,
        holidayConsumable: 1300,
    },
    // Bangalô Frente Mar (4 unidades)
    'bangalo-frente-mar': {
        normalPrice: 720,
        normalConsumable: 600,
        holidayPrice: 1800,
        holidayConsumable: 1300,
    },
    // Bangalô Central (1 unidade)
    'bangalo-central': {
        normalPrice: 1500,
        normalConsumable: 1200,
        holidayPrice: 2500,
        holidayConsumable: 2000,
    },
    // Sunbed Casal (4 unidades)
    'sunbed-casal': {
        normalPrice: 250,
        normalConsumable: 200,
        holidayPrice: 500,
        holidayConsumable: 350,
    },
}

// Feriados/Carnaval 2026
const HOLIDAY_DATES = [
    '2026-02-13', '2026-02-14', '2026-02-15',
    '2026-02-16', '2026-02-17', '2026-02-18', // Carnaval
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

// ============================================================
// RELATÓRIO DE AUDITORIA
// ============================================================

interface ReservationIssue {
    id: string
    customerName: string
    cabinName: string
    checkInDate: string
    currentPrice: number
    expectedPrice: number
    priceDifference: number
    issue: 'PRICE_INCORRECT' | 'PRICE_MULTIPLIED' | 'UNKNOWN'
    severity: 'HIGH' | 'MEDIUM' | 'LOW'
}

async function auditReservations(): Promise<ReservationIssue[]> {
    console.log('🔍 Iniciando auditoria de reservas...\n')

    const reservations = await prisma.reservation.findMany({
        include: {
            cabin: true,
        },
        orderBy: {
            checkIn: 'asc',
        },
    })

    console.log(`📊 Total de reservas encontradas: ${reservations.length}\n`)

    const issues: ReservationIssue[] = []

    for (const reservation of reservations) {
        const cabinType = getCabinType(reservation.cabin.name)
        if (!cabinType) continue

        const checkInDateStr = toLocalISODate(reservation.checkIn)
        const expectedPrice = getExpectedPrice(cabinType, checkInDateStr)
        const currentPrice = Number(reservation.totalPrice)
        const priceDifference = Math.abs(currentPrice - expectedPrice)

        // Tolerância de R$ 1 para arredondamentos
        if (priceDifference > 1) {
            let issue: ReservationIssue['issue'] = 'PRICE_INCORRECT'
            let severity: ReservationIssue['severity'] = 'MEDIUM'

            // Detecta se foi multiplicado por horas (8h)
            const pricePerHour = Number(reservation.cabin.pricePerHour)
            const calculatedPrice = pricePerHour * 8
            if (Math.abs(currentPrice - calculatedPrice) < 1) {
                issue = 'PRICE_MULTIPLIED'
                severity = 'HIGH'
            }

            // Diferença muito grande
            if (priceDifference > 500) {
                severity = 'HIGH'
            }

            issues.push({
                id: reservation.id,
                customerName: reservation.customerName,
                cabinName: reservation.cabin.name,
                checkInDate: checkInDateStr,
                currentPrice,
                expectedPrice,
                priceDifference,
                issue,
                severity,
            })
        }
    }

    return issues
}

function printReport(issues: ReservationIssue[]) {
    console.log('\n' + '='.repeat(80))
    console.log('📋 RELATÓRIO DE AUDITORIA - RESERVAS COM PROBLEMAS')
    console.log('='.repeat(80) + '\n')

    if (issues.length === 0) {
        console.log('✅ Nenhum problema encontrado! Todas as reservas estão corretas.\n')
        return
    }

    // Agrupa por severidade
    const high = issues.filter(i => i.severity === 'HIGH')
    const medium = issues.filter(i => i.severity === 'MEDIUM')
    const low = issues.filter(i => i.severity === 'LOW')

    console.log(`🔴 Alta prioridade: ${high.length}`)
    console.log(`🟡 Média prioridade: ${medium.length}`)
    console.log(`🟢 Baixa prioridade: ${low.length}`)
    console.log(`📊 Total de problemas: ${issues.length}\n`)

    console.log('─'.repeat(80) + '\n')

    // Detalhamento
    issues.forEach((issue, idx) => {
        const emoji = issue.severity === 'HIGH' ? '🔴' : issue.severity === 'MEDIUM' ? '🟡' : '🟢'

        console.log(`${emoji} Problema #${idx + 1} - ${issue.issue}`)
        console.log(`   ID: ${issue.id.slice(0, 8)}...`)
        console.log(`   Cliente: ${issue.customerName}`)
        console.log(`   Bangalô: ${issue.cabinName}`)
        console.log(`   Data: ${issue.checkInDate}`)
        console.log(`   Valor atual: R$ ${issue.currentPrice.toFixed(2)}`)
        console.log(`   Valor esperado: R$ ${issue.expectedPrice.toFixed(2)}`)
        console.log(`   Diferença: R$ ${issue.priceDifference.toFixed(2)}`)
        console.log('')
    })

    console.log('─'.repeat(80) + '\n')
}

// ============================================================
// CORREÇÃO AUTOMÁTICA
// ============================================================

async function fixReservations(issues: ReservationIssue[], dryRun: boolean = true) {
    if (issues.length === 0) {
        console.log('✅ Nada para corrigir!\n')
        return
    }

    console.log('\n' + '='.repeat(80))
    if (dryRun) {
        console.log('🔍 MODO DRY RUN - Simulação de Correção (nada será alterado)')
    } else {
        console.log('⚠️  MODO PRODUÇÃO - Aplicando correções no banco!')
    }
    console.log('='.repeat(80) + '\n')

    let fixedCount = 0

    for (const issue of issues) {
        if (dryRun) {
            console.log(`✏️  [DRY RUN] Atualizaria reserva ${issue.id.slice(0, 8)}...`)
            console.log(`   De: R$ ${issue.currentPrice.toFixed(2)} → Para: R$ ${issue.expectedPrice.toFixed(2)}`)
        } else {
            await prisma.reservation.update({
                where: { id: issue.id },
                data: { totalPrice: issue.expectedPrice },
            })
            console.log(`✅ [APLICADO] Reserva ${issue.id.slice(0, 8)}... corrigida!`)
            console.log(`   De: R$ ${issue.currentPrice.toFixed(2)} → Para: R$ ${issue.expectedPrice.toFixed(2)}`)
            fixedCount++
        }
        console.log('')
    }

    if (dryRun) {
        console.log(`\n📝 ${issues.length} reservas SERIAM corrigidas (dry run)\n`)
    } else {
        console.log(`\n✅ ${fixedCount} reservas FORAM corrigidas com sucesso!\n`)
    }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
    console.log('\n🏖️  AISSU Beach Lounge - Auditoria de Reservas\n')

    try {
        // 1. Auditoria
        const issues = await auditReservations()

        // 2. Relatório
        printReport(issues)

        if (issues.length === 0) {
            await prisma.$disconnect()
            return
        }

        // 3. Dry Run (simulação)
        console.log('\n🔍 Executando DRY RUN (simulação)...\n')
        await fixReservations(issues, true)

        // Pergunta se quer aplicar
        console.log('='.repeat(80))
        console.log('⚠️  ATENÇÃO: Para REALMENTE aplicar as correções, execute:')
        console.log('   npx tsx scripts/audit-and-fix-reservations.ts --apply')
        console.log('='.repeat(80) + '\n')

        // Se passou --apply como argumento
        if (process.argv.includes('--apply')) {
            console.log('\n⚠️  APLICANDO CORREÇÕES NO BANCO DE PRODUÇÃO...\n')
            await fixReservations(issues, false)
        }

    } catch (error) {
        console.error('❌ Erro durante execução:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
