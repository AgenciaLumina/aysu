import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const newPassword = await bcrypt.hash('TiagoBrenaSucesso2026#', 10)
    const newEmail = 'admin@aysubeachlounge.com.br'

    // Try to find existing admin
    const existing = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
    })

    if (existing) {
        const updated = await prisma.user.update({
            where: { id: existing.id },
            data: {
                email: newEmail,
                passwordHash: newPassword,
            },
        })
        console.log('Admin atualizado:', updated.email)
    } else {
        const created = await prisma.user.create({
            data: {
                email: newEmail,
                name: 'Administrador AISSU',
                role: 'ADMIN',
                passwordHash: newPassword,
                phone: '(12) 99999-9999',
                isActive: true,
            },
        })
        console.log('Admin criado:', created.email)
    }
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
