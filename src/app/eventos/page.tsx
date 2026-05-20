'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
    Calendar, Users, MapPin, Phone, Mail,
    Sparkles, Wine, UtensilsCrossed, Camera, Music,
    Check, ChevronRight, Star, Heart
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils'
import { DEFAULT_SITE_CONTENT, parseSiteContentConfig } from '@/lib/site-content'
import toast from 'react-hot-toast'

const contentIconMap = {
    calendar: Calendar,
    camera: Camera,
    heart: Heart,
    'map-pin': MapPin,
    music: Music,
    sparkles: Sparkles,
    star: Star,
    users: Users,
    utensils: UtensilsCrossed,
}

export default function EventosPage() {
    const [siteContent, setSiteContent] = useState(DEFAULT_SITE_CONTENT)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        eventType: '',
        eventDate: '',
        guestCount: '',
        message: '',
    })
    const [submitting, setSubmitting] = useState(false)
    const eventsContent = siteContent.events

    useEffect(() => {
        let cancelled = false

        fetch('/api/site-content')
            .then((res) => res.json())
            .then((data) => {
                const payload = data?.data?.content ?? data?.data

                if (data?.success && payload && !cancelled) {
                    setSiteContent(parseSiteContentConfig(payload))
                }
            })
            .catch(() => {})

        return () => {
            cancelled = true
        }
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        // Simula envio
        await new Promise(r => setTimeout(r, 1500))

        toast.success('Solicitação enviada! Entraremos em contato em breve.')
        setFormData({
            name: '',
            email: '',
            phone: '',
            eventType: '',
            eventDate: '',
            guestCount: '',
            message: '',
        })
        setSubmitting(false)
    }

    return (
        <div className="min-h-screen bg-[#fdfbf8]">
            <Header variant="transparent" />

            {/* Hero */}
            <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
                {/* YouTube Video Background */}
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                    <iframe
                        className="absolute left-1/2 top-1/2 h-[56.25vw] w-[177.78vh] min-h-full min-w-full max-w-none -translate-x-1/2 -translate-y-1/2 scale-[1.08] md:scale-[1.22]"
                        src="https://www.youtube.com/embed/brLps0wydgU?autoplay=1&mute=1&loop=1&playlist=brLps0wydgU&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1&origin=https://aysu.com.br"
                        title="Aysú Beach Lounge"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        style={{ border: 'none' }}
                    />
                </div>
                {/* Gradiente forte para garantir legibilidade do texto */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />

                {/* Content */}
                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    <p className="text-sm tracking-[0.3em] uppercase text-white/90 mb-4">
                        {eventsContent.hero.eyebrow}
                    </p>
                    <h1
                        className="font-serif text-4xl md:text-6xl lg:text-7xl font-light mb-6"
                        style={{ color: '#FFFFFF' }}
                    >
                        {eventsContent.hero.title}
                    </h1>
                    <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-8">
                        {eventsContent.hero.subtitle}
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button size="lg" onClick={() => document.getElementById('orcamento')?.scrollIntoView({ behavior: 'smooth' })}>
                            {eventsContent.hero.primaryCtaLabel}
                        </Button>
                        <Button asChild variant="outline" size="lg" className="!border-white !text-white hover:!bg-white/10">
                            <a href={eventsContent.hero.phoneHref}>
                                <Phone className="h-4 w-4" />
                                {eventsContent.hero.phoneLabel}
                            </a>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Tipos de Eventos */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs text-[#d4a574] uppercase tracking-[0.3em] mb-3">{eventsContent.eventTypesSection.eyebrow}</p>
                        <h2 className="font-serif text-3xl md:text-4xl font-light text-[#2a2a2a]">
                            {eventsContent.eventTypesSection.title}
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {eventsContent.eventTypes.map((type, idx) => {
                            const TypeIcon = contentIconMap[type.icon as keyof typeof contentIconMap] ?? Heart

                            return (
                                <div key={`${type.name}-${idx}`} className="bg-white rounded-2xl p-6 shadow-sm border border-[#e0d5c7] hover:shadow-lg transition-shadow group">
                                    <div className="w-12 h-12 rounded-full bg-[#f1c595]/30 flex items-center justify-center mb-4 group-hover:bg-[#d4a574]/30 transition-colors">
                                        <TypeIcon className="h-6 w-6 text-[#d4a574]" />
                                    </div>
                                    <h3 className="font-semibold text-[#2a2a2a] mb-2">{type.name}</h3>
                                    <p className="text-sm text-[#8a5c3f]">{type.description}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Venue Showcase - Full Width Image */}
            <section className="relative h-[60vh] min-h-[400px] overflow-hidden" >
                <Image
                    src={eventsContent.venue.imageUrl || '/evento_01.avif'}
                    alt="Espaço Aysú Beach Lounge Noturno - Cenário Único"
                    fill
                    className="object-cover"
                    quality={75}
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2a2a2a] via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-center">
                    <p className="text-[#d4a574] text-sm uppercase tracking-[0.3em] mb-2">{eventsContent.venue.eyebrow}</p>
                    <h3
                        className="font-serif text-2xl md:text-4xl font-light mb-4"
                        style={{ color: '#FFFFFF' }}
                    >
                        {eventsContent.venue.title}
                    </h3>
                    <p className="text-white/70 max-w-2xl mx-auto">
                        {eventsContent.venue.description}
                    </p>
                </div>
            </section>

            {/* Valores Espaço Fechado */}
            <section className="py-20 px-6 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] text-white" >
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs text-[#d4a574] uppercase tracking-[0.3em] mb-3">{eventsContent.pricing.eyebrow}</p>
                        <h2
                            className="font-serif text-3xl md:text-4xl font-light"
                            style={{ color: '#FFFFFF' }}
                        >
                            {eventsContent.pricing.title}
                        </h2>
                        <p className="text-white/60 mt-4 max-w-2xl mx-auto">
                            {eventsContent.pricing.description}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {eventsContent.pricing.plans.map((plan, idx) => (
                            <div
                                key={`${plan.name}-${idx}`}
                                className={`rounded-2xl p-8 ${plan.highlight
                                    ? 'bg-gradient-to-b from-[#d4a574] to-[#bc8e5e] text-white'
                                    : 'bg-white/5 border border-white/10'
                                    }`}
                            >
                                <div className={`text-sm uppercase tracking-widest mb-4 ${plan.highlight ? 'text-white/80' : 'text-[#d4a574]'}`}>
                                    {plan.name}
                                </div>
                                <div className={`text-4xl font-bold mb-6 ${plan.highlight ? 'text-white' : 'text-white'}`}>
                                    {formatCurrency(plan.price)}
                                </div>
                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm">
                                            <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-white' : 'text-[#d4a574]'}`} />
                                            <span className={plan.highlight ? 'text-white/90' : 'text-white/70'}>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bar & Coquetelaria */}
            <section className="py-20 px-6" >
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <Wine className="h-6 w-6 text-[#d4a574]" />
                                <p className="text-xs text-[#d4a574] uppercase tracking-[0.3em]">{eventsContent.bar.eyebrow}</p>
                            </div>
                            <h2 className="font-serif text-3xl md:text-4xl font-light text-[#2a2a2a] mb-4">
                                {eventsContent.bar.title}
                            </h2>
                            <p className="text-[#8a5c3f] mb-6 leading-relaxed">
                                {eventsContent.bar.description}
                            </p>

                            <div className="bg-[#f5f0e8] rounded-xl p-6 mb-6">
                                <h4 className="font-medium text-[#2a2a2a] mb-3">{eventsContent.bar.includesTitle}</h4>
                                <ul className="space-y-2">
                                    {eventsContent.bar.includes.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-[#4a4a4a]">
                                            <Check className="h-4 w-4 text-[#d4a574] flex-shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex justify-center">
                                <div className="text-center p-6 bg-white rounded-xl border border-[#e0d5c7] shadow-sm max-w-xs w-full">
                                    <div className="flex items-center justify-center gap-1 text-[#8a5c3f] mb-1">
                                        <Users className="h-4 w-4" />
                                        <span className="text-sm">{eventsContent.bar.priceLabel}</span>
                                    </div>
                                    <div className="text-xl font-medium text-[#8a5c3f] mb-1">{eventsContent.bar.pricePrefix}</div>
                                    <div className="text-3xl font-bold text-[#2a2a2a]">
                                        {formatCurrency(eventsContent.bar.price)}
                                    </div>
                                    <div className="text-xs text-[#8a5c3f] mt-3">
                                        {eventsContent.bar.unitNote}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                            <Image
                                src={eventsContent.bar.imageUrl || '/eventos/bar-cocktails.png'}
                                alt="Coquetel Tropical Aysú"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Buffet Finger Food */}
            <section className="py-20 px-6 bg-[#f5f0e8]" >
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="order-2 lg:order-1 relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                            <Image
                                src={eventsContent.buffet.imageUrl || '/eventos/buffet-gourmet.png'}
                                alt="Buffet Finger Food Aysú"
                                fill
                                className="object-cover"
                            />
                        </div>

                        <div className="order-1 lg:order-2">
                            <div className="flex items-center gap-3 mb-4">
                                <UtensilsCrossed className="h-6 w-6 text-[#d4a574]" />
                                <p className="text-xs text-[#d4a574] uppercase tracking-[0.3em]">{eventsContent.buffet.eyebrow}</p>
                            </div>
                            <h2 className="font-serif text-3xl md:text-4xl font-light text-[#2a2a2a] mb-4">
                                {eventsContent.buffet.title}
                            </h2>
                            <p className="text-[#8a5c3f] mb-6 leading-relaxed">
                                {eventsContent.buffet.description}
                            </p>

                            <div className="bg-white rounded-xl p-6 mb-6">
                                <h4 className="font-medium text-[#2a2a2a] mb-3">{eventsContent.buffet.optionsTitle}</h4>
                                <ul className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                                    {eventsContent.buffet.options.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-[#4a4a4a]">
                                            <span className="text-[#d4a574]">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs text-[#8a5c3f] italic mt-4">
                                    {eventsContent.buffet.note}
                                </p>
                            </div>

                            <div className="flex justify-center">
                                <div className="text-center p-6 bg-white rounded-xl border border-[#e0d5c7] shadow-sm max-w-xs w-full">
                                    <div className="flex items-center justify-center gap-1 text-[#8a5c3f] mb-1">
                                        <Users className="h-4 w-4" />
                                        <span className="text-sm">{eventsContent.buffet.priceLabel}</span>
                                    </div>
                                    <div className="text-xl font-medium text-[#8a5c3f] mb-1">{eventsContent.buffet.pricePrefix}</div>
                                    <div className="text-3xl font-bold text-[#2a2a2a]">
                                        {formatCurrency(eventsContent.buffet.price)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Serviços Parceiros */}
            <section className="py-20 px-6" >
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs text-[#d4a574] uppercase tracking-[0.3em] mb-3">{eventsContent.partners.eyebrow}</p>
                        <h2 className="font-serif text-3xl md:text-4xl font-light text-[#2a2a2a]">
                            {eventsContent.partners.title}
                        </h2>
                        <p className="text-[#8a5c3f] mt-4 max-w-2xl mx-auto">
                            {eventsContent.partners.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {eventsContent.partners.services.map((service, idx) => {
                            const ServiceIcon = contentIconMap[service.icon as keyof typeof contentIconMap] ?? Star

                            return (
                                <div key={`${service.name}-${idx}`} className="bg-white rounded-xl p-5 shadow-sm border border-[#e0d5c7] text-center hover:shadow-md transition-shadow">
                                    <ServiceIcon className="h-6 w-6 text-[#d4a574] mx-auto mb-3" />
                                    <p className="text-sm font-medium text-[#2a2a2a]">{service.name}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Formulário de Orçamento */}
            <section id="orcamento" className="py-20 px-6 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a]" >
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <p className="text-xs text-[#d4a574] uppercase tracking-[0.3em] mb-3">{eventsContent.quoteForm.eyebrow}</p>
                        <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
                            {eventsContent.quoteForm.title}
                        </h2>
                        <p className="text-white/60">
                            {eventsContent.quoteForm.description}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-2xl">
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <Input
                                label="Nome completo"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Seu nome"
                                required
                            />
                            <Input
                                label="Email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="seu@email.com"
                                required
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <Input
                                label="Telefone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="(12) 99999-9999"
                                required
                            />
                            <div>
                                <label className="block text-sm font-medium text-[#2a2a2a] mb-1.5">Tipo de evento</label>
                                <select
                                    name="eventType"
                                    value={formData.eventType}
                                    onChange={handleInputChange}
                                    className="w-full h-11 px-4 rounded-lg border border-[#e0d5c7] text-sm text-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-[#d4a574]"
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    <option value="casamento">Casamento</option>
                                    <option value="15anos">Festa de 15 Anos</option>
                                    <option value="corporativo">Evento Corporativo</option>
                                    <option value="miniwedding">Miniwedding</option>
                                    <option value="aniversario">Aniversário</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <Input
                                label="Data prevista"
                                type="date"
                                name="eventDate"
                                value={formData.eventDate}
                                onChange={handleInputChange}
                            />
                            <Input
                                label="Número de convidados"
                                type="number"
                                name="guestCount"
                                value={formData.guestCount}
                                onChange={handleInputChange}
                                placeholder="Ex: 80"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-[#2a2a2a] mb-1.5">Mensagem (opcional)</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full px-4 py-3 rounded-lg border border-[#e0d5c7] text-sm text-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-[#d4a574] resize-none"
                                placeholder="Conte-nos mais sobre o seu evento..."
                            />
                        </div>

                        <Button type="submit" className="w-full" size="lg" isLoading={submitting}>
                            Enviar Solicitação
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </form>

                    {/* Contato direto */}
                    <div className="mt-12 text-center">
                        <p className="text-white/60 mb-4">{eventsContent.quoteForm.directContactLabel}</p>
                        <div className="flex flex-wrap justify-center gap-6">
                            <a
                                href={eventsContent.quoteForm.phoneHref}
                                className="flex items-center gap-2 text-[#d4a574] hover:text-[#f1c595] transition-colors"
                            >
                                <Phone className="h-5 w-5" />
                                {eventsContent.quoteForm.phoneLabel}
                            </a>
                            <a
                                href={eventsContent.quoteForm.emailHref}
                                className="flex items-center gap-2 text-[#d4a574] hover:text-[#f1c595] transition-colors"
                            >
                                <Mail className="h-5 w-5" />
                                {eventsContent.quoteForm.emailLabel}
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div >
    )
}
