'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { getCabinSpaceKey, getCabinSpaceLabel } from '@/lib/space-slugs'

interface CabinApiItem {
    id: string
    name: string
    slug?: string | null
    capacity?: number
    units?: number
    pricePerHour?: number
    category?: string
    visibilityStatus?: 'AVAILABLE' | 'UNAVAILABLE' | 'HIDDEN'
}

interface ReservationGlobalConfigPayload {
    priceOverrides?: Record<string, { price: number; consumable?: number }>
}

interface PricingItem {
    id: string
    title: string
    cap: string
    val: number
    price: number
    categoryOrder: number
}

interface LegacyPricing {
    normalPrice: number
    normalConsumable: number
    holidayPrice: number
    holidayConsumable: number
}

const LEGACY_PRICING_BY_SPACE: Record<string, LegacyPricing> = {
    'bangalo-lateral': { normalPrice: 600, normalConsumable: 500, holidayPrice: 1000, holidayConsumable: 700 },
    'bangalo-piscina': { normalPrice: 600, normalConsumable: 500, holidayPrice: 1800, holidayConsumable: 1300 },
    'bangalo-frente-mar': { normalPrice: 720, normalConsumable: 600, holidayPrice: 1800, holidayConsumable: 1300 },
    'bangalo-central': { normalPrice: 1500, normalConsumable: 1200, holidayPrice: 2500, holidayConsumable: 2000 },
    'sunbed-casal': { normalPrice: 250, normalConsumable: 200, holidayPrice: 500, holidayConsumable: 350 },
    'mesa-restaurante': { normalPrice: 160, normalConsumable: 100, holidayPrice: 160, holidayConsumable: 100 },
    'mesa-praia': { normalPrice: 160, normalConsumable: 100, holidayPrice: 160, holidayConsumable: 100 },
    'day-use-praia': { normalPrice: 160, normalConsumable: 100, holidayPrice: 160, holidayConsumable: 100 },
}

function getCategoryOrder(spaceKey: string, category?: string): number {
    const key = spaceKey.toLowerCase()
    const categoryNormalized = (category || '').toLowerCase()

    if (key.includes('bangalo') || ['cabana', 'lounge', 'vip'].includes(categoryNormalized)) return 1
    if (key.includes('sunbed')) return 2
    if (key.includes('day-use') || key.includes('dayuse')) return 4
    if (key.includes('mesa') || categoryNormalized === 'mesa') return 3
    return 5
}

function formatCapacityLabel(capacity: number): string {
    if (capacity <= 1) return '1 pessoa'
    return `${capacity} pessoas`
}

export default function PricingSection() {
    const [activeTab, setActiveTab] = useState<'normal' | 'holiday'>('normal')
    const [cabins, setCabins] = useState<CabinApiItem[]>([])
    const [globalConfig, setGlobalConfig] = useState<ReservationGlobalConfigPayload | null>(null)

    useEffect(() => {
        fetch('/api/cabins?isActive=true')
            .then((res) => res.json())
            .then((data) => {
                if (data.success && Array.isArray(data.data)) {
                    setCabins(data.data)
                }
            })
            .catch(() => {})

        fetch('/api/day-configs/default')
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.data) {
                    setGlobalConfig(data.data)
                }
            })
            .catch(() => {})
    }, [])

    const pricingItems = useMemo(() => {
        if (!cabins.length) {
            return Object.entries(LEGACY_PRICING_BY_SPACE)
                .map(([id, pricing]) => ({
                    id,
                    title: getCabinSpaceLabel({ name: id, slug: id }),
                    cap: 'Consulte capacidade',
                    val: activeTab === 'holiday' ? pricing.holidayConsumable : pricing.normalConsumable,
                    price: activeTab === 'holiday' ? pricing.holidayPrice : pricing.normalPrice,
                    categoryOrder: getCategoryOrder(id),
                }))
                .sort((a, b) => a.categoryOrder - b.categoryOrder || a.title.localeCompare(b.title, 'pt-BR'))
        }

        const grouped = new Map<string, PricingItem>()
        cabins.forEach((cabin) => {
            if (cabin.visibilityStatus === 'HIDDEN') return

            const spaceKey = getCabinSpaceKey({
                id: cabin.id,
                name: cabin.name,
                slug: cabin.slug,
            })
            const legacy = LEGACY_PRICING_BY_SPACE[spaceKey]
            const override = globalConfig?.priceOverrides?.[spaceKey]
            const parsedDbPrice = Number(cabin.pricePerHour)
            const baseNormalPrice = Number.isFinite(parsedDbPrice) && parsedDbPrice > 0
                ? parsedDbPrice
                : (legacy?.normalPrice ?? 0)

            const normalPrice = override?.price ?? baseNormalPrice
            const normalConsumable = override?.consumable ?? legacy?.normalConsumable ?? 0
            const holidayPrice = legacy?.holidayPrice ?? normalPrice
            const holidayConsumable = legacy?.holidayConsumable ?? normalConsumable
            const capacity = Math.max(1, Number(cabin.capacity || 1))

            const mapped: PricingItem = {
                id: spaceKey,
                title: getCabinSpaceLabel({ name: cabin.name, slug: cabin.slug }),
                cap: formatCapacityLabel(capacity),
                val: activeTab === 'holiday' ? holidayConsumable : normalConsumable,
                price: activeTab === 'holiday' ? holidayPrice : normalPrice,
                categoryOrder: getCategoryOrder(spaceKey, cabin.category),
            }

            if (!grouped.has(spaceKey)) {
                grouped.set(spaceKey, mapped)
            }
        })

        return Array.from(grouped.values())
            .sort((a, b) => a.categoryOrder - b.categoryOrder || a.title.localeCompare(b.title, 'pt-BR'))
    }, [activeTab, cabins, globalConfig])

    return (
        <div className="bg-white rounded-[2.5rem] p-10 lg:p-14 shadow-2xl shadow-[#d4a574]/10 border border-[#e0d5c7]/50 relative transition-all duration-500">
            <div className="flex p-1 bg-[#f5f0e8] rounded-2xl mb-12 max-w-sm mx-auto">
                <button
                    onClick={() => setActiveTab('holiday')}
                    className={`flex-1 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'holiday'
                        ? 'bg-[#8B4513] text-white shadow-md'
                        : 'text-[#8a5c3f] hover:text-[#8B4513]'
                        }`}
                >
                    Eventos & Feriados
                </button>
                <button
                    onClick={() => setActiveTab('normal')}
                    className={`flex-1 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'normal'
                        ? 'bg-white text-[#d4a574] shadow-md'
                        : 'text-[#8a5c3f] hover:text-[#d4a574]'
                        }`}
                >
                    Datas Normais
                </button>
            </div>

            <div className="relative mb-8 pt-4">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 animate-fade-in">
                    <div
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] md:text-xs font-medium shadow-xl whitespace-nowrap ${
                            activeTab === 'holiday'
                                ? 'bg-[#8B4513] text-white'
                                : 'bg-[#d4a574] text-white'
                        }`}
                    >
                        <span>
                            {activeTab === 'holiday'
                                ? 'Valores para eventos e feriados'
                                : 'Valores para datas normais'}
                        </span>
                    </div>
                </div>

                <h3 className="font-serif text-2xl font-bold text-[#2a2a2a] flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full transition-colors duration-500 ${activeTab === 'holiday' ? 'bg-[#8B4513]' : 'bg-[#d4a574]'}`} />
                    Tabela de Valores
                </h3>
            </div>

            <div className="space-y-6">
                {pricingItems.map((item) => (
                    <div
                        key={item.id}
                        className="flex flex-wrap justify-between items-end gap-4 pb-6 border-b border-[#f5f0e8] last:border-0 hover:bg-[#faf8f5] p-3 rounded-xl transition-colors group"
                    >
                        <div>
                            <p className="font-serif font-medium text-[#2a2a2a] text-lg lg:text-xl group-hover:text-[#d4a574] transition-colors">{item.title}</p>
                            <p className="text-sm text-[#8a5c3f] mt-1.5 flex items-center gap-2">
                                <Users className="h-4 w-4" /> {item.cap}
                                <span className="w-1 h-1 bg-[#d4a574] rounded-full" />
                                <span className="font-medium">Consome {formatCurrency(item.val)}</span>
                            </p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <p className={`text-2xl font-bold transition-colors duration-500 ${activeTab === 'holiday' ? 'text-[#8B4513]' : 'text-[#d4a574]'}`}>
                                {formatCurrency(item.price)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-6 border-t border-[#f5f0e8] text-center space-y-2">
                <p className="text-xs text-[#a09080] italic">
                    * Valores sincronizados com o cadastro de Espaços e com sobrescritas de preço padrão.
                </p>
                <p className="text-xs text-[#a09080] italic">
                    {activeTab === 'holiday'
                        ? '* Datas especiais podem ter valores específicos definidos na Programação.'
                        : '* Valores válidos para o dia a dia quando não houver regra especial por data.'}
                </p>
            </div>

            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Image src="/logo_aysu.png" width={80} height={80} alt="Logo Bg" />
            </div>
        </div>
    )
}
