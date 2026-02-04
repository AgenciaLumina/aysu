// Script para testar a API diretamente
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAPI() {
    console.log('\n🔍 TESTANDO O QUE A API RETORNA\n')
    console.log('='.repeat(80) + '\n')

    try {
        // Simula o que a API faz
        const reservations = await prisma.reservation.findMany({
            include: {
                cabin: {
                    select: {
                        id: true,
                        name: true,
                        capacity: true,
                        category: true,
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        console.log(`📊 Total de reservas encontradas: ${reservations.length}\n`)

        if (reservations.length === 0) {
            console.log('❌ NENHUMA RESERVA ENCONTRADA!\n')
        } else {
            console.log('✅ Reservas encontradas:')
            reservations.slice(0, 5).forEach((r, idx) => {
                console.log(`\n${idx + 1}. ${r.customerName}`)
                console.log(`   Cabin: ${r.cabin.name}`)
                console.log(`   Status: ${r.status}`)
                console.log(`   Check-in: ${r.checkIn}`)
            })
        }

        // Testa se o formato está correto
        console.log('\n' + '─'.repeat(80))
        console.log('\n📦 Formato de retorno da API:')
        console.log(JSON.stringify({
            success: true,
            data: reservations.slice(0, 2),
            total: reservations.length,
        }, null, 2).substring(0, 500) + '...')

    } catch (error) {
        console.error('\n❌ ERRO AO BUSCAR RESERVAS:', error)
    } finally {
        await prisma.$disconnect()
    }
}

testAPI()
