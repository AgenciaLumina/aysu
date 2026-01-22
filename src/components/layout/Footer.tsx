import Link from 'next/link'
import Image from 'next/image'
import { Phone, MapPin, Instagram, Mail } from 'lucide-react'

const footerLinks = {
    navegacao: [
        { href: '/reservas', label: 'Reservas' },
        { href: '/cardapio', label: 'Cardápio' },
        { href: '/midia', label: 'Na Mídia' },
        { href: '/eventos', label: 'Faça seu Evento' },
    ],
    legal: [
        { href: '/politicas/termos', label: 'Termos de Uso' },
        { href: '/politicas/privacidade', label: 'Privacidade' },
        { href: '/politicas/cancelamento', label: 'Cancelamento' },
    ],
}

export function Footer() {
    return (
        <footer className="bg-[#2a2a2a] text-white">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="inline-block mb-6">
                            <Image
                                src="/logo_aysu.png"
                                alt="Aysú Beach Lounge"
                                width={72}
                                height={72}
                                className="rounded-full"
                            />
                        </Link>
                        <p className="text-white/70 text-sm leading-relaxed">
                            O melhor Beach Club do Litoral Norte de São Paulo.
                            Experiência premium à beira-mar na Praia de Massaguaçu.
                        </p>
                    </div>

                    {/* Navegação */}
                    <div>
                        <h4 className="font-serif font-bold text-lg mb-6 text-[#d4a574]">Navegação</h4>
                        <ul className="space-y-3">
                            {footerLinks.navegacao.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-white/70 hover:text-white transition-colors text-sm"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contato */}
                    <div>
                        <h4 className="font-serif font-bold text-lg mb-6 text-[#d4a574]">Contato</h4>
                        <ul className="space-y-4">
                            <li>
                                <a
                                    href="https://wa.me/5512982896301"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-white/70 hover:text-white transition-colors text-sm"
                                >
                                    <Phone className="h-4 w-4 text-[#d4a574]" />
                                    (12) 98289-6301
                                </a>
                            </li>
                            <li>
                                <a
                                    href="mailto:contato@aysu.com.br"
                                    className="flex items-center gap-3 text-white/70 hover:text-white transition-colors text-sm"
                                >
                                    <Mail className="h-4 w-4 text-[#d4a574]" />
                                    contato@aysu.com.br
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://instagram.com/aysu_beachlounge"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-white/70 hover:text-white transition-colors text-sm"
                                >
                                    <Instagram className="h-4 w-4 text-[#d4a574]" />
                                    @aysu_beachlounge
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Localização */}
                    <div>
                        <h4 className="font-serif font-bold text-lg mb-6 text-[#d4a574]">Localização</h4>
                        <div className="flex items-start gap-3 text-white/70 text-sm">
                            <MapPin className="h-4 w-4 text-[#d4a574] mt-0.5 flex-shrink-0" />
                            <div>
                                <p>Praia de Massaguaçu</p>
                                <p>Avenida Maria Carlota, 170</p>
                                <p>Caraguatatuba - SP</p>
                                <p>CEP 11677-060</p>
                            </div>
                        </div>
                        {/* Maps & Waze Buttons */}
                        <div className="flex items-center gap-3 mt-4">
                            <a
                                href="https://www.google.com/maps/search/?api=1&query=Avenida+Maria+Carlota,+170,+Caraguatatuba,+Sao+Paulo,+Brazil+11677060"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
                                title="Abrir no Google Maps"
                            >
                                {/* Google Maps - Cor oficial vermelha */}
                                <svg className="h-4 w-4" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                    <circle fill="#B31412" cx="12" cy="9" r="2.5" />
                                </svg>
                                Maps
                            </a>
                            <a
                                href="https://waze.com/ul?q=Avenida+Maria+Carlota+170+Caraguatatuba+SP+11677060&navigate=yes"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
                                title="Abrir no Waze"
                            >
                                {/* Waze - Cor oficial azul */}
                                <svg className="h-4 w-4" viewBox="0 0 24 24">
                                    <path fill="#33CCFF" d="M12 2c-4.42 0-8 3.58-8 8 0 3.5 2.26 6.48 5.4 7.56-.04.5-.08 1.25.08 1.79.15.51.51 1.15.51 1.15s.45-.35.96-.68c.41-.26.82-.58.82-.58.39.08.78.13 1.18.13 4.42 0 8-3.58 8-8s-3.58-8-8-8z" />
                                    <circle fill="#fff" cx="9" cy="9" r="1" />
                                    <circle fill="#fff" cx="15" cy="9" r="1" />
                                    <path fill="#fff" d="M12 14c-1.1 0-2-.67-2-1.5h4c0 .83-.9 1.5-2 1.5z" />
                                </svg>
                                Waze
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-white/50 text-sm">
                            © {new Date().getFullYear()} Aysú Beach Lounge. Todos os direitos reservados.
                        </p>
                        <div className="flex flex-col items-center md:items-end gap-2">
                            <div className="flex items-center gap-6">
                                {footerLinks.legal.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="text-white/50 hover:text-white/80 transition-colors text-xs"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                            <a
                                href="https://www.agencialumina.com.br"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/30 hover:text-white/60 transition-colors text-[10px] uppercase tracking-wider"
                            >
                                Desenvolvido por Agência Lumina
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
