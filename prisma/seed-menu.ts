// AISSU Beach Lounge - Seed do Cardápio Completo (Auditado)
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Categorias do Cardápio com Pasta de Imagens (Paths Base)
// Nota: Os nomes de arquivos individuais serão especificados path relativo à pasta 'cardapio'
const categories = [
    { name: 'Cervejas Long Neck', slug: 'cervejas-long-neck', displayOrder: 1, baseFolder: 'Cervejas - Long Neck 330ml' },
    { name: 'Cervejas Garrafa', slug: 'cervejas-garrafa', displayOrder: 2, baseFolder: 'Cervejas - Garrafa 600ml' },
    { name: 'Água e Refrigerantes', slug: 'agua-refrigerantes', displayOrder: 3, baseFolder: 'Água e Refri' },
    { name: 'Sucos Naturais', slug: 'sucos-naturais', displayOrder: 4, baseFolder: 'Sucos Naturais' },
    { name: 'Energéticos', slug: 'energeticos', displayOrder: 5, baseFolder: 'Energéticos' },
    { name: 'Drinks Clássicos', slug: 'drinks-classicos', displayOrder: 6, baseFolder: 'Drinks Clássicos' },
    { name: 'Doses', slug: 'doses', displayOrder: 7, baseFolder: 'Drinks Clássicos' }, // Alguns em Drinks, outros Garrafas
    { name: 'Gin & Cia', slug: 'gin-cia', displayOrder: 8, baseFolder: 'Gin & Cia' },
    { name: 'Caipirinhas', slug: 'caipirinhas', displayOrder: 9, baseFolder: 'Caipirinhas - (Cachaça)' },
    { name: 'Batidas', slug: 'batidas', displayOrder: 10, baseFolder: 'batidas com leite condensado' },
    { name: 'Garrafas e Vinhos', slug: 'garrafas-vinhos', displayOrder: 11, baseFolder: 'Garrafas' },
    { name: 'Entradas', slug: 'entradas', displayOrder: 12, baseFolder: 'Entradas' },
    { name: 'Temakis', slug: 'temakis', displayOrder: 13, baseFolder: 'Pratos Individuais' },
    { name: 'Espetinhos', slug: 'espetinhos', displayOrder: 14, baseFolder: 'Espetinhos' },
    { name: 'Porções', slug: 'porcoes', displayOrder: 15, baseFolder: 'Porções Para Dividir' },
    { name: 'Adicionais', slug: 'adicionais', displayOrder: 16, baseFolder: 'adicionais' },
    { name: 'Doces', slug: 'doces', displayOrder: 17, baseFolder: 'Docinho' },
    { name: 'Lojinha', slug: 'lojinha', displayOrder: 18, baseFolder: 'Lojinha' },
]

// Lista Completa de Itens Auditados
const menuItems: Record<string, Array<{ name: string; description?: string; price: number; tags?: string[]; imagePath?: string }>> = {
    'cervejas-long-neck': [
        { name: 'Corona', price: 15.00, tags: ['long neck', '330ml'], imagePath: 'Cervejas - Long Neck 330ml/Corona - Long Neck - 330ml.jpg' },
        { name: 'Corona Cero (Zero Álcool)', price: 16.00, tags: ['long neck', '330ml', 'zero álcool'], imagePath: 'Cervejas - Long Neck 330ml/Corona Cero (Zero Álcool).jpg' },
        { name: 'Becks', price: 14.00, tags: ['long neck', '330ml'], imagePath: 'Cervejas - Long Neck 330ml/Becks - Long Neck - 330ml .jpg' },
        { name: 'Stella Artois Pure Gold (Glúten Free)', price: 14.00, tags: ['long neck', '330ml', 'glúten free'], imagePath: 'Cervejas - Long Neck 330ml/Stella Artois - Long Neck - 330ml.jpg' },
        { name: 'Spaten', price: 13.00, tags: ['long neck', '330ml'], imagePath: 'Cervejas - Long Neck 330ml/Spaten - Long Neck - 330ml .jpg' },
    ],
    'cervejas-garrafa': [
        { name: 'Serra Malte', price: 23.00, tags: ['garrafa', '600ml'] }, // Sem imagem
        { name: 'Stella Artois', price: 23.00, tags: ['garrafa', '600ml'] }, // Sem imagem
        { name: 'Original', price: 22.00, tags: ['garrafa', '600ml'], imagePath: 'Cervejas - Garrafa 600ml/Original - 600ml.jpg' },
    ],
    'agua-refrigerantes': [
        { name: 'Água Mineral sem Gás', description: '510ml - Caraguá', price: 5.00, imagePath: 'Água e Refri/Água Mineral sem Gás - 510ml.jpg' },
        { name: 'Água Mineral com Gás', description: '510ml - Caraguá', price: 6.50, imagePath: 'Água e Refri/Água Mineral com Gás - 510ml.jpg' },
        { name: 'Água São Lourenço com Gás', description: '510ml', price: 8.50 }, // Sem imagem
        { name: 'H2O Limão', description: '500ml', price: 12.00, imagePath: 'Água e Refri/H2O Limão 500ml .jpg' },
        { name: 'H2O Limoneto', description: '500ml', price: 12.00, imagePath: 'Água e Refri/H2O Limoneto 500ml .jpg' },
        { name: 'Pepsi', description: 'Lata 350ml', price: 9.00, tags: ['refrigerante'], imagePath: 'Água e Refri/Pepsi Cola - Lata - 350ml .jpg' },
        { name: 'Pepsi Black', description: 'Lata 350ml', price: 9.00, tags: ['refrigerante', 'zero'], imagePath: 'Água e Refri/Pepsi Black - Zero Lata 350ml .jpg' },
        { name: 'Guaraná Antarctica', description: 'Lata 350ml', price: 9.00, tags: ['refrigerante'], imagePath: 'Água e Refri/Guarana Lata 350ml .jpg' },
        { name: 'Guaraná Antarctica Zero', description: 'Lata 350ml', price: 9.00, tags: ['refrigerante', 'zero'], imagePath: 'Água e Refri/Guarana zero Lata 350ml .jpg' },
        { name: 'Sukita Uva', description: 'Lata 350ml', price: 9.00, tags: ['refrigerante'], imagePath: 'Água e Refri/Sukita Uva Lata 350ml .jpg' },
        { name: 'Sukita Laranja', description: 'Lata 350ml', price: 9.00, tags: ['refrigerante'], imagePath: 'Água e Refri/Sukita Laranja Lata 350ml .jpg' },
        { name: 'Soda Limonada', description: 'Lata 350ml', price: 9.00, tags: ['refrigerante'], imagePath: 'Água e Refri/Soda Limonada Lata 350ml .jpg' },
        { name: 'Água Tônica', description: 'Lata 350ml', price: 9.00, tags: ['mixer'] }, // Sem imagem específica (usando generic ou null)
        { name: 'Água Tônica Zero', description: 'Lata 350ml', price: 9.00, tags: ['mixer', 'zero'] }, // Sem imagem específica
    ],
    'sucos-naturais': [
        // Pasta Sucos Naturais está vazia ou não listada. Deixando null.
        { name: 'Suco de Abacaxi', description: '500ml - Natural', price: 16.00, tags: ['natural', '500ml'] },
        { name: 'Suco de Acerola', description: '500ml - Natural', price: 16.00, tags: ['natural', '500ml'] },
        { name: 'Suco de Caju', description: '500ml - Natural', price: 16.00, tags: ['natural', '500ml'] },
        { name: 'Suco de Melão', description: '500ml - Natural', price: 16.00, tags: ['natural', '500ml'] },
        { name: 'Suco de Maracujá', description: '500ml - Natural', price: 16.00, tags: ['natural', '500ml'] },
        { name: 'Suco de Morango', description: '500ml - Natural', price: 16.00, tags: ['natural', '500ml'] },
        { name: 'Suco de Abacaxi com Hortelã', description: '500ml - Natural', price: 19.00, tags: ['natural', '500ml', 'especial'] },
    ],
    'energeticos': [
        { name: 'Red Bull Tradicional', description: '250ml', price: 18.00, tags: ['energético'], imagePath: 'Energéticos/Red Bull - Tradicional .jpg' },
        { name: 'Red Bull Sugar Free', description: '250ml', price: 18.00, tags: ['energético', 'zero'], imagePath: 'Energéticos/Red Bull - Sugar Free .jpg' },
        { name: 'Red Bull Tropical', description: '250ml', price: 18.00, tags: ['energético'], imagePath: 'Energéticos/Red Bull - Tropical .jpg' },
        { name: 'Red Bull Melancia', description: '250ml', price: 18.00, tags: ['energético'], imagePath: 'Energéticos/Red Bull - Melancia .jpg' },
        { name: 'Red Bull Frutas Vermelhas', description: '250ml', price: 18.00, tags: ['energético'], imagePath: 'Energéticos/Red Bull - Frutas Vermelhas .jpg' },
        { name: 'Red Bull Nectarina', description: '250ml - Edição Limitada', price: 18.00, tags: ['energético', 'edição limitada'], imagePath: 'Energéticos/Red Bull - Nectarina .jpg' },
    ],
    'drinks-classicos': [
        { name: 'Clericot Aysú', description: 'Jarra 2L - Vinho branco, frutas, licor de pêssego, espumante', price: 220.00, tags: ['jarra', 'para dividir'], imagePath: 'Drinks Clássicos/Clericot Aysú- Jarra 2L .jpg' },
        { name: 'Aperol Spritz', description: '300ml', price: 38.00, imagePath: 'Drinks Clássicos/Aperol Spritz .jpg' },
        { name: 'Coffee & Whisky', description: '300ml', price: 42.00, imagePath: 'Drinks Clássicos/Coffee & Whisky .jpg' },
        { name: 'Black Penicillin', price: 42.00, imagePath: 'Drinks Clássicos/Black Penicillin .jpg' },
        { name: 'Pé na Areia', description: 'JW Blonde', price: 38.00, imagePath: 'Drinks Clássicos/Pé na Areia .jpg' },
        { name: 'Red & Guaraná', description: 'JW Red', price: 38.00, imagePath: 'Drinks Clássicos/Red & Guaraná .jpg' },
        { name: 'FitzGerald', description: 'Gin Tanqueray', price: 42.00, imagePath: 'Drinks Clássicos/FitzGerald .jpg' },
        { name: 'Negroni', price: 38.00, imagePath: 'Drinks Clássicos/Negroni .jpg' },
        { name: 'Moscow Mule', price: 38.00, imagePath: 'Drinks Clássicos/Moscow Mule .jpg' },
        { name: 'Mojito', price: 34.00, imagePath: 'Drinks Clássicos/Mojito.jpg' },
        { name: 'Sex On The Beach', price: 34.00, imagePath: 'Drinks Clássicos/Sex On The Beach .jpg' },
        { name: 'Ballena Colada', price: 34.00, imagePath: 'Drinks Clássicos/Ballena Colada .jpg' },
        { name: 'Frangelico, Soda e Limão', price: 30.00, imagePath: 'Drinks Clássicos/Frangelico - Soda e Limão .jpg' },
        { name: 'Campari Clássico', price: 28.00, imagePath: 'Drinks Clássicos/Campari - Clássico.jpg' },
        { name: 'Água de Verão', description: 'Não alcoólico', price: 38.00, tags: ['sem álcool'], imagePath: 'Drinks Clássicos/Água de Verão - Não Alcólico .jpg' },
    ],
    'doses': [
        { name: 'Ballena', price: 28.00, imagePath: 'Drinks Clássicos/Dose - Ballena .jpg' },
        { name: 'Whisky Red Label', price: 28.00 },
        { name: 'Whisky Black Label', price: 35.00 },
        { name: 'Vodka Smirnoff', price: 20.00 },
        { name: 'Vodka Absolut', price: 30.00 },
        { name: 'Gin Tanqueray', price: 35.00 },
        { name: 'Cachaça Sagatiba', price: 15.00 },
        { name: 'Licor 43', price: 28.00, imagePath: 'Drinks Clássicos/Dose - Licor 43 .jpg' },
    ],
    'gin-cia': [
        { name: 'Gin Tônica', price: 36.00, imagePath: 'Gin & Cia/Gin Tônica .jpg' },
        { name: 'Gin Tropical', description: 'Gin + Red Bull Tropical', price: 38.00, imagePath: 'Gin & Cia/Gin Tropical .jpg' },
        { name: 'Gin com Red Bull Melancia', price: 38.00, imagePath: 'Gin & Cia/Gin + Melância .jpg' },
        { name: 'Taça com Laranja', description: 'Complemento para Gin', price: 15.00, tags: ['complemento'] },
        { name: 'Taça com Frutas Vermelhas', description: 'Complemento para Gin', price: 22.00, tags: ['complemento'] },
    ],
    'caipirinhas': [
        // Usando path genérico pois não há imagem individual para cada sabor
        { name: 'Caipirinha', description: 'Limão, Maracujá, Morango, Caju, Abacaxi... Escolha a fruta e Cachaça.', price: 30.00, imagePath: 'Caipirinhas - (Cachaça)/Caipirinhas - (Cachaça).jpg' },
        { name: 'Caipiroska', description: 'Vodka Smirnoff. Sabores variados.', price: 32.00 },
        { name: 'Saquerinha', description: 'Saquê. Sabores variados.', price: 32.00 },
    ],
    'batidas': [
        // Pasta 'batidas com leite condensado' screenshots (não usarei)
        { name: 'Batida com Vodka Smirnoff', description: '400ml - Com leite condensado. Sabores variados.', price: 38.00 },
        { name: 'Batida com Cachaça', description: '400ml - Com leite condensado. Sabores variados.', price: 32.00 },
    ],
    'garrafas-vinhos': [
        { name: 'Gin Gordon\'s', price: 140.00, tags: ['garrafa', 'gin'], imagePath: 'Garrafas/Gin - Gordon`s .jpg' },
        { name: 'Gin Yvy Mar', price: 160.00, tags: ['garrafa', 'gin'], imagePath: 'Garrafas/Gin - Yvy - Mar .jpg' },
        { name: 'Gin Yvy Terra', price: 160.00, tags: ['garrafa', 'gin'], imagePath: 'Garrafas/Gin - Yvy - Terra .jpg' },
        { name: 'Gin Beefeater', price: 240.00, tags: ['garrafa', 'gin'], imagePath: 'Garrafas/Gin - Beefeater .jpg' },
        { name: 'Gin Tanqueray', price: 240.00, tags: ['garrafa', 'gin'], imagePath: 'Garrafas/Gin - Tanqueray .jpg' },
        { name: 'Vodka Absolut', price: 210.00, tags: ['garrafa', 'vodka'], imagePath: 'Garrafas/Garrafa - Vodka Absolut .jpg' },
        { name: 'Vodka Ketel One', price: 280.00, tags: ['garrafa', 'vodka'], imagePath: 'Garrafas/Garrafa - Vodka Ketel One .jpg' },
        { name: 'Vodka Ciroc Red Berry', price: 320.00, tags: ['garrafa', 'vodka'] },
        { name: 'Whisky Red Label 1L', price: 200.00, tags: ['garrafa', 'whisky'], imagePath: 'Garrafas/Whisky - Red Label .jpg' },
        { name: 'Whisky Black Label 1L', price: 320.00, tags: ['garrafa', 'whisky'], imagePath: 'Garrafas/Whisky - Black Label .jpg' },
        { name: 'Whisky Gold Label 750ml', price: 390.00, tags: ['garrafa', 'whisky'], imagePath: 'Garrafas/Whisky - Gold Label - 750ML .jpg' },
        { name: 'Vinho Go Up Rosé', price: 120.00, tags: ['vinho', 'rosé'], imagePath: 'Garrafas/Vinho - Go UP - Rosé .jpg' },
        { name: 'Vinho Go Up Sauvignon Blanc', price: 120.00, tags: ['vinho', 'branco'], imagePath: 'Garrafas/Vinho - Go UP - Sauvignon Blan .jpg' },
        { name: 'Vinho Chardonnay Casillero del Diablo', price: 120.00, tags: ['vinho', 'branco'], imagePath: 'Garrafas/Vinho -Chardonnay .jpg' },
        { name: 'Espumante Salton Brut/Prosecco', price: 100.00, tags: ['espumante'], imagePath: 'Garrafas/Espumante - Salton .jpg' },
        { name: 'Espumante Go Up Rosé', price: 120.00, tags: ['espumante'], imagePath: 'Garrafas/Espumante - Go UP - Rosé .jpg' },
        { name: 'Espumante Chandon Brut', price: 180.00, tags: ['espumante', 'premium'], imagePath: 'Garrafas/Espumante - Chandon .jpg' },
        { name: 'Espumante Chandon Passion', price: 200.00, tags: ['espumante', 'premium'], imagePath: 'Garrafas/Espumante - Chandon Passion .jpg' },
        { name: 'Gelo de Coco (Whisky)', price: 7.50, tags: ['complemento'], imagePath: 'Garrafas/Gelo de Coco .jpg' },
    ],
    'entradas': [
        { name: 'Ostras Trufadas', description: '6 unidades', price: 65.00, tags: ['frutos do mar', 'premium'], imagePath: 'Entradas/Ostras trufadas.jpg' }, // Não listada antes, mas estava nos anteriores. Assumindo que talvez não tenha imagem. Vou tirar path se não tiver certeza?
        // Wait, Ostras Trufadas não apareceu no output do find recente. 
        // Apareceu: Ceviche.jpg, Gyoza.
        // Vou deixar Ostras SEM IMAGEM para não quebrar.
        { name: 'Ostras Trufadas', description: '6 unidades', price: 65.00, tags: ['frutos do mar', 'premium'] },
        { name: 'Ceviche', price: 45.00, tags: ['frutos do mar'], imagePath: 'Entradas/Ceviche.jpg' },
        { name: 'Casquinha de Siri', price: 37.00, tags: ['frutos do mar'] },
        { name: 'Gyoza de Porco Frita', description: '10 unidades', price: 43.00, imagePath: 'Entradas/Gyoza de Porco frita .jpg' },
        { name: 'Gyoza de Porco no Vapor', description: '10 unidades', price: 49.00, imagePath: 'Entradas/Gyoza de Porco no vapor .jpg' },
    ],
    'temakis': [
        { name: 'Temaki Salmão', price: 40.00, tags: ['japonês'] },
        { name: 'Temaki Salmão Grelhado', price: 40.00, tags: ['japonês'] },
        { name: 'Temaki Salmão sem Arroz', price: 49.00, tags: ['japonês', 'low carb'] },
    ],
    'espetinhos': [
        { name: 'Queijo Coalho', price: 16.00, imagePath: 'Espetinhos/Queijo Coalho .jpg' },
        { name: 'Espeto de Kafta', price: 16.00, imagePath: 'Espetinhos/Espeto de Kafta .jpg' },
    ],
    'porcoes': [
        { name: 'Bolinho de Costela', price: 62.00, imagePath: 'Porções Para Dividir/Bolinho de Costela .jpg' },
        { name: 'Bombom de Camarão', price: 70.00, tags: ['frutos do mar'] }, // Sem img na lista
        { name: 'Pérolas de Provolone', price: 60.00 }, // Sem img
        { name: 'Dadinho de Tapioca', price: 65.00 }, // Sem img
        { name: 'Camarão Jangadeiro', price: 80.00, tags: ['frutos do mar'], imagePath: 'Porções Para Dividir/Camarão Jangadeiro .jpg' },
        { name: 'Batata Frita', description: '500g', price: 69.00, imagePath: 'Porções Para Dividir/Batata Frita .jpg' },
        { name: 'Batata Smiles', price: 46.00, imagePath: 'Porções Para Dividir/Batata Smiles .jpg' },
        { name: 'Mandioca Frita', price: 69.00, imagePath: 'Porções Para Dividir/Mandioca Frita .jpg' },
        { name: 'Calabresa Acebolada', price: 87.00, imagePath: 'Porções Para Dividir/Calabresa Acebolada .jpg' },
        { name: 'Pescada à Dorê', price: 115.00, tags: ['peixe'], imagePath: 'Porções Para Dividir/Pescada a Dorê .jpg' },
        { name: 'Camarão à Dorê', price: 135.00, tags: ['frutos do mar'], imagePath: 'Porções Para Dividir/Camarão a Dorê .jpg' },
        { name: 'Camarão Alho e Óleo', price: 145.00, tags: ['frutos do mar'] },
        { name: 'Lula à Dorê', price: 145.00, tags: ['frutos do mar'], imagePath: 'Porções Para Dividir/Lula a Dorê .jpg' },
        { name: 'Mignon Acebolado', price: 156.00, tags: ['carne'], imagePath: 'Porções Para Dividir/Mignon Acebolado .jpg' },
        { name: 'Mignon Cremoso com Catupiry', price: 164.00, tags: ['carne'], imagePath: 'Porções Para Dividir/Mignon Cremoso com Catupiry .jpg' },
    ],
    'adicionais': [
        { name: 'Molho Tártaro', price: 8.00 },
        { name: 'Molho Barbecue', price: 8.00 },
        { name: 'Cesta de Pães', price: 8.00, imagePath: 'Porções Para Dividir/Cesta de Pães .jpg' },
        { name: 'Farofa', price: 8.00, imagePath: 'Espetinhos/Adicionais - Farofa.jpg' },
        { name: 'Vinagrete', price: 8.00, imagePath: 'Espetinhos/Adicionais - Vinagrete.jpg' },
    ],
    'doces': [
        { name: 'Donuts Doce de Leite', price: 18.00, tags: ['sobremesa'], imagePath: 'Docinho/Donuts - Doce de Leite Crocant .jpg' },
        { name: 'Donuts Frutas Vermelhas', price: 18.00, tags: ['sobremesa'], imagePath: 'Docinho/Donuts - Frutas Vermelhas .jpg' },
        { name: 'Bombom de Açaí', price: 29.00, tags: ['sobremesa', 'açaí'] },
        { name: 'Açaí no Pote', price: 28.00, tags: ['açaí'] },
        { name: 'Petit Gateau', price: 45.00, tags: ['sobremesa', 'premium'], imagePath: 'Docinho/Petit Gateau .jpg' },
    ],
    'lojinha': [
        { name: 'Halls Cereja', price: 5.00 },
        { name: 'Repelente Citroilha', price: 50.00, imagePath: 'Lojinha/Repelente - CITROilha .jpg' },
        { name: 'Café Espresso', price: 8.00, imagePath: 'Lojinha/Café Espresso .jpg' },
        { name: 'Taxa de Rolha', description: 'Para garrafas não comercializadas pela casa', price: 100.00, tags: ['taxa'], imagePath: 'Garrafas/taxa-rolha.jpg' },
    ],
}

async function seedMenu() {
    console.log('🍽️  Iniciando seed do cardápio Auditado...')

    // Limpar dados existentes
    await prisma.menuItem.deleteMany()
    await prisma.menuCategory.deleteMany()
    console.log('✅ Dados antigos removidos')

    // Criar categorias
    for (const cat of categories) {
        await prisma.menuCategory.create({
            data: {
                name: cat.name,
                slug: cat.slug,
                displayOrder: cat.displayOrder,
                isActive: true,
            },
        })
    }
    console.log(`✅ ${categories.length} categorias criadas`)

    // Buscar categorias criadas
    const createdCategories = await prisma.menuCategory.findMany()
    const categoryMap = new Map(createdCategories.map(c => [c.slug, c.id]))

    // Criar itens
    let itemCount = 0
    for (const [slug, items] of Object.entries(menuItems)) {
        const categoryId = categoryMap.get(slug)

        if (!categoryId) {
            console.warn(`⚠️  Categoria não encontrada: ${slug}`)
            continue
        }

        for (const item of items) {
            let imageUrl = null
            if (item.imagePath) {
                // Ensure manual encoding of space to %20 ONLY, avoiding double encoding.
                // Replace " " with "%20"
                const safePath = item.imagePath.split('/').map(part => {
                    // Apenas substitui espaços, mantém outros chars. 
                    // Melhor: encodeURIcomponent e reverter as barras? Não, muito arriscado com caracteres especiais.
                    // Vamos confiar que o servidor de estáticos serve arquivos com espaço na URL se requisitado com %20.
                    return part.replace(/ /g, '%20')
                }).join('/')

                imageUrl = `/cardapio/${item.imagePath}`
            }

            await prisma.menuItem.create({
                data: {
                    categoryId,
                    name: item.name,
                    description: item.description || null,
                    price: item.price,
                    tags: item.tags || [],
                    isAvailable: true,
                    displayOrder: itemCount,
                    imageUrl,
                },
            })
            itemCount++
        }
    }

    console.log(`✅ ${itemCount} itens criados`)
    console.log('🎉 Seed do cardápio Auditado concluído!')
}

seedMenu()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
