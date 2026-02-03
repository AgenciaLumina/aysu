'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Users, Star } from 'lucide-react'

interface PricingItem {
    title: string
    cap: string
    val: string
    price: string
}

const HOLIDAY_PRICING: PricingItem[] = [
    { title: "Bangalô Lateral", cap: "4-5 pessoas", val: "R$ 700", price: "R$ 1.000" },
    { title: "Bangalô Piscina", cap: "6 pessoas", val: "R$ 1.300", price: "R$ 1.800" },
    { title: "Bangalô Frente Mar", cap: "6-8 pessoas", val: "R$ 1.300", price: "R$ 1.800" },
    { title: "Bangalô Galera", cap: "Até 10 pessoas", val: "R$ 2.000", price: "R$ 2.500" },
    { title: "Sunbed Casal", cap: "2 pessoas", val: "R$ 350", price: "R$ 500" },
    { title: "Day Use Praia", cap: "Pulseira Prata", val: "R$ 150", price: "R$ 200" },
]

const NORMAL_PRICING: PricingItem[] = [
    { title: "Bangalô Lateral", cap: "4-5 pessoas", val: "R$ 500", price: "R$ 600" },
    { title: "Bangalô Piscina", cap: "6 pessoas", val: "R$ 500", price: "R$ 600" },
    { title: "Bangalô Frente Mar", cap: "6-8 pessoas", val: "R$ 600", price: "R$ 720" },
    { title: "Bangalô Galera", cap: "Até 10 pessoas", val: "R$ 1.200", price: "R$ 1.500" },
    { title: "Sunbed Casal", cap: "2 pessoas", val: "R$ 200", price: "R$ 250" },
    { title: "Day Use Praia", cap: "Pulseira Prata", val: "R$ 100", price: "R$ 120" },
]

export default function PricingSection() {
    const [activeTab, setActiveTab] = useState<'normal' | 'holiday'>('holiday')

    const currentPricing = activeTab === 'normal' ? NORMAL_PRICING : HOLIDAY_PRICING

    return (
        <div className="bg-white rounded-[2.5rem] p-10 lg:p-14 shadow-2xl shadow-[#d4a574]/10 border border-[#e0d5c7]/50 relative transition-all duration-500">
            {/* Tabs Selector */}
            <div className="flex p-1 bg-[#f5f0e8] rounded-2xl mb-12 max-w-sm mx-auto">
                <button
                    onClick={() => setActiveTab('holiday')}
                    className={`flex-1 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'holiday'
                        ? 'bg-[#8B4513] text-white shadow-md'
                        : 'text-[#8a5c3f] hover:text-[#8B4513]'
                        }`}
                >
                    Carnaval & Feriados
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

            {/* Header com Badge Dinâmico */}
            <div className="relative mb-8 pt-4">
                {activeTab === 'holiday' && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 animate-fade-in">
                        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#8B4513] text-white text-[10px] md:text-xs font-medium shadow-xl whitespace-nowrap">
                            <span>🎭</span>
                            <span>Valores exclusivos para o Carnaval e Feriados</span>
                        </div>
                    </div>
                )}

                <h3 className="font-serif text-2xl font-bold text-[#2a2a2a] flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full transition-colors duration-500 ${activeTab === 'holiday' ? 'bg-[#8B4513]' : 'bg-[#d4a574]'}`} />
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
                        <p className={`text-2xl font-bold transition-colors duration-500 ${activeTab === 'holiday' ? 'text-[#8B4513]' : 'text-[#d4a574]'}`}>
                            {item.price}
                        </p>
                    </div>
                ))}
            </div>

            {/* Rodapé Dinâmico */}
            <div className="mt-8 pt-6 border-t border-[#f5f0e8] text-center">
                <p className="text-xs text-[#a09080] italic">
                    {activeTab === 'holiday'
                        ? '* Valores válidos para Feriados e Datas Comemorativas (Carnaval 2026).'
                        : '* Valores válidos para Dias de Semana e Finais de Semana Comuns.'}
                </p>
            </div>

            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Image src="/logo_aysu.png" width={80} height={80} alt="Logo Bg" />
            </div>
        </div>
    )
}
