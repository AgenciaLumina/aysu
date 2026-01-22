'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Phone, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface HeaderProps {
    variant?: 'transparent' | 'solid'
}

const navLinks = [
    { href: '/reservas', label: 'Reservas' },
    { href: '/cardapio', label: 'Cardápio' },
    { href: '/midia', label: 'Na Mídia' },
    { href: '/eventos', label: 'Faça seu Evento' },
]

export function Header({ variant = 'solid' }: HeaderProps) {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }

        // Check initial scroll position
        handleScroll()

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Determinar estilo baseado em variant e scroll
    const isTransparent = variant === 'transparent' && !isScrolled

    const headerClasses = isTransparent
        ? 'bg-transparent'
        : 'bg-white/95 backdrop-blur-md border-b border-[#e0d5c7] shadow-sm'

    const textClasses = isTransparent
        ? '!text-white hover:!text-white/80'
        : 'text-[#8a5c3f] hover:text-[#bc8e5e]'

    return (
        <>
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerClasses}`}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="block group">
                        <div className="w-[72px] h-[72px] rounded-full bg-white shadow-lg overflow-hidden flex items-center justify-center">
                            <Image
                                src="/logo_aysu.png"
                                alt="Aysú Beach Lounge"
                                width={72}
                                height={72}
                                priority
                                unoptimized
                                className="object-cover"
                            />
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-sm font-medium transition-colors ${textClasses}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        {/* Telefone - Desktop */}
                        <a
                            href="tel:+5512991234567"
                            className={`hidden lg:flex items-center gap-2 text-sm transition-colors ${textClasses}`}
                        >
                            <Phone className="h-4 w-4" />
                            <span>(12) 99123-4567</span>
                        </a>

                        {/* CTA Reservar */}
                        <Link href="/reservas" className="hidden sm:block">
                            <Button size="sm">
                                <Calendar className="h-4 w-4" />
                                Reservar
                            </Button>
                        </Link>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`md:hidden p-2 rounded-lg transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-[#8a5c3f] hover:bg-[#f5f0e8]'}`}
                            aria-label="Menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Menu Panel */}
                    <div className="absolute top-0 right-0 w-80 max-w-[85vw] h-full bg-white shadow-2xl">
                        <div className="p-6 pt-20">
                            {/* Logo no menu */}
                            <div className="mb-8 pb-6 border-b border-[#e0d5c7]">
                                <Image
                                    src="/logo_aysu.png"
                                    alt="Aysú Beach Lounge"
                                    width={56}
                                    height={56}
                                    priority
                                    unoptimized
                                    className="rounded-full"
                                />
                            </div>

                            {/* Navigation Links */}
                            <nav className="space-y-1">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#2a2a2a] hover:bg-[#f5f0e8] transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>

                            {/* CTA */}
                            <div className="mt-8 pt-6 border-t border-[#e0d5c7]">
                                <Link
                                    href="/reservas"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <Button className="w-full" size="lg">
                                        <Calendar className="h-5 w-5" />
                                        Reservar Agora
                                    </Button>
                                </Link>
                            </div>

                            {/* Contato */}
                            <div className="mt-6 space-y-3">
                                <a
                                    href="tel:+5512991234567"
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#8a5c3f] hover:bg-[#f5f0e8] transition-colors"
                                >
                                    <Phone className="h-5 w-5" />
                                    (12) 99123-4567
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Spacer for fixed header (only for solid variant) */}
            {variant === 'solid' && <div className="h-[72px]" />}
        </>
    )
}
