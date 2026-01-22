// Script para migrar imagens do cardápio local para Cloudflare R2 - Versão V4: AVIF Otimizado
// Uso: npx tsx src/scripts/migrate-menu-to-r2.ts

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { uploadToR2 } from '../lib/r2'
import { PrismaClient } from '@prisma/client'
import sharp from 'sharp'

const prisma = new PrismaClient()

const LOCAL_MENU_DIR = path.join(process.cwd(), 'public', 'cardapio')
const R2_PREFIX = 'menu'

function sanitizeFilename(filename: string): string {
    return filename
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9.-]/g, '')
        .toLowerCase()
}

function aggressiveSlugify(str: string): string {
    return str
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
}

async function getAllFiles(dir: string): Promise<string[]> {
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true })
    const files = await Promise.all(dirents.map((dirent) => {
        const res = path.resolve(dir, dirent.name)
        return dirent.isDirectory() ? getAllFiles(res) : res
    }))
    return Array.prototype.concat(...files)
}

async function migrate() {
    console.log('🚀 Iniciando migração de imagens para R2 (V4 - Otimização AVIF)...')

    try {
        const files = await getAllFiles(LOCAL_MENU_DIR)
        console.log(`📂 Encontrados ${files.length} arquivos para processar`)

        const mapping: Record<string, string> = {}

        for (const file of files) {
            if (path.basename(file).startsWith('.')) continue
            if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) continue

            const relativePath = path.relative(LOCAL_MENU_DIR, file)

            // Definir nova key com extensão .avif
            const parts = relativePath.split(path.sep)
            const sanitizedParts = parts.map(p => sanitizeFilename(p))

            // Trocar extensão do último pedaço (arquivo) para avif
            const filename = sanitizedParts[sanitizedParts.length - 1]
            const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename
            sanitizedParts[sanitizedParts.length - 1] = `${nameWithoutExt}.avif`

            const r2Key = `${R2_PREFIX}/${sanitizedParts.join('/')}`

            // Ler e Converter
            const inputBuffer = fs.readFileSync(file)

            let outputBuffer: Buffer
            try {
                outputBuffer = await sharp(inputBuffer)
                    .avif({ quality: 80, effort: 4 }) // Compressão inteligente
                    .toBuffer()

                const originalSize = inputBuffer.length / 1024
                const newSize = outputBuffer.length / 1024

                if (Math.random() > 0.8) {
                    console.log(`✨ Otimizado: ${path.basename(relativePath)} (${originalSize.toFixed(1)}kb -> ${newSize.toFixed(1)}kb)`)
                }
            } catch (err) {
                console.error(`❌ Erro ao converter ${relativePath}:`, err)
                continue
            }

            // Upload
            try {
                const res = await uploadToR2(
                    outputBuffer,
                    r2Key,
                    'image/avif'
                )

                // POPULAR MAPPING (Slugify Radical)
                // A chave deve dar match com o arquivo original (ex: file.jpg), 
                // mas o valor será a URL nova (file.avif)

                const fullSlug = aggressiveSlugify(relativePath)
                mapping[fullSlug] = res.url

                const filenameSlug = aggressiveSlugify(path.basename(relativePath))
                mapping[filenameSlug] = res.url

            } catch (err) {
                console.error('Upload failed', err)
            }
        }

        console.log(`📝 Mapping AVIF criado. Atualizando banco...`)

        const items = await prisma.menuItem.findMany({
            where: { imageUrl: { not: null } }
        })

        let updatedCount = 0

        for (const item of items) {
            if (!item.imageUrl) continue

            // Se já for AVIF no R2, talvez pular? 
            // Melhor re-verificar para garantir que está usando a versão otimizada
            // Se a URL já termina em .avif e está no CDN correto, ok ignorar?
            if (item.imageUrl.includes('cdn.aysubeachlounge.com.br') && item.imageUrl.endsWith('.avif')) {
                continue
            }

            const decodedUrl = decodeURIComponent(item.imageUrl)
            // Remover prefixo/host se houver para pegar o "path original" limpo
            // Paths antigos: /cardapio/...
            // Paths do seed antigo/banco podem estar variados.

            // Estratégia: pegar apenas o nome do arquivo e pasta pai se possível
            // Mas nosso slugify radical deve resolver

            let cleanPath = decodedUrl
            if (cleanPath.startsWith('http')) {
                cleanPath = cleanPath.split('/').slice(3).join('/') // remove protocolo e domain
            }
            cleanPath = cleanPath.replace(/^\/cardapio\//, '').replace(/^\/menu\//, '').replace(/^\//, '')

            // Tentar match
            const dbFullSlug = aggressiveSlugify(cleanPath)
            let newUrl = mapping[dbFullSlug]

            if (!newUrl) {
                const dbFilenameSlug = aggressiveSlugify(path.basename(cleanPath))
                newUrl = mapping[dbFilenameSlug]
            }

            if (newUrl) {
                await prisma.menuItem.update({
                    where: { id: item.id },
                    data: { imageUrl: newUrl }
                })
                updatedCount++
                console.log(`✅ OTIMIZADO: ${item.name} -> AVIF`)
            } else {
                // Ignore se já foi processado ou se realmente falhou
                // console.warn(`⚠️  SEM MATCH AVIF: ${item.name}`)
            }
        }

        console.log(`\n🎉 Migração AVIF concluída! ${updatedCount} itens atualizados.`)

    } catch (error) {
        console.error('Fatal error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

migrate()
