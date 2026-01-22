import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { uploadToR2 } from './src/lib/r2.js'
import sharp from 'sharp'

const prisma = new PrismaClient()
const ESPACOS_DIR = path.join(process.cwd(), 'public', 'espacos')

async function associateCabinImages() {
    console.log('🏖️ Associando imagens aos bangalôs...')

    // Mapeamento de imagens para bangalôs
    const imageMapping = [
        { pattern: 'bangalo7', cabinPattern: 'Frente Mar', imageFile: 'bangalo7.jpeg' },
        { pattern: 'bangalo8', cabinPattern: 'Piscina', imageFile: 'bangalo8.jpeg' },
        { pattern: 'bangalo9', cabinPattern: 'Central Flagship', imageFile: 'bangalo9.jpeg' },
        { pattern: 'bangalo10', cabinPattern: 'Lateral', imageFile: 'bangalo10.jpeg' },
        { pattern: 'sunbed', cabinPattern: 'Sunbed', imageFile: 'Sunbeds.jpeg' },
    ]

    for (const mapping of imageMapping) {
        const filePath = path.join(ESPACOS_DIR, mapping.imageFile)

        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ Arquivo não encontrado: ${mapping.imageFile}`)
            continue
        }

        // Converter para AVIF
        const inputBuffer = fs.readFileSync(filePath)
        const outputBuffer = await sharp(inputBuffer)
            .avif({ quality: 80, effort: 4 })
            .toBuffer()

        const sanitizedName = mapping.imageFile.replace(/\\.jpeg$/, '').toLowerCase()
        const r2Key = `cabins/${sanitizedName}.avif`

        // Upload para R2
        const { url } = await uploadToR2(outputBuffer, r2Key, 'image/avif')
        console.log(`✅ Upload: ${url}`)

        // Atualizar bangalôs que correspondem ao padrão
        const result = await prisma.cabin.updateMany({
            where: {
                name: { contains: mapping.cabinPattern }
            },
            data: {
                imageUrl: url
            }
        })

        console.log(`   Atualizados: ${result.count} bangalôs com padrão "${mapping.cabinPattern}"`)
    }

    console.log('\n✅ Imagens associadas!')
    await prisma.$disconnect()
}

associateCabinImages()
