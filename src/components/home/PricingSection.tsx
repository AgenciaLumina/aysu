'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Users, Star, Info } from 'lucide-react'
import { formatCurrency, formatDateUTC } from '@/lib/utils'

interface PricingItem {
    id: string
    title: string
    cap: string
    val: string
    price: string
}

const HOLIDAY_DEFAULT_PRICING: PricingItem[] = [
    { id: "bangalo-lateral", title: "Bangalô Lateral", cap: "4-5 pessoas", val: "R$ 700", price: "R$ 1.000" },
    { id: "bangalo-piscina", title: "Bangalô Piscina", cap: "6 pessoas", val: "R$ 1.300", price: "R$ 1.800" },
    { id: "bangalo-frente-mar", title: "Bangalô Frente Mar", cap: "6-8 pessoas", val: "R$ 1.300", price: "R$ 1.800" },
    { id: "bangalo-central", title: "Bangalô Central", cap: "Até 10 pessoas", val: "R$ 2.000", price: "R$ 2.500" },
    { id: "sunbed-casal", title: "Sunbed Casal", cap: "2 pessoas", val: "R$ 350", price: "R$ 500" },
    { id: "day-use-praia", title: "Day Use Praia", cap: "Pulseira Prata", val: "R$ 150", price: "R$ 200" },
]

const NORMAL_PRICING: PricingItem[] = [
    { id: "bangalo-lateral", title: "Bangalô Lateral", cap: "4-5 pessoas", val: "R$ 500", price: "R$ 600" },
    { id: "bangalo-piscina", title: "Bangalô Piscina", cap: "6 pessoas", val: "R$ 500", price: "R$ 600" },
    { id: "bangalo-frente-mar", title: "Bangalô Frente Mar", cap: "6-8 pessoas", val: "R$ 600", price: "R$ 720" },
    { id: "bangalo-central", title: "Bangalô Central", cap: "Até 10 pessoas", val: "R$ 1.200", price: "R$ 1.500" },
    { id: "sunbed-casal", title: "Sunbed Casal", cap: "2 pessoas", val: "R$ 200", price: "R$ 250" },
    { id: "day-use-praia", title: "Day Use Praia", cap: "Pulseira Prata", val: "R$ 100", price: "R$ 120" },
]

export default function PricingSection() {
    const [activeTab, setActiveTab] = useState<'normal' | 'event'>('event')
    const [nearestEvent, setNearestEvent] = useState<any>(null)
    const [eventPricing, setEventPricing] = useState<PricingItem[]>(HOLIDAY_DEFAULT_PRICING)

    useEffect(() => {
        fetch('/api/events?isActive=true')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data && data.data.length > 0) {
                    const now = new Date()
                    // Procura o evento mais próximo que seja no futuro ou hoje
                    const upcoming = data.data.filter((e: any) => new Date(e.startDate) >= now)
                    if (upcoming.length > 0) {
                        const eventObj = upcoming[0]
                        setNearestEvent(eventObj)

                        // Parse de overrides de preços
                        if (eventObj.spacePricesOverrides) {
                            let overrides: any = {}
                            try {
                                overrides = typeof eventObj.spacePricesOverrides === 'string' ? JSON.parse(eventObj.spacePricesOverrides) : eventObj.spacePricesOverrides
                            } catch (e) {
                                console.error('Erro ao parsear spacePricesOverrides', e)
                            }

                            const newEventPricing = HOLIDAY_DEFAULT_PRICING.map(item => {
                                const ov = overrides[item.id]
                                if (ov) {
                                    return {
                                        ...item,
                                        price: formatCurrency(Number(ov.price)),
                                        val: formatCurrency(Number(ov.consumable))
                                    }
                                }
                                return item
                            })
                            setEventPricing(newEventPricing)
                        }
                    } else {
                        // Sem próximos eventos, volta para tab normal
                        setActiveTab('normal')
                    }
                }
            })
            .catch(err => console.error('Erro ao buscar eventos', err))
    }, [])

    const currentPricing = activeTab === 'normal' ? NORMAL_PRICING : eventPricing
    const eventTabTitle = nearestEvent ? nearestEvent.title : 'Eventos & Feriados'

    return (
        <div className="bg-white rounded-[2.5rem] p-10 lg:p-14 shadow-2xl shadow-[#d4a574]/10 border border-[#e0d5c7]/50 relative transition-all duration-500">
            {/* Tabs Selector */}
            <div className="flex p-1 bg-[#f5f0e8] rounded-2xl mb-12 max-w-sm mx-auto shadow-inner">
                <button
                    onClick={() => setActiveTab('event')}
                    className={`flex-1 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'event'
                        ? 'bg-[#8B4513] text-white shadow-md transform scale-105'
                        : 'text-[#8a5c3f] hover:text-[#8B4513]'
                        }`}
                >
                    {eventTabTitle}
                </button>
                <button
                    onClick={() => setActiveTab('normal')}
                    className={`flex-1 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'normal'
                        ? 'bg-white text-[#d4a574] shadow-md transform scale-105'
                        : 'text-[#8a5c3f] hover:text-[#d4a574]'
                        }`}
                >
                    Datas Normais
                </button>
            </div>

            {/* Header com Badge Dinâmico */}
            <div className="relative mb-8 pt-4">
                {activeTab === 'event' && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 animate-fade-in">
                        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#8B4513] text-white text-[10px] md:text-xs font-medium shadow-xl whitespace-nowrap">
                            <span>✨</span>
                            <span>Valores exclusivos para {nearestEvent ? nearestEvent.title : 'Feriados'}</span>
                        </div>
                    </div>
                )}

                <h3 className="font-serif text-2xl font-bold text-[#2a2a2a] flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full transition-colors duration-500 ${activeTab === 'event' ? 'bg-[#8B4513]' : 'bg-[#d4a574]'}`} />
                    Tabela de Valores
                </h3>
            </div>

            {/* Listagem de Preços */}
            <div className="space-y-6">
                {currentPricing.map((item, i) => (
                    <div
                        key={i}
                        className="flex flex-wrap justify-between items-end gap-4 pb-6 border-b border-[#f5f0e8] last:border-0 hover:bg-[#faf8f5] p-3 rounded-xl transition-colors group"
                    >
                        <div>
                            <p className="font-serif font-medium text-[#2a2a2a] text-lg lg:text-xl group-hover:text-[#d4a574] transition-colors">{item.title}</p>
                            <p className="text-sm text-[#8a5c3f] mt-1.5 flex items-center gap-2">
                                <Users className="h-4 w-4" /> {item.cap}
                                <span className="w-1 h-1 bg-[#d4a574] rounded-full" />
                                <span className="font-medium">Consome {item.val}</span>
                            </p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            {item.title === "Bangalô Frente Mar" && activeTab === 'normal' && (
                                <span className="inline-block bg-[#d4a574]/20 text-[#8a5c3f] text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                                    A PARTIR
                                </span>
                            )}
                            <div className="flex items-center gap-2">
                                <p className={`text-2xl font-bold transition-colors duration-500 ${activeTab === 'event' ? 'text-[#8B4513]' : 'text-[#d4a574]'}`}>
                                    {item.price}
                                </p>
                                {item.title === "Bangalô Frente Mar" && activeTab === 'normal' && (
                                    <div className="relative group">
                                        <Info className="h-4 w-4 text-[#d4a574] animate-pulse cursor-help" />
                                        {/* Tooltip simples */}
                                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-[#2a2a2a] text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10 pointer-events-none">
                                            Valor para 6 pessoas. Até 8 pessoas mediante taxa extra.
                                            <div className="absolute -bottom-1 right-1 w-2 h-2 bg-[#2a2a2a] rotate-45"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Rodapé Dinâmico */}
            <div className="mt-8 pt-6 border-t border-[#f5f0e8] text-center space-y-2">
                <p className="text-xs text-[#a09080] italic">
                    * Bangalô Frente Mar: Valor referente a 6 pessoas. Excedentes (até o limite de 8) pagam Day Use Tradicional.
                </p>
                <p className="text-xs text-[#a09080] italic">
                    {activeTab === 'event'
                        ? nearestEvent ? `* Valores limitados e exclusivos para data de ${formatDateUTC(nearestEvent.startDate)}.` : '* Valores válidos para Feriados e Datas Comemorativas.'
                        : '* Valores válidos para Dias de Semana e Finais de Semana Comuns.'}
                </p>
            </div>

            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Image src="/logo_aysu.png" width={80} height={80} alt="Logo Bg" />
            </div>
        </div>
    )
}
