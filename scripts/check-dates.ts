// Script para verificar datas reais no banco
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function toLocalISODate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

async function main() {
    console.log('\n📅 VERIFICANDO DATAS REAIS NO BANCO\n')
    console.log('='.repeat(80) + '\n')

    const reservations = await prisma.reservation.findMany({
        include: { cabin: true },
        orderBy: { checkIn: 'asc' },
    })

    reservations.forEach((r, idx) => {
        const checkInDate = toLocalISODate(r.checkIn)
        const checkInTime = r.checkIn.toISOString()

        console.log(`${idx + 1}. ${r.customerName} - ${r.cabin.name}`)
        console.log(`   Data no banco: ${checkInDate}`)
        console.log(`   Timestamp completo: ${checkInTime}`)
        console.log(`   Total Price: R$ ${Number(r.totalPrice).toFixed(2)}`)
        console.log('')
    })

    await prisma.$disconnect()
}

main()
