import 'dotenv/config'
import { PrismaClient, ReservationStatus } from '@prisma/client'

const prisma = new PrismaClient()

const HOLD_STATUSES = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
  ReservationStatus.CHECKED_IN,
  ReservationStatus.IN_PROGRESS,
]

const STOCK_PREFIXES = [
  { label: 'Mesa Restaurante', prefix: 'Mesa Restaurante', required: true },
  { label: 'Mesa Praia', prefix: 'Mesa Praia', required: true },
  { label: 'Day Use Praia', prefix: 'Day Use Praia', required: false },
]

function separator() {
  console.log('='.repeat(72))
}

function assertSafeReadMode() {
  const allowRead = process.env.ALLOW_DB_READ === '1'
  if (allowRead) return

  console.error('BLOQUEADO: modo seguro ativo para banco.')
  console.error('Para executar leitura intencional, rode:')
  console.error('ALLOW_DB_READ=1 node scripts/preflight-v211.mjs')
  process.exitCode = 3
  throw new Error('READ_BLOCKED')
}

function assertDatabaseEnv() {
  if (process.env.DATABASE_URL && process.env.DIRECT_URL) return

  console.error('BLOQUEADO: variaveis de banco ausentes no ambiente.')
  console.error('Defina DATABASE_URL e DIRECT_URL antes de executar o preflight.')
  process.exitCode = 4
  throw new Error('DB_ENV_MISSING')
}

async function main() {
  assertSafeReadMode()
  assertDatabaseEnv()

  console.log('\nPRE-FLIGHT SPRINT 2.1.1')
  separator()

  const grouped = await prisma.reservation.groupBy({
    by: ['status'],
    _count: { _all: true },
  })

  const byStatus = grouped.reduce((acc, item) => {
    acc[item.status] = item._count._all
    return acc
  }, {})

  console.log('Reservas por status:')
  Object.keys(byStatus).sort().forEach((status) => {
    console.log(`- ${status}: ${byStatus[status]}`)
  })

  const holdsCount = await prisma.reservation.count({
    where: {
      status: { in: HOLD_STATUSES },
    },
  })
  console.log(`\nReservas que travam estoque: ${holdsCount}`)

  const staleCutoff = new Date(Date.now() - (24 * 60 * 60 * 1000))
  const stalePending = await prisma.reservation.count({
    where: {
      status: ReservationStatus.PENDING,
      createdAt: { lt: staleCutoff },
    },
  })

  console.log(`Pendentes com mais de 24h: ${stalePending}`)
  if (stalePending > 0) {
    console.log('ATENCAO: revisar pendencias antigas antes do deploy.')
  }

  separator()
  console.log('Validacao de estoque por prefixo (Cabin ativo):')

  let hasCriticalMissing = false

  for (const item of STOCK_PREFIXES) {
    const total = await prisma.cabin.count({
      where: {
        name: { startsWith: item.prefix },
        isActive: true,
      },
    })

    const statusLabel = total > 0 ? 'OK' : (item.required ? 'CRITICO' : 'OPCIONAL')
    console.log(`- ${item.label}: ${total} unidade(s) [${statusLabel}]`)

    if (item.required && total === 0) {
      hasCriticalMissing = true
    }
  }

  separator()

  try {
    const dayConfigCount = await prisma.reservationDayConfig.count()
    console.log(`ReservationDayConfig: tabela disponivel (${dayConfigCount} registro(s)).`)
  } catch {
    console.log('ReservationDayConfig: tabela ainda nao disponivel (migracao pendente).')
  }

  separator()
  if (hasCriticalMissing) {
    console.log('RESULTADO: BLOQUEANTE - faltam unidades obrigatorias de mesas em Cabin.')
    process.exitCode = 2
    return
  }

  console.log('RESULTADO: PRE-FLIGHT OK PARA SPRINT 2.1.1.')
}

main()
  .catch((error) => {
    if (error instanceof Error && (error.message === 'READ_BLOCKED' || error.message === 'DB_ENV_MISSING')) {
      return
    }
    console.error('Falha no preflight:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
