import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function check() {
    console.log('🔍 Verificando Menu Items...')
    const menuItems = await prisma.menuItem.findMany({
        where: { imageUrl: { not: null } },
        select: { name: true, imageUrl: true },
        take: 5
    })

    console.log('\n📋 Primeiros 5 itens do menu:')
    menuItems.forEach(item => {
        const isR2 = item.imageUrl?.includes('cdn.aysubeachlounge.com.br')
        console.log(`${isR2 ? '✅' : '❌'} ${item.name}: ${item.imageUrl}`)
    })

    console.log('\n🖼️ Verificando Gallery...')
    const galleryCount = await prisma.galleryImage.count()
    console.log(`Total de imagens na galeria: ${galleryCount}`)

    await prisma.$disconnect()
}

check()
