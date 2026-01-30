// AISSU Beach Lounge - Experiências
// Página de serviços de massagem e terapias holísticas

import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Sparkles, Flower2, Footprints, Stars, MessageCircle, Clock, CheckCircle2 } from 'lucide-react'

// Dados dos serviços extraídos das imagens
const services = [
    {
        category: 'Massagens & Terapias',
        description: 'Relaxe e renove suas energias com nossas terapeutas especializadas.',
        icon: Flower2,
        items: [
            {
                name: 'Massagem Relaxante',
                description: 'Com óleos essenciais',
                price: 'R$ 120',
                duration: '30 min',
                highlight: true
            },
            {
                name: 'Massagem com Flores',
                description: 'Sensorial e calmante',
                price: 'R$ 120',
                duration: '30 min',
            },
            {
                name: 'Reflexologia Podal',
                description: 'Equilíbrio através da massagem nos pés',
                price: 'R$ 60',
                duration: '20 min',
            },
            {
                name: 'Reiki Cristaloterapia',
                description: 'Equilíbrio Energético',
                price: 'R$ 80',
                duration: '30 min',
            }
        ]
    },
    {
        category: 'Holístico & Tarôt 2026',
        description: 'Conecte-se com sua intuição e receba orientações para o novo ciclo.',
        icon: Stars,
        items: [
            {
                name: 'Tarôt 2026 Completo',
                description: 'Aconselhamento do Baralho + Previsões 2026',
                price: 'R$ 190',
                duration: '80 min',
                highlight: true
            },
            {
                name: 'Tarôt Leitura',
                description: 'Leitura completa',
                price: 'R$ 90',
                duration: '30 min',
            },
            {
                name: 'Tarôt Pergunta Avulsa',
                description: 'Aconselhamento do Baralho',
                price: 'R$ 20',
                duration: '10 min',
            },
            {
                name: 'Escalda Pés Ervas e Flores',
                description: 'Equilíbrio & Relaxamento',
                price: 'R$ 80',
                duration: '20 min',
            }
        ]
    }
]

export default function ExperienciasPage() {
    return (
        <div className="min-h-screen bg-[#fcfaf8]">
            <Header variant="transparent" />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
                {/* Background Image/Gradient */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/espacos/bangalo9.jpeg" // Usando uma imagem relaxante existente
                        alt="Relaxamento no Aysú"
                        fill
                        className="object-cover opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#fcfaf8]/80 via-[#fcfaf8]/90 to-[#fcfaf8]" />
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4a574]/10 text-[#d4a574] text-xs font-medium uppercase tracking-widest mb-6">
                        <Sparkles className="h-3 w-3" />
                        <span>Bem-estar & Conexão</span>
                    </div>

                    <h1 className="font-serif text-4xl md:text-6xl text-[#2a2a2a] mb-6">
                        Cuidados Terapêuticos <br />
                        <span className="text-[#d4a574] italic">No Aysú</span>
                    </h1>

                    <p className="text-[#8a5c3f] text-lg max-w-2xl mx-auto mb-10 font-light">
                        Permita-se viver momentos de profundo relaxamento e autoconhecimento à beira-mar.
                        Uma jornada de reconexão conduzida por terapeutas integrativas.
                    </p>

                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 text-[#5a4c40]">
                            <span className="w-12 h-[1px] bg-[#d4a574]" />
                            <span className="font-serif italic text-lg">Taís Soadara</span>
                            <span className="w-12 h-[1px] bg-[#d4a574]" />
                        </div>
                        <p className="text-xs tracking-widest uppercase text-[#8a5c3f]/70">Terapeuta Integrativa</p>
                    </div>
                </div>
            </section>

            {/* Services Grid */}
            <section className="pb-24 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
                        {services.map((category, idx) => (
                            <div key={idx} className="space-y-8">
                                <div className="text-center lg:text-left">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#f1c595]/20 text-[#d4a574] mb-4">
                                        <category.icon className="h-6 w-6" />
                                    </div>
                                    <h2 className="font-serif text-3xl text-[#2a2a2a] mb-3">{category.category}</h2>
                                    <p className="text-[#8a5c3f]">{category.description}</p>
                                </div>

                                <div className="space-y-4">
                                    {category.items.map((item, itemIdx) => (
                                        <div
                                            key={itemIdx}
                                            className={`group relative p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg
                        ${item.highlight
                                                    ? 'bg-gradient-to-br from-[#8b4513] to-[#7a3c0f] border-transparent text-white shadow-xl shadow-[#8b4513]/20'
                                                    : 'bg-white border-[#e0d5c7] hover:border-[#d4a574]/50'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <h3 className={`font-serif text-xl mb-1 ${item.highlight ? 'text-white' : 'text-[#2a2a2a]'}`}>
                                                        {item.name}
                                                    </h3>
                                                    <p className={`text-sm ${item.highlight ? 'text-white/80' : 'text-[#8a5c3f]'}`}>
                                                        {item.description}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-2xl font-bold ${item.highlight ? 'text-[#f1c595]' : 'text-[#d4a574]'}`}>
                                                        {item.price}
                                                    </div>
                                                    <div className={`flex items-center justify-end gap-1 text-xs mt-1 ${item.highlight ? 'text-white/60' : 'text-[#a09080]'}`}>
                                                        <Clock className="h-3 w-3" />
                                                        {item.duration}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Whatsapp */}
            <section className="py-20 bg-[#2a2a2a] relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]" />

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <h2 className="font-serif text-3xl md:text-5xl text-white mb-8">
                        Agende seu momento de <br />
                        <span className="text-[#d4a574] italic">paz e equilíbrio</span>
                    </h2>

                    <a
                        href="https://wa.me/5511992066688"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex group"
                    >
                        <Button size="xl" className="bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-xl shadow-[#25D366]/20 py-8 px-10 text-xl">
                            <MessageCircle className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
                            Agendar via WhatsApp
                            <span className="ml-3 text-sm opacity-80 font-normal border-l border-white/30 pl-3">
                                (11) 99206-6688
                            </span>
                        </Button>
                    </a>

                    <p className="mt-8 text-white/40 text-sm">
                        Atendimento mediante disponibilidade de agenda.
                    </p>
                </div>
            </section>

            <Footer />
        </div>
    )
}
