
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@aysu.com.br'
    const password = 'TiagoBrenaSucesso2026#' // Senha atualizada
    const hashedPassword = await hash(password, 12)

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword,
            role: 'ADMIN',
            name: 'Admin Aysú',
            isActive: true,
        },
        create: {
            email,
            passwordHash: hashedPassword,
            role: 'ADMIN',
            name: 'Admin Aysú',
            isActive: true,
        },
    })

    console.log('✅ Admin user atualizado:')
    console.log(`- ID: ${user.id}`)
    console.log(`- Email: ${user.email}`)
    console.log(`- Role: ${user.role}`)
    console.log('- Senha: TiagoBrenaSucesso2026#')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
