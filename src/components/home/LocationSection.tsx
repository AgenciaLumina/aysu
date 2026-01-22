
import { MapPin, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function LocationSection() {
    // Aysú Beach Lounge - Localização
    const placeQuery = encodeURIComponent("Aysú Beach Lounge, Massaguaçu, Caraguatatuba")
    const wazeUrl = `https://waze.com/ul?q=${placeQuery}&navigate=yes`
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${placeQuery}`

    return (
        <section className="py-20 bg-[#fdfbf8] overflow-hidden">
            <div className="container-aissu">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Texto e Botões */}
                    <div className="order-2 lg:order-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4a574]/10 text-[#d4a574] text-xs font-medium uppercase tracking-wider mb-6">
                            <MapPin className="h-3 w-3" />
                            <span>Localização Privilegiada</span>
                        </div>

                        <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[#2a2a2a] mb-6 leading-tight">
                            Onde o paraíso encontra <span className="text-gradient-gold">o mar</span>
                        </h2>

                        <p className="text-[#8a5c3f] text-lg mb-8 leading-relaxed">
                            Estamos localizados na deslumbrante Praia de Massaguaçu, em Caraguatatuba.
                            Um refúgio de fácil acesso, mas longe de tudo o que te estressa.
                        </p>

                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                                    <Button size="lg" className="w-full bg-[#33CCFF] hover:bg-[#00aadd] border-none text-white shadow-lg shadow-[#33CCFF]/20">
                                        <Navigation className="h-4 w-4 mr-2" />
                                        Ir com Waze
                                    </Button>
                                </a>
                                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                                    <Button size="lg" variant="outline" className="w-full border-[#e0d5c7] hover:border-[#d4a574] hover:bg-white text-[#8a5c3f]">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        Google Maps
                                    </Button>
                                </a>
                            </div>

                            <div className="p-4 bg-white rounded-xl border border-[#e0d5c7] flex items-start gap-4 shadow-sm">
                                <div className="mt-1">
                                    <div className="w-2 h-2 rounded-full bg-[#d4a574]" />
                                </div>
                                <div className="text-sm text-[#8a5c3f]">
                                    <strong className="block text-[#2a2a2a] mb-1">Endereço</strong>
                                    Avenida Maria Carlota, 170<br />
                                    Caraguatatuba - SP, 11677-060
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mapa (Iframe estilizado) */}
                    <div className="order-1 lg:order-2 relative group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-[#d4a574]/20 to-[#f1c595]/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-700" />

                        <div className="relative h-[400px] lg:h-[500px] rounded-[2rem] overflow-hidden border border-[#e0d5c7] shadow-2xl">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3656.61617908396!2d-45.325590399999996!3d-23.582224699999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94cd61c170165727%3A0x1b4eb17e6d3f5950!2sAys%C3%BA%20Beach%20Lounge!5e0!3m2!1spt-BR!2sbr!4v1769110628553!5m2!1spt-BR!2sbr"
                                width="100%"
                                height="100%"
                                style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1)' }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />

                            {/* Overlay de interação */}
                            <div className="absolute inset-0 bg-transparent pointer-events-none border-[6px] border-white/20 rounded-[2rem]" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
