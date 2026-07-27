// AISSU Beach Lounge - Script para atualizar URLs de imagens do cardápio
// Execute: npx ts-node prisma/update-menu-images.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapeamento de itens do cardápio para URLs de imagens
// Baseado na estrutura: /cardapio/[Categoria]/[Nome do Arquivo].jpg
const imageMapping: Record<string, string> = {
    // === ÁGUA E REFRI ===
    'agua-mineral-s-gas-510ml': '/cardapio/Água e Refri/Água Mineral sem Gás - 510ml.jpg',
    'agua-mineral-c-gas-510ml': '/cardapio/Água e Refri/Água Mineral com Gás - 510ml.jpg',
    'guarana-lata-350ml': '/cardapio/Água e Refri/Guarana Lata 350ml .jpg',
    'guarana-zero-lata-350ml': '/cardapio/Água e Refri/Guarana zero Lata 350ml .jpg',
    'pepsi-cola-lata-350ml': '/cardapio/Água e Refri/Pepsi Cola - Lata - 350ml .jpg',
    'pepsi-black-zero-lata-350ml': '/cardapio/Água e Refri/Pepsi Black - Zero Lata 350ml .jpg',
    'soda-limonada-lata-350ml': '/cardapio/Água e Refri/Soda Limonada Lata 350ml .jpg',
    'soda-limonada-diet-lata-350ml': '/cardapio/Água e Refri/Soda Limonada Diet Lata 350ml .jpg',
    'sukita-laranja-lata-350ml': '/cardapio/Água e Refri/Sukita Laranja Lata 350ml .jpg',
    'sukita-uva-lata-350ml': '/cardapio/Água e Refri/Sukita Uva Lata 350ml .jpg',
    'h2o-limao-500ml': '/cardapio/Água e Refri/H2O Limão 500ml .jpg',
    'h2o-limoneto-500ml': '/cardapio/Água e Refri/H2O Limoneto 500ml .jpg',

    // === ENERGÉTICOS ===
    'red-bull-tradicional': '/cardapio/Energéticos/Red Bull - Tradicional .jpg',
    'red-bull-sugar-free': '/cardapio/Energéticos/Red Bull - Sugar Free .jpg',
    'red-bull-tropical': '/cardapio/Energéticos/Red Bull - Tropical .jpg',
    'red-bull-melancia': '/cardapio/Energéticos/Red Bull - Melancia .jpg',
    'red-bull-frutas-vermelhas': '/cardapio/Energéticos/Red Bull - Frutas Vermelhas .jpg',
    'red-bull-nectarina': '/cardapio/Energéticos/Red Bull - Nectarina .jpg',

    // === BEATS LONG NECK ===
    'beats-gin-tonica': '/cardapio/beats long neck/Beats - Gin & Tônica .jpg',
    'beats-senses': '/cardapio/beats long neck/Beats - Senses .jpg',

    // === CERVEJAS LONG NECK ===
    'corona-long-neck-330ml': '/cardapio/Cervejas - Long Neck 330ml/Corona - Long Neck - 330ml.jpg',
    'corona-cero': '/cardapio/Cervejas - Long Neck 330ml/Corona Cero (Zero Álcool).jpg',
    'stella-artois-long-neck-330ml': '/cardapio/Cervejas - Long Neck 330ml/Stella Artois - Long Neck - 330ml.jpg',
    'becks-long-neck-330ml': '/cardapio/Cervejas - Long Neck 330ml/Becks - Long Neck - 330ml .jpg',
    'spaten-long-neck-330ml': '/cardapio/Cervejas - Long Neck 330ml/Spaten - Long Neck - 330ml .jpg',

    // === ENTRADAS ===
    'ceviche': '/cardapio/Entradas/Ceviche.jpg',
    'gyoza-porco-frita': '/cardapio/Entradas/Gyoza de Porco frita .jpg',
    'gyoza-porco-vapor': '/cardapio/Entradas/Gyoza de Porco no vapor .jpg',

    // === PORÇÕES PARA DIVIDIR ===
    'batata-frita': '/cardapio/Porções Para Dividir/Batata Frita .jpg',
    'batata-smiles': '/cardapio/Porções Para Dividir/Batata Smiles .jpg',
    'mandioca-frita': '/cardapio/Porções Para Dividir/Mandioca Frita .jpg',
    'bolinho-costela': '/cardapio/Porções Para Dividir/Bolinho de Costela .jpg',
    'calabresa-acebolada': '/cardapio/Porções Para Dividir/Calabresa Acebolada .jpg',
    'camarao-jangadeiro': '/cardapio/Porções Para Dividir/Camarão Jangadeiro .jpg',
    'camarao-dore': '/cardapio/Porções Para Dividir/Camarão a Dorê .jpg',
    'lula-provencal': '/cardapio/Porções Para Dividir/Lula Provençal .jpg',
    'lula-dore': '/cardapio/Porções Para Dividir/Lula a Dorê .jpg',
    'pescada-dore': '/cardapio/Porções Para Dividir/Pescada a Dorê .jpg',
    'mignon-acebolado': '/cardapio/Porções Para Dividir/Mignon Acebolado .jpg',
    'mignon-cremoso-catupiry': '/cardapio/Porções Para Dividir/Mignon Cremoso com Catupiry .jpg',
    'cesta-paes': '/cardapio/Porções Para Dividir/Cesta de Pães .jpg',

    // === ESPETINHOS ===
    'espeto-kafta': '/cardapio/Espetinhos/Espeto de Kafta .jpg',
    'queijo-coalho': '/cardapio/Espetinhos/Queijo Coalho .jpg',

    // === PRATOS INDIVIDUAIS ===
    'risoto-camarao-limone': '/cardapio/Pratos Individuais/Risoto de Camarão ao Limone.jpg',
    'risoto-limao-siciliano-salmao': '/cardapio/Pratos Individuais/Risoto Limão Siciliano e Salmão.jpg',

    // === GIN & CIA ===
    'gin-tonica': '/cardapio/Gin & Cia/Gin Tônica .jpg',
    'gin-tropical': '/cardapio/Gin & Cia/Gin Tropical .jpg',
    'gin-melancia': '/cardapio/Gin & Cia/Gin + Melância .jpg',

    // === DRINKS CLÁSSICOS ===
    'aperol-spritz': '/cardapio/Drinks Clássicos/Aperol Spritz .jpg',
    'agua-verao': '/cardapio/Drinks Clássicos/Água de Verão - Não Alcólico .jpg',
    'ballena-colada': '/cardapio/Drinks Clássicos/Ballena Colada .jpg',
    'black-penicillin': '/cardapio/Drinks Clássicos/Black Penicillin .jpg',
    'campari-classico': '/cardapio/Drinks Clássicos/Campari - Clássico.jpg',
    'carajillo-licor-43': '/cardapio/Drinks Clássicos/Carajillo - Licor 43 .jpg',
    'clericot-aysu-jarra': '/cardapio/Drinks Clássicos/Clericot Aysú- Jarra 2L .jpg',
    'coffee-whisky': '/cardapio/Drinks Clássicos/Coffee & Whisky .jpg',
    'don-julio-margarita': '/cardapio/Drinks Clássicos/Don Julio Margarita .jpg',
    'dose-ballena': '/cardapio/Drinks Clássicos/Dose - Ballena .jpg',
    'dose-licor-43': '/cardapio/Drinks Clássicos/Dose - Licor 43 .jpg',
    'fitzgerald': '/cardapio/Drinks Clássicos/FitzGerald .jpg',
    'frangelico-soda-limao': '/cardapio/Drinks Clássicos/Frangelico - Soda e Limão .jpg',
    'mojito': '/cardapio/Drinks Clássicos/Mojito.jpg',
    'moscow-mule': '/cardapio/Drinks Clássicos/Moscow Mule .jpg',
    'negroni': '/cardapio/Drinks Clássicos/Negroni .jpg',
    'pe-na-areia': '/cardapio/Drinks Clássicos/Pé na Areia .jpg',
    'red-guarana': '/cardapio/Drinks Clássicos/Red & Guaraná .jpg',
    'sex-on-the-beach': '/cardapio/Drinks Clássicos/Sex On The Beach .jpg',

    // === CAIPIRINHAS ===
    'caipirinha-tradicional': '/cardapio/Caipirinhas - (Cachaça)/Caipirinhas - (Cachaça).jpg',

    // === GARRAFAS ===
    'vodka-absolut': '/cardapio/Garrafas/Garrafa - Vodka Absolut .jpg',
    'vodka-ketel-one': '/cardapio/Garrafas/Garrafa - Vodka Ketel One .jpg',
    'gin-beefeater': '/cardapio/Garrafas/Gin - Beefeater .jpg',
    'gin-gordons': '/cardapio/Garrafas/Gin - Gordon`s .jpg',
    'gin-tanqueray': '/cardapio/Garrafas/Gin - Tanqueray .jpg',
    'gin-yvy-mar': '/cardapio/Garrafas/Gin - Yvy - Mar .jpg',
    'gin-yvy-terra': '/cardapio/Garrafas/Gin - Yvy - Terra .jpg',
    'whisky-red-label': '/cardapio/Garrafas/Whisky - Red Label .jpg',
    'whisky-black-label': '/cardapio/Garrafas/Whisky - Black Label .jpg',
    'whisky-gold-label': '/cardapio/Garrafas/Whisky - Gold Label - 750ML .jpg',
    'espumante-chandon': '/cardapio/Garrafas/Espumante - Chandon .jpg',
    'espumante-chandon-passion': '/cardapio/Garrafas/Espumante - Chandon Passion .jpg',
    'espumante-go-up-rose': '/cardapio/Garrafas/Espumante - Go UP - Rosé .jpg',
    'espumante-salton': '/cardapio/Garrafas/Espumante - Salton .jpg',
    'vinho-go-up-rose': '/cardapio/Garrafas/Vinho - Go UP - Rosé .jpg',
    'vinho-go-up-sauvignon': '/cardapio/Garrafas/Vinho - Go UP - Sauvignon Blan .jpg',
    'vinho-cabernet-sauvignon': '/cardapio/Garrafas/Vinho -Cabernet Sauvignon .jpg',
    'vinho-carmenere': '/cardapio/Garrafas/Vinho -Carménère .jpg',
    'vinho-chardonnay': '/cardapio/Garrafas/Vinho -Chardonnay .jpg',
    'vinho-merlot': '/cardapio/Garrafas/Vinho -Merlot .jpg',
    'gelo-coco': '/cardapio/Garrafas/Gelo de Coco .jpg',
}

// Função para criar slug
const slugify = (text: string) =>
    text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

async function main() {
    console.log('🖼️  Atualizando imagens do cardápio...\n')

    let updated = 0
    let notFound = 0

    for (const [itemSlug, imageUrl] of Object.entries(imageMapping)) {
        // Tenta encontrar o item pelo slug aproximado
        const items = await prisma.menuItem.findMany({
            where: {
                id: {
                    contains: itemSlug.split('-').slice(0, 3).join('-'),
                },
            },
        })

        if (items.length > 0) {
            for (const item of items) {
                await prisma.menuItem.update({
                    where: { id: item.id },
                    data: { imageUrl },
                })
                console.log(`✅ ${item.name} → ${imageUrl}`)
                updated++
            }
        } else {
            // Tenta busca mais flexível pelo nome
            const fuzzyItems = await prisma.menuItem.findMany({
                where: {
                    OR: itemSlug.split('-').slice(0, 2).map(word => ({
                        name: { contains: word, mode: 'insensitive' as const },
                    })),
                },
            })

            if (fuzzyItems.length > 0) {
                const item = fuzzyItems[0]
                await prisma.menuItem.update({
                    where: { id: item.id },
                    data: { imageUrl },
                })
                console.log(`✅ ${item.name} → ${imageUrl}`)
                updated++
            } else {
                console.log(`⚠️  Item não encontrado: ${itemSlug}`)
                notFound++
            }
        }
    }

    console.log(`\n📊 Resumo: ${updated} atualizados, ${notFound} não encontrados`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
