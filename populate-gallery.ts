import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { uploadToR2 } from './src/lib/r2.js'
import sharp from 'sharp'

const prisma = new PrismaClient()

const ESPACOS_DIR = path.join(process.cwd(), 'public', 'espacos')

async function populateGallery() {
    console.log('🖼️ Populando galeria com imagens dos espaços...')

    const images = [
        { file: 'bangalo7.jpeg', caption: 'Bangalô Vista Mar', order: 1 },
        { file: 'bangalo8.jpeg', caption: 'Bangalô Piscina Privativa', order: 2 },
        { file: 'bangalo9.jpeg', caption: 'Bangalô Central Flagship', order: 3 },
        { file: 'bangalo10.jpeg', caption: 'Bangalô Lateral', order: 4 },
        { file: 'Sunbeds.jpeg', caption: 'Sunbeds à Beira-Mar', order: 5 },
    ]

    for (const img of images) {
        const filePath = path.join(ESPACOS_DIR, img.file)

        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ Arquivo não encontrado: ${img.file}`)
            continue
        }

        // Ler e converter para AVIF
        const inputBuffer = fs.readFileSync(filePath)
        const outputBuffer = await sharp(inputBuffer)
            .avif({ quality: 80, effort: 4 })
            .toBuffer()

        const sanitizedName = img.file.replace(/\\.jpeg$/, '').toLowerCase()
        const r2Key = `gallery/${sanitizedName}.avif`

        // Upload para R2
        const { url } = await uploadToR2(outputBuffer, r2Key, 'image/avif')

        // Salvar no banco
        await prisma.galleryImage.create({
            data: {
                imageUrl: url,
                caption: img.caption,
                displayOrder: img.order,
                isActive: true,
            }
        })

        console.log(`✅ ${img.caption} -> ${url}`)
    }

    console.log('\\n🎉 Galeria populada com sucesso!')
    await prisma.$disconnect()
}

populateGallery()
