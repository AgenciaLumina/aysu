import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const reservations = await prisma.reservation.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, customerName: true, createdAt: true, status: true }
    });
    console.log(JSON.stringify(reservations, null, 2));
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => await prisma.$disconnect());
