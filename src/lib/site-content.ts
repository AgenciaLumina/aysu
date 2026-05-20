export interface SiteContentFeature {
    name: string
    description?: string
    icon?: string
}

export interface EventPricingPlan {
    name: string
    price: number
    features: string[]
    highlight: boolean
}

export interface SiteContentConfig {
    events: {
        hero: {
            eyebrow: string
            title: string
            subtitle: string
            primaryCtaLabel: string
            phoneLabel: string
            phoneHref: string
        }
        eventTypesSection: {
            eyebrow: string
            title: string
        }
        eventTypes: SiteContentFeature[]
        venue: {
            eyebrow: string
            title: string
            description: string
            imageUrl: string
        }
        pricing: {
            eyebrow: string
            title: string
            description: string
            plans: EventPricingPlan[]
        }
        bar: {
            eyebrow: string
            title: string
            description: string
            includesTitle: string
            includes: string[]
            priceLabel: string
            pricePrefix: string
            price: number
            unitNote: string
            imageUrl: string
        }
        buffet: {
            eyebrow: string
            title: string
            description: string
            optionsTitle: string
            options: string[]
            note: string
            priceLabel: string
            pricePrefix: string
            price: number
            imageUrl: string
        }
        partners: {
            eyebrow: string
            title: string
            description: string
            services: SiteContentFeature[]
        }
        quoteForm: {
            eyebrow: string
            title: string
            description: string
            directContactLabel: string
            phoneLabel: string
            phoneHref: string
            emailLabel: string
            emailHref: string
        }
        homeEventSection: {
            eyebrow: string
            title: string
            description: string
            ctaLabel: string
            secondaryCtaLabel: string
        }
    }
}

export const DEFAULT_SITE_CONTENT: SiteContentConfig = {
    events: {
        hero: {
            eyebrow: 'Celebre à Beira-Mar',
            title: 'Faça seu Evento',
            subtitle: 'Casamentos, aniversários, Eventos Corporativos e celebrações exclusivas no cenário mais bonito do Litoral Norte',
            primaryCtaLabel: 'Solicitar Orçamento',
            phoneLabel: '(12) 98289-6301',
            phoneHref: 'tel:+5512982896301',
        },
        eventTypesSection: {
            eyebrow: 'Celebrações',
            title: 'Tipos de Eventos',
        },
        eventTypes: [
            { name: 'Casamentos à Beira-mar', icon: 'heart', description: 'Cerimônias e recepções com vista para o oceano' },
            { name: 'Festas de 15 Anos', icon: 'sparkles', description: 'Celebração de debutantes em cenário paradisíaco' },
            { name: 'Corporativos', icon: 'users', description: 'Ativações de marca, confraternizações e team building' },
            { name: 'Miniweddings', icon: 'star', description: 'Celebrações íntimas para até 50 convidados' },
        ],
        venue: {
            eyebrow: 'Exclusividade Total',
            title: 'Seu evento em um cenário único',
            description: 'Deck de madeira, piscina com iluminação, vista para o mar e montanhas. Tudo preparado para criar memórias inesquecíveis.',
            imageUrl: '/evento_01.avif',
        },
        pricing: {
            eyebrow: 'Espaço Exclusivo',
            title: 'Valores - Espaço Fechado',
            description: 'Exclusivo para eventos de 50 a 100 pessoas, com segurança patrimonial, segurança durante o evento e limpeza durante o evento',
            plans: [
                {
                    name: 'Semana - Baixa Temporada',
                    price: 8000,
                    features: [
                        'Segunda a quinta',
                        'Maio a outubro',
                        'Eventos para 50 a 100 pessoas',
                        'Segurança patrimonial, segurança durante o evento e limpeza durante o evento',
                    ],
                    highlight: false,
                },
                {
                    name: 'Final de Semana - Baixa Temporada',
                    price: 12000,
                    features: [
                        'Sexta, sábado e domingo',
                        'Maio a outubro',
                        'Eventos para 50 a 100 pessoas',
                        'Segurança patrimonial, segurança durante o evento e limpeza durante o evento',
                    ],
                    highlight: true,
                },
                {
                    name: 'Semana ou Final de Semana - Alta Temporada',
                    price: 18000,
                    features: [
                        'Novembro a abril',
                        'Semana ou final de semana',
                        'Eventos para 50 a 100 pessoas',
                        'Segurança patrimonial, segurança durante o evento e limpeza durante o evento',
                    ],
                    highlight: false,
                },
            ],
        },
        bar: {
            eyebrow: 'Coquetelaria',
            title: 'Bar & Coquetelaria Aysú',
            description: 'Drinks autorais, clássicos e tropicais para brindar momentos inesquecíveis. Nosso bar combina criatividade, frescor e estética praiana em uma carta pensada para harmonizar com o clima leve e vibrante do litoral.',
            includesTitle: 'Inclui:',
            includes: [
                'Drinks autorais e clássicos (com e sem álcool)',
                'Refrigerantes variados',
                'Água mineral com e sem gás',
                'Sucos naturais ou refrescos tropicais',
                'Cervejas 600ML (Original, Stella Artois e Corona)',
                'Equipe de bartender(s) e barback(s)',
                'Bar completo (estrutura, gelo, utensílios e taças)',
            ],
            priceLabel: 'Por pessoa ou unitário',
            pricePrefix: 'A partir de',
            price: 45,
            unitNote: 'Ou valor unitário personalizado',
            imageUrl: '/eventos/bar-cocktails.png',
        },
        buffet: {
            eyebrow: 'Alta Gastronomia',
            title: 'Buffet Finger Food',
            description: 'Experiência gastronômica prática, saborosa e elegante, perfeita para eventos descontraídos à beira-mar. Porções em formato individual facilitando a circulação dos convidados.',
            optionsTitle: 'Opções/Sugestões:',
            options: [
                'Camarões empanados com molho de limão siciliano',
                'Mini pastel de sabores variados com molho de redução artesanal',
                'Espetinho caprese com redução de balsâmico',
                'Mini tacos de sabores variados (Ex.: guacamole)',
                'Ceviche com chips de banana da terra',
                'Mini sanduíches - diversos sabores',
                'Dadinhos de tapioca com geleia picante de pimenta',
                'Bolinho de arroz cremoso com aioli de limão',
                'Bruschetta de tomate confit com manjericão fresco',
                'Wraps frios de legumes crocantes com creme de iogurte',
            ],
            note: 'Sabores e complementos são definidos antecipadamente. Outras sugestões de buffet podem ser negociadas (Almoço, Jantar, Churrasco).',
            priceLabel: 'Por pessoa',
            pricePrefix: 'A partir de',
            price: 180,
            imageUrl: '/eventos/buffet-gourmet.png',
        },
        partners: {
            eyebrow: 'Parceiros',
            title: 'Serviços Parceiros',
            description: 'Indicamos profissionais de excelência para tornar seu evento completo',
            services: [
                { name: 'Assessoria de Evento', icon: 'calendar' },
                { name: 'Fotografia', icon: 'camera' },
                { name: 'Maquiagem', icon: 'sparkles' },
                { name: 'Hospedagem', icon: 'map-pin' },
                { name: 'DJ', icon: 'music' },
                { name: 'Iluminação', icon: 'star' },
                { name: 'Decoração', icon: 'heart' },
                { name: 'Confeitaria', icon: 'utensils' },
            ],
        },
        quoteForm: {
            eyebrow: 'Contato',
            title: 'Solicite seu Orçamento',
            description: 'Preencha o formulário e nossa equipe entrará em contato em até 24h',
            directContactLabel: 'Ou entre em contato diretamente:',
            phoneLabel: '(12) 98289-6301',
            phoneHref: 'tel:+5512982896301',
            emailLabel: 'eventos@aysubeachlounge.com.br',
            emailHref: 'mailto:eventos@aysubeachlounge.com.br',
        },
        homeEventSection: {
            eyebrow: 'Eventos Privados',
            title: 'Faça seu evento no Aysú',
            description: 'Espaço fechado à beira-mar, operação completa e uma tabela simples para planejar celebrações de 50 a 100 pessoas.',
            ctaLabel: 'Ver detalhes',
            secondaryCtaLabel: 'Solicitar orçamento',
        },
    },
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value)
}

function mergeWithDefaults(defaultValue: unknown, value: unknown): unknown {
    if (Array.isArray(defaultValue)) {
        if (!Array.isArray(value)) return defaultValue

        if (defaultValue.every((item) => typeof item === 'string')) {
            const parsed = value
                .filter((item): item is string => typeof item === 'string')
                .map((item) => item.trim())
                .filter(Boolean)

            return parsed.length ? parsed : defaultValue
        }

        const fallbackItem = defaultValue[0]
        if (!fallbackItem) return []

        const parsed = value
            .filter(isRecord)
            .map((item, index) => mergeWithDefaults(defaultValue[index] ?? fallbackItem, item))

        return parsed.length ? parsed : defaultValue
    }

    if (isRecord(defaultValue)) {
        const source = isRecord(value) ? value : {}

        return Object.fromEntries(
            Object.entries(defaultValue).map(([key, fallback]) => [
                key,
                mergeWithDefaults(fallback, source[key]),
            ])
        )
    }

    if (typeof defaultValue === 'number') {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : defaultValue
    }

    if (typeof defaultValue === 'boolean') {
        return typeof value === 'boolean' ? value : defaultValue
    }

    if (typeof defaultValue === 'string') {
        return typeof value === 'string' ? value : defaultValue
    }

    return value ?? defaultValue
}

export function parseSiteContentConfig(value: unknown): SiteContentConfig {
    return mergeWithDefaults(DEFAULT_SITE_CONTENT, value) as SiteContentConfig
}
