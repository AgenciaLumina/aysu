// AISSU Beach Lounge - Na Mídia
// Página de mídia e vídeos

'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Play, Tv, Camera, Film, Star } from 'lucide-react'

export default function NaMidiaPage() {
    // Extrair ID do vídeo YouTube
    const videoId = 'BKOf4VkHtzg'

    return (
        <div className="min-h-screen bg-[#fdfbf8]">
            <Header variant="solid" />

            {/* Hero Section Padronizado */}
            <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
                {/* Background Video */}
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                    <iframe
                        className="absolute top-1/2 left-1/2 min-w-[100vw] min-h-[100vh] w-auto h-auto -translate-x-1/2 -translate-y-1/2 scale-150"
                        src="https://www.youtube.com/embed/brLps0wydgU?autoplay=1&mute=1&loop=1&playlist=brLps0wydgU&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1&origin=https://aysu.com.br"
                        title="Aysú Beach Lounge"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        style={{ border: 'none' }}
                    />
                </div>
                {/* Gradiente Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />

                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    <p className="text-sm tracking-[0.3em] uppercase text-white/90 mb-4">
                        Aysú na Mídia
                    </p>
                    <h1
                        className="font-serif text-4xl md:text-6xl lg:text-7xl font-light mb-6"
                        style={{ color: '#FFFFFF' }}
                    >
                        Reconhecimento
                    </h1>
                    <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light">
                        Veja nossa estrutura, ambientes e descubra porque somos o destino preferido do Litoral Norte.
                    </p>
                </div>
            </section>

            {/* Featured Video Section */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    {/* Video Container */}
                    <div className="relative max-w-5xl mx-auto">
                        {/* Decorative Frame */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-[#f1c595]/20 via-[#d4a574]/30 to-[#f1c595]/20 rounded-3xl blur-xl opacity-50" />

                        {/* Video Card */}
                        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#e0d5c7]">
                            <VideoPlayer videoId={videoId} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Highlights Section */}
            <section className="py-20 bg-gradient-to-br from-[#f1c595]/10 to-[#d4a574]/5">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2a2a2a] mb-4">
                            Por que escolher o Aysú?
                        </h2>
                        <p className="text-[#8a5c3f] max-w-2xl mx-auto">
                            Uma experiência completa que combina conforto, gastronomia e a beleza natural do litoral.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Highlight 1 */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#e0d5c7] text-center hover:shadow-xl transition-shadow">
                            <div className="w-16 h-16 rounded-2xl bg-[#f1c595]/30 flex items-center justify-center mx-auto mb-6">
                                <Camera className="h-8 w-8 text-[#d4a574]" />
                            </div>
                            <h3 className="font-serif text-xl font-bold text-[#2a2a2a] mb-3">
                                Estrutura Premium
                            </h3>
                            <p className="text-[#8a5c3f]">
                                Bangalôs exclusivos, piscina, hidromassagem e espaços instagramáveis em cada canto.
                            </p>
                        </div>

                        {/* Highlight 2 */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#e0d5c7] text-center hover:shadow-xl transition-shadow">
                            <div className="w-16 h-16 rounded-2xl bg-[#f1c595]/30 flex items-center justify-center mx-auto mb-6">
                                <Film className="h-8 w-8 text-[#d4a574]" />
                            </div>
                            <h3 className="font-serif text-xl font-bold text-[#2a2a2a] mb-3">
                                Gastronomia Caiçara
                            </h3>
                            <p className="text-[#8a5c3f]">
                                Cardápio autoral com frutos do mar frescos, drinks artesanais e sabores únicos.
                            </p>
                        </div>

                        {/* Highlight 3 */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#e0d5c7] text-center hover:shadow-xl transition-shadow">
                            <div className="w-16 h-16 rounded-2xl bg-[#f1c595]/30 flex items-center justify-center mx-auto mb-6">
                                <Tv className="h-8 w-8 text-[#d4a574]" />
                            </div>
                            <h3 className="font-serif text-xl font-bold text-[#2a2a2a] mb-3">
                                Consumação Inclusa
                            </h3>
                            <p className="text-[#8a5c3f]">
                                Seu day use é convertido em consumo. Aproveite sem preocupações extras.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
                    <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2a2a2a] mb-6">
                        Pronto para viver essa experiência?
                    </h2>
                    <p className="text-lg text-[#8a5c3f] mb-8">
                        Reserve seu espaço e venha conhecer o Aysú Beach Lounge pessoalmente.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/reservas"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#d4a574] to-[#bc8e5e] font-medium rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                            style={{ color: '#ffffff' }}
                        >
                            Fazer Reserva
                        </a>
                        <a
                            href="/cardapio"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#8a5c3f] font-medium rounded-xl border-2 border-[#e0d5c7] hover:border-[#d4a574] transition-all"
                        >
                            Ver Cardápio
                        </a>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

function VideoPlayer({ videoId }: { videoId: string }) {
    const [isPlaying, setIsPlaying] = useState(false)

    if (!isPlaying) {
        return (
            <div className="aspect-video relative group cursor-pointer" onClick={() => setIsPlaying(true)}>
                <img
                    src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                    alt="Tour Virtual Aysú"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />

                {/* Play Button */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                    <div className="w-16 h-16 bg-[#d4a574] rounded-full flex items-center justify-center shadow-lg">
                        <Play className="h-6 w-6 text-white ml-1 fill-white" />
                    </div>
                </div>

                <div className="absolute bottom-6 left-6 text-white">
                    <h3 className="font-serif text-2xl font-bold mb-2">Tour Virtual Aysú</h3>
                    <p className="text-white/80">Conheça nossa estrutura completa</p>
                </div>
            </div>
        )
    }

    return (
        <div className="aspect-video">
            <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1&disablekb=1&fs=1&iv_load_policy=3`}
                title="Aysú Beach Lounge - Tour Virtual"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
            />
        </div>
    )
}
