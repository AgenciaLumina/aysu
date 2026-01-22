import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Limpar galeria
    await prisma.galleryImage.deleteMany()
    console.log('✅ Galeria limpa')

    // Verificar cabins sem imagem
    const cabins = await prisma.cabin.findMany({
        select: { id: true, name: true, imageUrl: true }
    })

    console.log('\n📋 Bangalôs:')
    cabins.forEach(c => {
        console.log(`${c.imageUrl ? '✅' : '❌'} ${c.name}: ${c.imageUrl || 'SEM IMAGEM'}`)
    })

    await prisma.$disconnect()
}

main()
