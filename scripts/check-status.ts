// Verificar status das reservas
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('\n📊 STATUS DAS RESERVAS\n')
    console.log('='.repeat(80) + '\n')

    const reservations = await prisma.reservation.findMany({
        include: { cabin: true },
        orderBy: { checkIn: 'asc' },
    })

    console.log(`Total: ${reservations.length} reservas\n`)

    // Agrupar por status
    const byStatus: Record<string, number> = {}

    reservations.forEach(r => {
        byStatus[r.status] = (byStatus[r.status] || 0) + 1
        console.log(`${r.customerName.padEnd(20)} | ${r.cabin.name.padEnd(25)} | Status: ${r.status}`)
    })

    console.log('\n' + '─'.repeat(80) + '\n')
    console.log('📈 Por Status:')
    Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`   ${status}: ${count} reservas`)
    })

    await prisma.$disconnect()
}

main()
