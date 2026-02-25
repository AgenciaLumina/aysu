import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CORRECT_PRICES = {
  'bangalo-lateral': { normalPrice: 600, normalConsumable: 500, holidayPrice: 1000, holidayConsumable: 700 },
  'bangalo-piscina': { normalPrice: 600, normalConsumable: 500, holidayPrice: 1800, holidayConsumable: 1300 },
  'bangalo-frente-mar': { normalPrice: 720, normalConsumable: 600, holidayPrice: 1800, holidayConsumable: 1300 },
  'bangalo-central': { normalPrice: 1500, normalConsumable: 1200, holidayPrice: 2500, holidayConsumable: 2000 },
  'sunbed-casal': { normalPrice: 250, normalConsumable: 200, holidayPrice: 500, holidayConsumable: 350 },
}

const HOLIDAY_DATES = [
  '2026-02-13',
  '2026-02-14',
  '2026-02-15',
  '2026-02-16',
  '2026-02-17',
  '2026-02-18',
]

function hasFlag(flag) {
  return process.argv.includes(flag)
}

function assertReadSafety() {
  if (process.env.ALLOW_DB_READ === '1') return

  console.error('BLOCKED: safe mode active for database.')
  console.error('To run read-only audit, use:')
  console.error('ALLOW_DB_READ=1 node scripts/audit-and-fix-reservations.mjs')
  throw new Error('READ_BLOCKED')
}

function assertDatabaseEnv() {
  if (process.env.DATABASE_URL && process.env.DIRECT_URL) return

  console.error('BLOCKED: database environment variables are missing.')
  console.error('Define DATABASE_URL and DIRECT_URL before running this script.')
  throw new Error('DB_ENV_MISSING')
}

function assertWriteSafety() {
  const allowWrite = process.env.ALLOW_DB_WRITE === '1'
  const acknowledged = hasFlag('--i-understand-this-writes')

  if (allowWrite && acknowledged) return

  console.error('BLOCKED: write attempt without explicit confirmation.')
  console.error('To apply fixes, run:')
  console.error('ALLOW_DB_READ=1 ALLOW_DB_WRITE=1 node scripts/audit-and-fix-reservations.mjs --apply --i-understand-this-writes')
  throw new Error('WRITE_BLOCKED')
}

function toLocalISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isHoliday(dateStr) {
  return HOLIDAY_DATES.includes(dateStr)
}

function getCabinType(cabinName) {
  if (cabinName.startsWith('Bangalô Lateral')) return 'bangalo-lateral'
  if (cabinName.startsWith('Bangalô Piscina')) return 'bangalo-piscina'
  if (cabinName.startsWith('Bangalô Frente Mar')) return 'bangalo-frente-mar'
  if (cabinName.startsWith('Bangalô Central')) return 'bangalo-central'
  if (cabinName.startsWith('Sunbed Casal')) return 'sunbed-casal'
  return null
}

function getExpectedPrice(cabinType, dateStr) {
  const config = CORRECT_PRICES[cabinType]
  if (!config) return 0
  return isHoliday(dateStr) ? config.holidayPrice : config.normalPrice
}

async function auditReservations() {
  console.log('Starting reservation audit...\n')

  const reservations = await prisma.reservation.findMany({
    include: { cabin: true },
    orderBy: { checkIn: 'asc' },
  })

  console.log(`Total reservations found: ${reservations.length}\n`)

  const issues = []

  for (const reservation of reservations) {
    const cabinType = getCabinType(reservation.cabin.name)
    if (!cabinType) continue

    const checkInDateStr = toLocalISODate(reservation.checkIn)
    const expectedPrice = getExpectedPrice(cabinType, checkInDateStr)
    const currentPrice = Number(reservation.totalPrice)
    const priceDifference = Math.abs(currentPrice - expectedPrice)

    if (priceDifference <= 1) continue

    let issue = 'PRICE_INCORRECT'
    let severity = 'MEDIUM'

    const pricePerHour = Number(reservation.cabin.pricePerHour)
    const calculatedPrice = pricePerHour * 8

    if (Math.abs(currentPrice - calculatedPrice) < 1) {
      issue = 'PRICE_MULTIPLIED'
      severity = 'HIGH'
    }

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

  return issues
}

function printReport(issues) {
  console.log('\n' + '='.repeat(80))
  console.log('RESERVATION AUDIT REPORT - ISSUES FOUND')
  console.log('='.repeat(80) + '\n')

  if (issues.length === 0) {
    console.log('No problems found.\n')
    return
  }

  const high = issues.filter(i => i.severity === 'HIGH').length
  const medium = issues.filter(i => i.severity === 'MEDIUM').length
  const low = issues.filter(i => i.severity === 'LOW').length

  console.log(`High priority: ${high}`)
  console.log(`Medium priority: ${medium}`)
  console.log(`Low priority: ${low}`)
  console.log(`Total issues: ${issues.length}\n`)

  console.log('-'.repeat(80) + '\n')

  issues.forEach((issue, index) => {
    console.log(`Issue #${index + 1} - ${issue.issue} (${issue.severity})`)
    console.log(`  ID: ${issue.id.slice(0, 8)}...`)
    console.log(`  Customer: ${issue.customerName}`)
    console.log(`  Cabin: ${issue.cabinName}`)
    console.log(`  Date: ${issue.checkInDate}`)
    console.log(`  Current Price: ${issue.currentPrice.toFixed(2)}`)
    console.log(`  Expected Price: ${issue.expectedPrice.toFixed(2)}`)
    console.log(`  Difference: ${issue.priceDifference.toFixed(2)}\n`)
  })
}

async function fixReservations(issues, dryRun = true) {
  if (issues.length === 0) {
    console.log('Nothing to fix.\n')
    return
  }

  console.log('\n' + '='.repeat(80))
  console.log(dryRun ? 'DRY RUN MODE - no changes will be written' : 'WRITE MODE - applying changes to database')
  console.log('='.repeat(80) + '\n')

  let fixedCount = 0

  for (const issue of issues) {
    if (dryRun) {
      console.log(`[DRY RUN] Would update ${issue.id.slice(0, 8)}...`)
      console.log(`  ${issue.currentPrice.toFixed(2)} -> ${issue.expectedPrice.toFixed(2)}\n`)
      continue
    }

    await prisma.reservation.update({
      where: { id: issue.id },
      data: { totalPrice: issue.expectedPrice },
    })

    console.log(`[APPLIED] ${issue.id.slice(0, 8)} updated`)
    fixedCount++
  }

  if (dryRun) {
    console.log(`\n${issues.length} reservation(s) would be fixed.\n`)
  } else {
    console.log(`\n${fixedCount} reservation(s) fixed.\n`)
  }
}

async function main() {
  console.log('\nAISSU - Reservation Audit\n')

  try {
    assertReadSafety()
    assertDatabaseEnv()

    const issues = await auditReservations()
    printReport(issues)

    if (issues.length === 0) return

    console.log('Running dry run...\n')
    await fixReservations(issues, true)

    console.log('='.repeat(80))
    console.log('To apply fixes:')
    console.log('ALLOW_DB_READ=1 ALLOW_DB_WRITE=1 node scripts/audit-and-fix-reservations.mjs --apply --i-understand-this-writes')
    console.log('='.repeat(80) + '\n')

    if (hasFlag('--apply')) {
      assertWriteSafety()
      await fixReservations(issues, false)
    }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'READ_BLOCKED' || error.message === 'WRITE_BLOCKED' || error.message === 'DB_ENV_MISSING')
    ) {
      return
    }

    console.error('Execution error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
