// AISSU Beach Lounge - Homepage
// Página inicial do beach club

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, MapPin, UtensilsCrossed, Music, ChevronRight, Star, Users, Waves, Instagram } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import InstagramStories from '@/components/InstagramStories'
import InstagramFeed from '@/components/InstagramFeed'

import { LocationSection } from '@/components/home/LocationSection'
import { PricingSection } from '@/components/home/PricingSection'


export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header variant="transparent" />

      {/* Hero Section with YouTube Video Background */}
      <section className="relative pt-16 min-h-[90vh] flex items-center overflow-hidden">
        {/* YouTube Video Background */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <iframe
            className="absolute top-1/2 left-1/2 min-w-[100vw] min-h-[100vh] w-auto h-auto -translate-x-1/2 -translate-y-1/2 scale-150 grayscale-[0.3]"
            src="https://www.youtube.com/embed/brLps0wydgU?autoplay=1&mute=1&loop=1&playlist=brLps0wydgU&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1&origin=https://aysu.com.br"
            title="Aysú Beach Lounge"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{ border: 'none' }}
          />
        </div>

        {/* Dark Overlay with Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        <div className="container-aissu py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm tracking-widest uppercase mb-8 hover:bg-white/20 transition-all duration-300">
              <Star className="h-3 w-3 text-[#f1c595]" />
              <span>O Melhor Beach Club do Litoral Norte</span>
              <Star className="h-3 w-3 text-[#f1c595]" />
            </div>

            {/* Título */}
            {/* Título */}
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-light leading-tight mb-4 drop-shadow-2xl tracking-tight text-white">
              Pé na areia, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f1c595] to-[#d4a574] font-medium italic">sol na alma</span>
            </h1>

            {/* Hashtag */}
            <p className="font-serif text-3xl md:text-5xl text-white mb-10 font-bold tracking-wide drop-shadow-lg">
              #vemaysúzar
            </p>

            {/* Descrição */}
            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow font-light leading-relaxed">
              Existimos para tornar seu dia de praia, em um dia de praia perfeito!
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/reservas">
                <Button size="xl" className="w-full sm:w-auto min-w-[200px] shadow-xl shadow-[#d4a574]/20 hover:scale-105 transition-transform duration-300">
                  <Calendar className="h-5 w-5 mr-2" />
                  Reservar Bangalô
                </Button>
              </Link>
              <a href="#menu">
                <Button variant="secondary" size="xl" className="w-full sm:w-auto min-w-[200px] bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-transform duration-300">
                  <UtensilsCrossed className="h-5 w-5 mr-2" />
                  Ver Menu Completo
                </Button>
              </a>
            </div>

            {/* Localização */}
            <div className="flex justify-center items-center gap-2 mt-12 text-sm text-white/70 animate-pulse">
              <MapPin className="h-4 w-4 text-[#d4a574]" />
              <span className="tracking-wide">Praia de Massaguaçu, Caraguatatuba-SP</span>
            </div>
          </div>
        </div>
      </section>



      {/* Instagram Section */}
      <section className="py-16 md:py-20 bg-gradient-warm">
        <div className="container-aissu">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl mb-4">
              Acompanhe o{' '}
              <span className="text-gradient-sunset">@aysu_beachlounge</span>
            </h2>
            <p className="text-aissu-text-muted text-lg max-w-2xl mx-auto">
              Viva a experiência Aysú através dos nossos Stories e Feed
            </p>
          </div>

          {/* Stories */}
          <div className="mb-12">
            <InstagramStories />
          </div>

          {/* Feed Grid */}
          <div className="mb-8">
            <InstagramFeed limit={100} />
          </div>

          {/* CTA para Perfil Completo */}
          <div className="text-center">
            <a
              href="https://instagram.com/aysu_beachlounge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] text-sm font-bold uppercase rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              style={{ color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
            >
              <Instagram className="w-5 h-5" style={{ filter: 'brightness(0) invert(1)' }} />
              <span>VER PERFIL COMPLETO</span>
            </a>
          </div>
        </div>
      </section>

      {/* Destaques */}
      <section className="py-20 bg-white">
        <div className="container-aissu">
          <div className="text-center mb-16">
            <span className="text-[#d4a574] text-sm font-bold tracking-[0.2em] uppercase mb-3 block">Experiência</span>
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[#2a2a2a] mb-6">
              Sua jornada no Aysú
            </h2>
            <p className="text-[#8a5c3f] max-w-2xl mx-auto text-lg font-light leading-relaxed">
              Cada detalhe foi pensado para proporcionar momentos inesquecíveis à beira-mar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <Card hoverable className="border-none shadow-xl shadow-[#d4a574]/5 bg-[#fdfbf8]">
              <CardHeader className="text-center pt-8">
                <div className="w-16 h-16 rounded-2xl bg-[#f1c595]/20 flex items-center justify-center mb-6 mx-auto transform transition-transform group-hover:scale-110 duration-500">
                  <Waves className="h-8 w-8 text-[#d4a574]" />
                </div>
                <CardTitle className="font-serif text-2xl mb-3">Piscina & Hidro</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Aproveite nossa piscina com vista para o mar, e relaxe em nossa hidromassagem.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 2 */}
            <Card hoverable className="border-none shadow-xl shadow-[#d4a574]/5 bg-[#fdfbf8]">
              <CardHeader className="text-center pt-8">
                <div className="w-16 h-16 rounded-2xl bg-[#f1c595]/20 flex items-center justify-center mb-6 mx-auto transform transition-transform group-hover:scale-110 duration-500">
                  <UtensilsCrossed className="h-8 w-8 text-[#d4a574]" />
                </div>
                <CardTitle className="font-serif text-2xl mb-3">Alta Gastronomia</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Sabores autênticos do litoral aliados a técnicas contemporâneas, drinks autorais e marcas premium.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Card 3 */}
            <Card hoverable className="border-none shadow-xl shadow-[#d4a574]/5 bg-[#fdfbf8]">
              <CardHeader className="text-center pt-8">
                <div className="w-16 h-16 rounded-2xl bg-[#f1c595]/20 flex items-center justify-center mb-6 mx-auto transform transition-transform group-hover:scale-110 duration-500">
                  <Music className="h-8 w-8 text-[#d4a574]" />
                </div>
                <CardTitle className="font-serif text-2xl mb-3">Vibe & Música</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  A trilha sonora perfeita para o seu dia, seja o som do mar ou em nossas programações especiais djs e um Sunset perfeito.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Day Use Info */}
      <section className="py-24 bg-gradient-to-br from-[#fff9f0] to-[#fff5eb] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />

        <div className="container-aissu relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4a574]/10 text-[#d4a574] text-xs font-medium uppercase tracking-wider mb-6">
                <Star className="h-3 w-3" />
                <span>Exclusividade</span>
              </div>

              <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[#2a2a2a] mb-6 leading-tight">
                Day Use com <br /><span className="text-[#d4a574] italic">Consumação</span>
              </h2>
              <p className="text-[#8a5c3f] text-lg mb-8 leading-relaxed">
                No Aysú, você não paga apenas para entrar.
                <strong className="text-[#d4a574]"> Parte do valor do seu day use</strong> é convertido em crédito para você desfrutar do nosso cardápio premium.
              </p>

              <div className="space-y-6">
                {[
                  "Bangalôs privativos com serviço exclusivo",
                  "Lounges confortáveis e banheiros climatizados",
                  "Acesso exclusivo à praia, piscina e ducha"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-[#d4a574]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#d4a574] transition-colors duration-300">
                      <ChevronRight className="w-4 h-4 text-[#d4a574] group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-[#5a4c40] font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <Link href="/reservas" className="inline-block mt-10">
                <Button size="xl" className="shadow-xl shadow-[#d4a574]/20">
                  <Users className="h-5 w-5 mr-2" />
                  Verificar Disponibilidade
                </Button>
              </Link>
            </div>

            <div className="relative">
              <PricingSection />
            </div>
          </div>
        </div>
      </section>

      {/* Location Section (Novo) */}
      <LocationSection />

      {/* Footer */}
      <Footer />
    </div>
  )
}
