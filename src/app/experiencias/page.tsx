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
            <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
                {/* Background Image with Parallax Effect */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/ocean_hero_background.png"
                        alt="Aysú Experiências"
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Overlay Gradiente Sofisticado */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#fcfaf8]" />
                    <div className="absolute inset-0 bg-black/20" />
                </div>

                <div className="container mx-auto px-6 relative z-10 text-center text-white">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium uppercase tracking-[0.2em] mb-8 shadow-lg">
                        <Sparkles className="h-3 w-3" />
                        <span>Bem-estar & Conexão</span>
                    </div>

                    <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-6 drop-shadow-2xl">
                        Experiências <br />
                        <span className="italic text-[#f1c595]">Aysú</span>
                    </h1>

                    <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light leading-relaxed drop-shadow-md">
                        Permita-se viver momentos de profundo relaxamento e autoconhecimento à beira-mar.
                        Uma jornada de reconexão conduzida por terapeutas integrativas.
                    </p>

                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-4 text-white/80">
                            <span className="w-16 h-[1px] bg-[#f1c595]" />
                            <span className="font-serif italic text-xl">Taís Soadara</span>
                            <span className="w-16 h-[1px] bg-[#f1c595]" />
                        </div>
                        <p className="text-xs tracking-[0.3em] uppercase text-white/70">Terapeuta Integrativa</p>
                    </div>
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-24 px-6 relative">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-50">
                    <div className="absolute top-20 left-10 w-96 h-96 bg-[#f1c595]/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-[#d4a574]/5 rounded-full blur-3xl" />
                </div>

                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
                        {services.map((category, idx) => (
                            <div key={idx} className="space-y-10">
                                <div className="text-center lg:text-left">
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f1c595]/30 to-[#d4a574]/10 text-[#d4a574] mb-6 shadow-sm">
                                        <category.icon className="h-7 w-7" />
                                    </div>
                                    <h2 className="font-serif text-4xl text-[#2a2a2a] mb-4">{category.category}</h2>
                                    <p className="text-[#8a5c3f] text-lg leading-relaxed">{category.description}</p>
                                </div>

                                <div className="space-y-5">
                                    {category.items.map((item, itemIdx) => (
                                        <div
                                            key={itemIdx}
                                            className={`group relative p-8 rounded-3xl border transition-all duration-500
                        ${item.highlight
                                                    ? 'bg-gradient-to-br from-[#8b4513] to-[#6d360f] border-transparent text-white shadow-2xl shadow-[#8b4513]/20 scale-[1.02]'
                                                    : 'bg-white/80 backdrop-blur-sm border-[#efe6dc] hover:border-[#d4a574]/30 hover:shadow-xl hover:shadow-[#d4a574]/5 hover:-translate-y-1'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <h3 className={`font-serif text-2xl mb-2 ${item.highlight ? 'text-white' : 'text-[#2a2a2a]'}`}>
                                                        {item.name}
                                                    </h3>
                                                    <p className={`text-sm leading-relaxed ${item.highlight ? 'text-white/80' : 'text-[#8a5c3f]'}`}>
                                                        {item.description}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-3xl font-light ${item.highlight ? 'text-[#f1c595]' : 'text-[#d4a574]'}`}>
                                                        {item.price}
                                                    </div>
                                                    <div className={`flex items-center justify-end gap-1.5 text-xs font-medium tracking-wide mt-2 uppercase ${item.highlight ? 'text-white/60' : 'text-[#a09080]'}`}>
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
            <section className="py-32 bg-[#1a1a1a] relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <Image
                        src="/ocean_hero_background.png"
                        alt="Background"
                        fill
                        className="object-cover grayscale"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/90 to-transparent" />

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <h2 className="font-serif text-4xl md:text-6xl text-white mb-10 drop-shadow-lg">
                        Agende seu momento de <br />
                        <span className="text-[#d4a574] italic">paz e equilíbrio</span>
                    </h2>

                    <a
                        href="https://wa.me/5511992066688"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex group relative"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                        <Button size="xl" className="relative bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-2xl py-8 px-12 text-xl rounded-2xl transition-all duration-300 transform group-hover:scale-[1.02]">
                            <MessageCircle className="h-7 w-7 mr-4" />
                            Agendar via WhatsApp
                            <span className="ml-4 text-sm opacity-80 font-normal border-l border-white/30 pl-4 tracking-wide">
                                (11) 99206-6688
                            </span>
                        </Button>
                    </a>

                    <p className="mt-12 text-white/40 text-sm tracking-wide uppercase">
                        Atendimento mediante disponibilidade de agenda.
                    </p>
                </div>
            </section>

            <Footer />
        </div>
    )
}
