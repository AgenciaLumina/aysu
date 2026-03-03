// AISSU Beach Lounge - Database Seed Completo
// Dados iniciais para desenvolvimento com cardápio completo e imagens

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...')

    // 1. Criar usuário admin
    const adminPassword = await bcrypt.hash('TiagoBrenaSucesso2026#', 10)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@aysubeachlounge.com.br' },
        update: {
            passwordHash: adminPassword,
            email: 'admin@aysubeachlounge.com.br',
        },
        create: {
            email: 'admin@aysubeachlounge.com.br',
            name: 'Administrador AISSU',
            role: 'ADMIN',
            passwordHash: adminPassword,
            phone: '(12) 99999-9999',
            isActive: true,
        },
    })
    console.log('✅ Admin criado:', admin.email)

    // 2. Criar cabins (Bangalôs conforme especificação)
    const cabins = [
        // Bangalô Lateral - 6 unidades
        { name: 'Bangalô Lateral 1', capacity: 5, pricePerHour: 166.67, category: 'CABANA' as const, description: 'Ideal para casais + amigos. 4-5 pessoas. Diária R$ 1.000 (100% consumível: R$ 700)', imageUrl: '/espacos/bangalo-lateral.jpg' },
        { name: 'Bangalô Lateral 2', capacity: 5, pricePerHour: 166.67, category: 'CABANA' as const, description: 'Ideal para casais + amigos. 4-5 pessoas. Diária R$ 1.000 (100% consumível: R$ 700)', imageUrl: '/espacos/bangalo-lateral.jpg' },
        { name: 'Bangalô Lateral 3', capacity: 5, pricePerHour: 166.67, category: 'CABANA' as const, description: 'Ideal para casais + amigos. 4-5 pessoas. Diária R$ 1.000 (100% consumível: R$ 700)', imageUrl: '/espacos/bangalo-lateral.jpg' },
        { name: 'Bangalô Lateral 4', capacity: 5, pricePerHour: 166.67, category: 'CABANA' as const, description: 'Ideal para casais + amigos. 4-5 pessoas. Diária R$ 1.000 (100% consumível: R$ 700)', imageUrl: '/espacos/bangalo-lateral.jpg' },
        { name: 'Bangalô Lateral 5', capacity: 5, pricePerHour: 166.67, category: 'CABANA' as const, description: 'Ideal para casais + amigos. 4-5 pessoas. Diária R$ 1.000 (100% consumível: R$ 700)', imageUrl: '/espacos/bangalo-lateral.jpg' },
        { name: 'Bangalô Lateral 6', capacity: 5, pricePerHour: 166.67, category: 'CABANA' as const, description: 'Ideal para casais + amigos. 4-5 pessoas. Diária R$ 1.000 (100% consumível: R$ 700)', imageUrl: '/espacos/bangalo-lateral.jpg' },
        // Bangalô Piscina + Frente Mar - 6 unidades
        { name: 'Bangalô Piscina 1', capacity: 6, pricePerHour: 300, category: 'LOUNGE' as const, description: 'Piscina privativa. 6 pessoas. Diária R$ 1.800 (100% consumível: R$ 1.300)', imageUrl: '/espacos/bangalo-piscina.jpg' },
        { name: 'Bangalô Piscina 2', capacity: 6, pricePerHour: 300, category: 'LOUNGE' as const, description: 'Piscina privativa. 6 pessoas. Diária R$ 1.800 (100% consumível: R$ 1.300)', imageUrl: '/espacos/bangalo-piscina.jpg' },
        { name: 'Bangalô Frente Mar 1', capacity: 8, pricePerHour: 300, category: 'LOUNGE' as const, description: 'Vista privilegiada. 6-8 pessoas. Diária R$ 1.800 (100% consumível: R$ 1.300)', imageUrl: '/espacos/bangalo-frente-mar.jpg' },
        { name: 'Bangalô Frente Mar 2', capacity: 8, pricePerHour: 300, category: 'LOUNGE' as const, description: 'Vista privilegiada. 6-8 pessoas. Diária R$ 1.800 (100% consumível: R$ 1.300)', imageUrl: '/espacos/bangalo-frente-mar.jpg' },
        { name: 'Bangalô Frente Mar 3', capacity: 8, pricePerHour: 300, category: 'LOUNGE' as const, description: 'Vista privilegiada. 6-8 pessoas. Diária R$ 1.800 (100% consumível: R$ 1.300)', imageUrl: '/espacos/bangalo-frente-mar.jpg' },
        { name: 'Bangalô Frente Mar 4', capacity: 8, pricePerHour: 300, category: 'LOUNGE' as const, description: 'Vista privilegiada. 6-8 pessoas. Diária R$ 1.800 (100% consumível: R$ 1.300)', imageUrl: '/espacos/bangalo-frente-mar.jpg' },
        // Bangalô Central (Galera) - 1 unidade
        { name: 'Bangalô Central Galera', capacity: 10, pricePerHour: 416.67, category: 'VIP' as const, description: 'Espaço icônico. Até 10 pessoas. Diária R$ 2.500 (100% consumível: R$ 2.000)', imageUrl: '/espacos/bangalo10.jpeg' },
        // Sunbed - 4 unidades
        { name: 'Sunbed Casal 1', capacity: 2, pricePerHour: 83.33, category: 'MESA' as const, description: 'Cama de praia exclusiva para casais. Diária R$ 500 (100% consumível: R$ 350)', imageUrl: '/espacos/Sunbeds.jpeg' },
        { name: 'Sunbed Casal 2', capacity: 2, pricePerHour: 83.33, category: 'MESA' as const, description: 'Cama de praia exclusiva para casais. Diária R$ 500 (100% consumível: R$ 350)', imageUrl: '/espacos/Sunbeds.jpeg' },
        { name: 'Sunbed Casal 3', capacity: 2, pricePerHour: 83.33, category: 'MESA' as const, description: 'Cama de praia exclusiva para casais. Diária R$ 500 (100% consumível: R$ 350)', imageUrl: '/espacos/Sunbeds.jpeg' },
        { name: 'Sunbed Casal 4', capacity: 2, pricePerHour: 83.33, category: 'MESA' as const, description: 'Cama de praia exclusiva para casais. Diária R$ 500 (100% consumível: R$ 350)', imageUrl: '/espacos/Sunbeds.jpeg' },
        // Mesa Restaurante Interno - 4 unidades
        ...Array.from({ length: 4 }, (_, idx) => ({
            name: `Mesa Restaurante Interno ${idx + 1}`,
            capacity: 6,
            pricePerHour: 160,
            category: 'MESA' as const,
            description: 'Mesa interna para 4-6 pessoas. Valor R$ 160 (consumação R$ 100).',
            imageUrl: '/espacos/bangalo-lateral.jpg',
        })),
        // Mesa Praia - 4 unidades
        ...Array.from({ length: 4 }, (_, idx) => ({
            name: `Mesa Praia ${idx + 1}`,
            capacity: 4,
            pricePerHour: 160,
            category: 'MESA' as const,
            description: 'Mesa pé na areia para 2-4 pessoas. Valor R$ 160 (consumação R$ 100).',
            imageUrl: '/espacos/Sunbeds.jpeg',
        })),
        // Day Use Praia com Espreguiçadeira - 20 unidades
        ...Array.from({ length: 20 }, (_, idx) => ({
            name: `Day Use Praia com Espreguiçadeira ${idx + 1}`,
            capacity: 1,
            pricePerHour: 160,
            category: 'MESA' as const,
            description: 'Day Use com espreguiçadeira. Valor R$ 160 (consumação R$ 100).',
            imageUrl: '/espacos/Sunbeds.jpeg',
        })),
    ]

    for (const cabin of cabins) {
        await prisma.cabin.upsert({
            where: { name: cabin.name },
            update: {},
            create: cabin,
        })
    }
    console.log('✅ Cabins criados:', cabins.length)

    // 3. Criar categorias do cardápio (slugs únicos)
    const categories = [
        { name: 'Água e Refri', slug: 'agua-e-refri', description: 'Águas minerais e refrigerantes', displayOrder: 1 },
        { name: 'Sucos Naturais', slug: 'sucos-naturais', description: 'Sucos de frutas frescas', displayOrder: 2 },
        { name: 'Energéticos', slug: 'energeticos', description: 'Red Bull e energéticos', displayOrder: 3 },
        { name: 'Beats', slug: 'beats', description: 'Drinks prontos Beats', displayOrder: 4 },
        { name: 'Drinks Clássicos', slug: 'drinks-classicos', description: 'Coquetéis clássicos e autorais', displayOrder: 5 },
        { name: 'Gin & Cia', slug: 'gin-e-cia', description: 'Drinks com gin', displayOrder: 6 },
        { name: 'Caipirinhas', slug: 'caipirinhas', description: 'Caipirinhas, caipiroskas e saquerinhas', displayOrder: 7 },
        { name: 'Batidas', slug: 'batidas', description: 'Batidas com leite condensado', displayOrder: 8 },
        { name: 'Cervejas', slug: 'cervejas', description: 'Cervejas long neck e garrafa', displayOrder: 9 },
        { name: 'Garrafas', slug: 'garrafas', description: 'Espumantes, vinhos, whisky e vodkas', displayOrder: 10 },
        { name: 'Entradas', slug: 'entradas', description: 'Entradas e petiscos', displayOrder: 11 },
        { name: 'Porções Para Dividir', slug: 'porcoes', description: 'Porções generosas para compartilhar', displayOrder: 12 },
        { name: 'Espetinhos', slug: 'espetinhos', description: 'Espetinhos na brasa', displayOrder: 13 },
        { name: 'Pratos Individuais', slug: 'pratos-individuais', description: 'Pratos principais', displayOrder: 14 },
        { name: 'Docinho', slug: 'docinho', description: 'Sobremesas e doces', displayOrder: 15 },
        { name: 'Lojinha', slug: 'lojinha', description: 'Café e produtos', displayOrder: 16 },
    ]

    const categoryMap: Record<string, string> = {}
    for (const cat of categories) {
        const created = await prisma.menuCategory.upsert({
            where: { slug: cat.slug },
            update: {},
            create: { ...cat, isActive: true },
        })
        categoryMap[cat.slug] = created.id
    }
    console.log('✅ Categorias criadas:', categories.length)

    // 4. Criar itens do cardápio com imagens
    // Função auxiliar para gerar slug único
    const slugify = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const menuItems = [
        // === ÁGUA E REFRI ===
        { categorySlug: 'agua-e-refri', name: 'Água Mineral s/ Gás — 510ml', price: 5.00, description: 'Água mineral Caraguá.', imageUrl: '/cardapio/Água e Refri/Água Mineral s: Gás - 510ml .jpg' },
        { categorySlug: 'agua-e-refri', name: 'Água Mineral c/ Gás — 510ml', price: 6.50, description: 'Água mineral com gás Caraguá.', imageUrl: '/cardapio/Água e Refri/Água Mineral c: Gás - 510ml .jpg' },
        { categorySlug: 'agua-e-refri', name: 'H2O Limão — 500ml', price: 12.00, description: 'Bebida levemente gaseificada sabor limão.', imageUrl: '/cardapio/Água e Refri/H2O Limão 500ml .jpg' },
        { categorySlug: 'agua-e-refri', name: 'H2O Limoneto — 500ml', price: 12.00, description: 'Bebida gaseificada sabor limão siciliano.', imageUrl: '/cardapio/Água e Refri/H2O Limoneto 500ml .jpg' },
        { categorySlug: 'agua-e-refri', name: 'Pepsi Cola — Lata 350ml', price: 9.00, description: 'Refrigerante Pepsi.', imageUrl: '/cardapio/Água e Refri/Pepsi Cola - Lata - 350ml .jpg' },
        { categorySlug: 'agua-e-refri', name: 'Pepsi Black Zero — Lata 350ml', price: 9.00, description: 'Refrigerante Pepsi Black Zero Açúcar.', imageUrl: '/cardapio/Água e Refri/Pepsi Black - Zero Lata 350ml .jpg' },
        { categorySlug: 'agua-e-refri', name: 'Guaraná Antarctica — Lata 350ml', price: 9.00, description: 'Refrigerante Guaraná Antarctica.', imageUrl: '/cardapio/Água e Refri/Guarana Lata 350ml .jpg' },
        { categorySlug: 'agua-e-refri', name: 'Sukita Uva — Lata 350ml', price: 9.00, description: 'Refrigerante Sukita sabor uva.', imageUrl: '/cardapio/Água e Refri/Sukita Uva Lata 350ml .jpg' },
        { categorySlug: 'agua-e-refri', name: 'Sukita Laranja — Lata 350ml', price: 9.00, description: 'Refrigerante Sukita sabor laranja.', imageUrl: '/cardapio/Água e Refri/Sukita Laranja Lata 350ml .jpg' },
        { categorySlug: 'agua-e-refri', name: 'Soda Limonada — Lata 350ml', price: 9.00, description: 'Soda limonada.', imageUrl: '/cardapio/Água e Refri/Soda Limonada Lata 350ml .jpg' },
        { categorySlug: 'agua-e-refri', name: 'Soda Diet — Lata 350ml', price: 9.00, description: 'Soda limonada diet.', imageUrl: '/cardapio/Água e Refri/Soda Limonada Diet Lata 350ml .jpg' },

        // === SUCOS NATURAIS ===
        { categorySlug: 'sucos-naturais', name: 'Suco Natural', price: 16.00, description: 'Sabores: abacaxi, abacaxi com hortelã, acerola, caju, melão, maracujá, morango.', imageUrl: null },

        // === ENERGÉTICOS ===
        { categorySlug: 'energeticos', name: 'Red Bull Tradicional — 250ml', price: 18.00, description: 'Energético Red Bull tradicional.', imageUrl: '/cardapio/Energéticos/Red Bull - Tradicional .jpg' },
        { categorySlug: 'energeticos', name: 'Red Bull Sugar Free — 250ml', price: 18.00, description: 'Energético Red Bull sem açúcar.', imageUrl: '/cardapio/Energéticos/Red Bull - Sugar Free .jpg' },
        { categorySlug: 'energeticos', name: 'Red Bull Melancia — 250ml', price: 18.00, description: 'Energético Red Bull sabor melancia.', imageUrl: '/cardapio/Energéticos/Red Bull - Melancia .jpg' },
        { categorySlug: 'energeticos', name: 'Red Bull Tropical — 250ml', price: 18.00, description: 'Energético Red Bull sabor tropical.', imageUrl: '/cardapio/Energéticos/Red Bull - Tropical .jpg' },
        { categorySlug: 'energeticos', name: 'Red Bull Nectarina — 250ml', price: 18.00, description: 'Energético Red Bull Summer Edition nectarina.', imageUrl: '/cardapio/Energéticos/Red Bull - Nectarina .jpg' },
        { categorySlug: 'energeticos', name: 'Red Bull Frutas Vermelhas — 250ml', price: 18.00, description: 'Energético Red Bull Limited Edition.', imageUrl: '/cardapio/Energéticos/Red Bull - Frutas Vermelhas .jpg' },

        // === BEATS ===
        { categorySlug: 'beats', name: 'Beats Senses — 269ml', price: 15.00, description: 'Drink pronto sabor Senses.', imageUrl: '/cardapio/beats long neck/Beats - Senses .jpg' },
        { categorySlug: 'beats', name: 'Beats Gin & Tônica — 269ml', price: 15.00, description: 'Drink pronto sabor Gin & Tônica.', imageUrl: '/cardapio/beats long neck/Beats - Gin & Tônica .jpg' },

        // === DRINKS CLÁSSICOS ===
        { categorySlug: 'drinks-classicos', name: 'Clericot Aysú — Jarra 2L', price: 220.00, description: 'Frutas, vinho branco, licor de pêssego, espumante demi-sec e aromatização.', imageUrl: '/cardapio/Drinks Clássicos/Clericot Aysú- Jarra 2L .jpg' },
        { categorySlug: 'drinks-classicos', name: 'Aperol Spritz', price: 38.00, description: 'Prosecco, Aperol, água com gás e laranja.', imageUrl: '/cardapio/Drinks Clássicos/Aperol Spritz .jpg' },
        { categorySlug: 'drinks-classicos', name: 'Coffee & Whisky', price: 42.00, description: 'Licor Ballena chocolate e caramelo, café espresso e whisky escocês.', imageUrl: '/cardapio/Drinks Clássicos/Coffee & Whisky .jpg' },
        { categorySlug: 'drinks-classicos', name: 'Carajillo — Licor 43', price: 38.00, description: 'Café espresso com Licor 43.', imageUrl: '/cardapio/Drinks Clássicos/Carajillo - Licor 43 .jpg' },
        { categorySlug: 'drinks-classicos', name: 'Black Penicillin', price: 42.00, description: 'Whisky, limão siciliano, mel e gengibre.', imageUrl: '/cardapio/Drinks Clássicos/Black Penicillin .jpg' },
        { categorySlug: 'drinks-classicos', name: 'Don Julio Margarita', price: 42.00, description: 'Tequila Don Julio, limão siciliano, agave e sal.', imageUrl: '/cardapio/Drinks Clássicos/Don Julio Margarita .jpg' },
        { categorySlug: 'drinks-classicos', name: 'Pé na Areia', price: 38.00, description: 'Whisky Johnnie Walker Blonde.', imageUrl: '/cardapio/Drinks Clássicos/Pé na Areia .jpg' },
        { categorySlug: 'drinks-classicos', name: 'Red & Guaraná', price: 38.00, description: 'Johnnie Walker Red com guaraná.', imageUrl: '/cardapio/Drinks Clássicos/Red & Guaraná .jpg' },
        { categorySlug: 'drinks-classicos', name: 'FitzGerald', price: 42.00, description: 'Gin Tanqueray, limão siciliano e angostura.', imageUrl: '/cardapio/Drinks Clássicos/FitzGerald .jpg' },
        { categorySlug: 'drinks-classicos', name: 'Negroni', price: 38.00, description: 'Vermute rosso, gin Tanqueray e Campari.', imageUrl: '/cardapio/Drinks Clássicos/Negroni .jpg' },
        { categorySlug: 'drinks-classicos', name: 'Moscow Mule', price: 38.00, description: 'Vodka, limão, ginger ale e espuma de gengibre.', imageUrl: '/cardapio/Drinks Clássicos/Moscow Mule .jpg' },
        { categorySlug: 'drinks-classicos', name: 'Mojito', price: 34.00, description: 'Rum, limão e hortelã.', imageUrl: '/cardapio/Drinks Clássicos/Mojito.jpg' },
        { categorySlug: 'drinks-classicos', name: 'Sex On The Beach', price: 34.00, description: 'Vodka, pêssego e laranja.', imageUrl: '/cardapio/Drinks Clássicos/Sex On The Beach .jpg' },
        { categorySlug: 'drinks-classicos', name: 'Ballena Colada', price: 34.00, description: 'Licor Ballena de coco, rum, abacaxi e água de coco.', imageUrl: '/cardapio/Drinks Clássicos/Ballena Colada .jpg' },
        { categorySlug: 'drinks-classicos', name: 'Frangelico — Soda e Limão', price: 30.00, description: 'Frangelico com água com gás e limão.', imageUrl: '/cardapio/Drinks Clássicos/Frangelico - Soda e Limão .jpg' },
        { categorySlug: 'drinks-classicos', name: 'Campari Clássico', price: 28.00, description: 'Campari com água com gás e laranja.', imageUrl: '/cardapio/Drinks Clássicos/Campari - Clássico.jpg' },
        { categorySlug: 'drinks-classicos', name: 'Água de Verão — Não alcoólico', price: 38.00, description: 'Água de coco, frutas vermelhas e hortelã.', imageUrl: '/cardapio/Drinks Clássicos/Água de Verão - Não Alcólico .jpg' },

        // === GIN & CIA ===
        { categorySlug: 'gin-e-cia', name: 'Gin Tônica', price: 36.00, description: 'Gin, água tônica, cardamomo e limão.', imageUrl: null },
        { categorySlug: 'gin-e-cia', name: 'Gin Tropical', price: 38.00, description: 'Gin com Red Bull Tropical.', imageUrl: null },
        { categorySlug: 'gin-e-cia', name: 'Gin + Melancia', price: 38.00, description: 'Gin com Red Bull Melancia.', imageUrl: null },

        // === CAIPIRINHAS ===
        { categorySlug: 'caipirinhas', name: 'Caipirinha — Cachaça', price: 30.00, description: 'Sabores variados. Cachaça Velho Barreiro, Sagatiba ou artesanal.', imageUrl: '/cardapio/Caipirinhas - (Cachaça)/Caipirinhas - (Cachaça).jpg' },
        { categorySlug: 'caipirinhas', name: 'Caipiroska — Vodka Smirnoff', price: 32.00, description: 'Caipirinha feita com vodka Smirnoff.', imageUrl: null },
        { categorySlug: 'caipirinhas', name: 'Saquerinha — Saquê', price: 32.00, description: 'Sabores variados com saquê.', imageUrl: null },

        // === BATIDAS ===
        { categorySlug: 'batidas', name: 'Batida — Vodka Smirnoff', price: 38.00, description: 'Sabores coco, abacaxi, maracujá, morango e frutas vermelhas.', imageUrl: null },
        { categorySlug: 'batidas', name: 'Batida — Velho Barreiro', price: 32.00, description: 'Sabores coco, abacaxi, maracujá, morango e frutas vermelhas.', imageUrl: null },

        // === CERVEJAS ===
        { categorySlug: 'cervejas', name: 'Corona — Long Neck 330ml', price: 18.00, description: 'Cerveja Corona extra.', imageUrl: '/cardapio/Cervejas - Long Neck 330ml/Corona - Long Neck - 330ml.jpg' },
        { categorySlug: 'cervejas', name: 'Corona Cero — Zero Álcool 330ml', price: 16.00, description: 'Cerveja Corona sem álcool.', imageUrl: '/cardapio/Cervejas - Long Neck 330ml/Corona Cero (Zero Álcool).jpg' },
        { categorySlug: 'cervejas', name: 'Stella Artois — Long Neck 330ml', price: 14.00, description: 'Cerveja Stella Artois.', imageUrl: '/cardapio/Cervejas - Long Neck 330ml/Stella Artois - Long Neck - 330ml.jpg' },
        { categorySlug: 'cervejas', name: 'Spaten — Long Neck 330ml', price: 12.00, description: 'Cerveja Spaten.', imageUrl: '/cardapio/Cervejas - Long Neck 330ml/Spaten - Long Neck - 330ml .jpg' },
        { categorySlug: 'cervejas', name: 'Becks — Long Neck 330ml', price: 12.00, description: 'Cerveja Becks.', imageUrl: '/cardapio/Cervejas - Long Neck 330ml/Becks - Long Neck - 330ml .jpg' },

        // === GARRAFAS ===
        { categorySlug: 'garrafas', name: 'Espumante Chandon', price: 280.00, description: 'Espumante Chandon Brut.', imageUrl: '/cardapio/Garrafas/Espumante - Chandon .jpg' },
        { categorySlug: 'garrafas', name: 'Espumante Chandon Passion', price: 300.00, description: 'Espumante Chandon Passion.', imageUrl: '/cardapio/Garrafas/Espumante - Chandon Passion .jpg' },
        { categorySlug: 'garrafas', name: 'Espumante Go UP Rosé', price: 150.00, description: 'Espumante Go UP Rosé.', imageUrl: '/cardapio/Garrafas/Espumante - Go UP - Rosé .jpg' },
        { categorySlug: 'garrafas', name: 'Espumante Salton', price: 120.00, description: 'Espumante Salton Brut.', imageUrl: '/cardapio/Garrafas/Espumante - Salton .jpg' },
        { categorySlug: 'garrafas', name: 'Vodka Absolut', price: 350.00, description: 'Vodka Absolut 1L.', imageUrl: '/cardapio/Garrafas/Garrafa - Vodka Absolut .jpg' },
        { categorySlug: 'garrafas', name: 'Vodka Ketel One', price: 450.00, description: 'Vodka Ketel One 1L.', imageUrl: '/cardapio/Garrafas/Garrafa - Vodka Ketel One .jpg' },
        { categorySlug: 'garrafas', name: 'Gin Tanqueray', price: 380.00, description: 'Gin Tanqueray London Dry.', imageUrl: '/cardapio/Garrafas/Gin - Tanqueray .jpg' },
        { categorySlug: 'garrafas', name: 'Gin Beefeater', price: 320.00, description: 'Gin Beefeater London Dry.', imageUrl: '/cardapio/Garrafas/Gin - Beefeater .jpg' },
        { categorySlug: 'garrafas', name: 'Gin Gordon\'s', price: 280.00, description: 'Gin Gordon\'s London Dry.', imageUrl: '/cardapio/Garrafas/Gin - Gordon`s .jpg' },
        { categorySlug: 'garrafas', name: 'Gin Yvy Mar', price: 350.00, description: 'Gin Yvy Mar brasileiro.', imageUrl: '/cardapio/Garrafas/Gin - Yvy - Mar .jpg' },
        { categorySlug: 'garrafas', name: 'Gin Yvy Terra', price: 350.00, description: 'Gin Yvy Terra brasileiro.', imageUrl: '/cardapio/Garrafas/Gin - Yvy - Terra .jpg' },
        { categorySlug: 'garrafas', name: 'Whisky Red Label', price: 280.00, description: 'Johnnie Walker Red Label.', imageUrl: '/cardapio/Garrafas/Whisky - Red Label .jpg' },
        { categorySlug: 'garrafas', name: 'Whisky Black Label', price: 450.00, description: 'Johnnie Walker Black Label.', imageUrl: '/cardapio/Garrafas/Whisky - Black Label .jpg' },
        { categorySlug: 'garrafas', name: 'Whisky Gold Label', price: 650.00, description: 'Johnnie Walker Gold Label Reserve 750ml.', imageUrl: '/cardapio/Garrafas/Whisky - Gold Label - 750ML .jpg' },
        { categorySlug: 'garrafas', name: 'Vinho Cabernet Sauvignon', price: 180.00, description: 'Vinho tinto Cabernet Sauvignon.', imageUrl: '/cardapio/Garrafas/Vinho -Cabernet Sauvignon .jpg' },
        { categorySlug: 'garrafas', name: 'Vinho Carménère', price: 180.00, description: 'Vinho tinto Carménère.', imageUrl: '/cardapio/Garrafas/Vinho -Carménère .jpg' },
        { categorySlug: 'garrafas', name: 'Vinho Merlot', price: 180.00, description: 'Vinho tinto Merlot.', imageUrl: '/cardapio/Garrafas/Vinho -Merlot .jpg' },
        { categorySlug: 'garrafas', name: 'Vinho Chardonnay', price: 180.00, description: 'Vinho branco Chardonnay.', imageUrl: '/cardapio/Garrafas/Vinho -Chardonnay .jpg' },
        { categorySlug: 'garrafas', name: 'Vinho Go UP Rosé', price: 120.00, description: 'Vinho rosé Go UP.', imageUrl: '/cardapio/Garrafas/Vinho - Go UP - Rosé .jpg' },
        { categorySlug: 'garrafas', name: 'Vinho Go UP Sauvignon Blanc', price: 120.00, description: 'Vinho branco Go UP Sauvignon Blanc.', imageUrl: '/cardapio/Garrafas/Vinho - Go UP - Sauvignon Blan .jpg' },
        { categorySlug: 'garrafas', name: 'Gelo de Coco', price: 25.00, description: 'Gelo de coco para drinks.', imageUrl: '/cardapio/Garrafas/Gelo de Coco .jpg' },
        { categorySlug: 'garrafas', name: 'Taxa de Rolha', price: 100.00, description: 'Para bebidas não comercializadas na casa.', imageUrl: '/cardapio/Garrafas/taxa-rolha.jpg' },

        // === ENTRADAS ===
        { categorySlug: 'entradas', name: 'Ceviche', price: 55.00, description: 'Peixe branco marinado em limão com pimenta e coentro.', imageUrl: '/cardapio/Entradas/Ceviche.jpg' },
        { categorySlug: 'entradas', name: 'Gyoza de Porco Frita', price: 42.00, description: 'Guioza de porco frita crocante.', imageUrl: '/cardapio/Entradas/Gyoza de Porco frita .jpg' },
        { categorySlug: 'entradas', name: 'Gyoza de Porco no Vapor', price: 42.00, description: 'Guioza de porco no vapor.', imageUrl: '/cardapio/Entradas/Gyoza de Porco no vapor .jpg' },

        // === PORÇÕES PARA DIVIDIR ===
        { categorySlug: 'porcoes', name: 'Batata Frita', price: 69.00, description: 'Aproximadamente 500g de batatas fritas crocantes.', imageUrl: '/cardapio/Porções Para Dividir/Batata Frita .jpg', tags: ['cheddar e bacon +R$15', 'molho barbecue +R$8'] },
        { categorySlug: 'porcoes', name: 'Batata Smiles', price: 65.00, description: 'Batatas smiles crocantes.', imageUrl: '/cardapio/Porções Para Dividir/Batata Smiles .jpg' },
        { categorySlug: 'porcoes', name: 'Mandioca Frita', price: 55.00, description: 'Mandioca frita crocante.', imageUrl: '/cardapio/Porções Para Dividir/Mandioca Frita .jpg' },
        { categorySlug: 'porcoes', name: 'Bolinho de Costela', price: 70.00, description: 'Bolinhos de costela desfiada.', imageUrl: '/cardapio/Porções Para Dividir/Bolinho de Costela .jpg' },
        { categorySlug: 'porcoes', name: 'Calabresa Acebolada', price: 65.00, description: 'Calabresa acebolada.', imageUrl: '/cardapio/Porções Para Dividir/Calabresa Acebolada .jpg' },
        { categorySlug: 'porcoes', name: 'Mignon Acebolado', price: 85.00, description: 'Mignon acebolado.', imageUrl: '/cardapio/Porções Para Dividir/Mignon Acebolado .jpg' },
        { categorySlug: 'porcoes', name: 'Mignon Cremoso com Catupiry', price: 95.00, description: 'Mignon cremoso com catupiry.', imageUrl: '/cardapio/Porções Para Dividir/Mignon Cremoso com Catupiry .jpg' },
        { categorySlug: 'porcoes', name: 'Camarão Jangadeiro', price: 80.00, description: 'Camarões com catupiry empanados.', imageUrl: '/cardapio/Porções Para Dividir/Camarão Jangadeiro .jpg' },
        { categorySlug: 'porcoes', name: 'Camarão à Dorê', price: 85.00, description: 'Camarões empanados.', imageUrl: '/cardapio/Porções Para Dividir/Camarão a Dorê .jpg' },
        { categorySlug: 'porcoes', name: 'Lula à Dorê', price: 75.00, description: 'Lula empanada.', imageUrl: '/cardapio/Porções Para Dividir/Lula a Dorê .jpg' },
        { categorySlug: 'porcoes', name: 'Lula Provençal', price: 80.00, description: 'Lula grelhada ao molho provençal.', imageUrl: '/cardapio/Porções Para Dividir/Lula Provençal .jpg' },
        { categorySlug: 'porcoes', name: 'Pescada à Dorê', price: 70.00, description: 'Pescada empanada.', imageUrl: '/cardapio/Porções Para Dividir/Pescada a Dorê .jpg' },
        { categorySlug: 'porcoes', name: 'Cesta de Pães', price: 8.00, description: 'Cesta com pães variados.', imageUrl: '/cardapio/Porções Para Dividir/Cesta de Pães .jpg' },

        // === ESPETINHOS ===
        { categorySlug: 'espetinhos', name: 'Espeto de Kafta', price: 25.00, description: 'Espetinho de kafta na brasa.', imageUrl: '/cardapio/Espetinhos/Espeto de Kafta .jpg' },
        { categorySlug: 'espetinhos', name: 'Queijo Coalho', price: 18.00, description: 'Espetinho de queijo coalho.', imageUrl: '/cardapio/Espetinhos/Queijo Coalho .jpg' },

        // === PRATOS INDIVIDUAIS ===
        { categorySlug: 'pratos-individuais', name: 'Risoto de Camarão ao Limone', price: 95.00, description: 'Risoto cremoso de camarão ao limão siciliano.', imageUrl: '/cardapio/Pratos Individuais/Risoto de Camarão ao Limone.jpg' },
        { categorySlug: 'pratos-individuais', name: 'Risoto Limão Siciliano e Salmão', price: 105.00, description: 'Risoto de limão siciliano com salmão grelhado.', imageUrl: '/cardapio/Pratos Individuais/Risoto Limão Siciliano e Salmão.jpg' },

        // === DOCINHO ===
        { categorySlug: 'docinho', name: 'Petit Gateau', price: 38.00, description: 'Petit gateau com sorvete de creme.', imageUrl: '/cardapio/Docinho/Petit Gateau .jpg' },
        { categorySlug: 'docinho', name: 'Donuts Doce de Leite Crocante', price: 28.00, description: 'Donuts com cobertura de doce de leite crocante.', imageUrl: '/cardapio/Docinho/Donuts - Doce de Leite Crocant .jpg' },
        { categorySlug: 'docinho', name: 'Donuts Frutas Vermelhas', price: 28.00, description: 'Donuts com cobertura de frutas vermelhas.', imageUrl: '/cardapio/Docinho/Donuts - Frutas Vermelhas .jpg' },

        // === LOJINHA ===
        { categorySlug: 'lojinha', name: 'Café Espresso', price: 8.00, description: 'Café espresso.', imageUrl: '/cardapio/Lojinha/Café Espresso .jpg' },
        { categorySlug: 'lojinha', name: 'Repelente CITROilha', price: 35.00, description: 'Repelente natural CITROilha.', imageUrl: '/cardapio/Lojinha/Repelente - CITROilha .jpg' },

        // === ADICIONAIS (como categoria separada) ===
        { categorySlug: 'espetinhos', name: 'Adicional — Farofa', price: 8.00, description: 'Porção adicional de farofa.', imageUrl: '/cardapio/Espetinhos/Adicionais - Farofa.jpg' },
        { categorySlug: 'espetinhos', name: 'Adicional — Vinagrete', price: 8.00, description: 'Porção adicional de vinagrete.', imageUrl: '/cardapio/Espetinhos/Adicionais - Vinagrete.jpg' },
    ]

    let order = 0
    for (const item of menuItems) {
        order++
        const slug = slugify(item.name)
        const categoryId = categoryMap[item.categorySlug]

        if (!categoryId) {
            console.warn(`⚠️ Categoria não encontrada: ${item.categorySlug}`)
            continue
        }

        await prisma.menuItem.upsert({
            where: { id: slug },
            update: {
                name: item.name,
                price: item.price,
                description: item.description,
                imageUrl: item.imageUrl,
            },
            create: {
                id: slug,
                categoryId,
                name: item.name,
                description: item.description,
                price: item.price,
                imageUrl: item.imageUrl,
                isAvailable: true,
                displayOrder: order,
                tags: (item as { tags?: string[] }).tags || [],
            },
        })
    }
    console.log('✅ Itens do cardápio criados:', menuItems.length)

    // 5. Criar evento de exemplo
    await prisma.event.upsert({
        where: { slug: 'sexta-dj-night' },
        update: {},
        create: {
            title: 'Sexta DJ Night',
            slug: 'sexta-dj-night',
            description: 'Noite especial com DJ residente',
            fullDescription: 'Venha curtir a melhor noite do Litoral Norte! DJ sets a partir das 18h com drinks especiais e gastronomia premium.',
            eventType: 'DJ_NIGHT',
            startDate: new Date('2026-01-24T18:00:00'),
            endDate: new Date('2026-01-24T23:00:00'),
            djName: 'DJ Lucas',
            specialDrinks: ['Caipirinha Especial', 'Mojito Premium'],
            themeColor: '#d4a574',
            isActive: true,
            isFeatured: true,
        },
    })
    console.log('✅ Evento criado')

    console.log('🎉 Seed concluído!')
}

main()
    .catch((e) => {
        console.error('❌ Erro no seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
