'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
    CalendarDays,
    Plus,
    RotateCcw,
    Save,
    Settings,
    Sparkles,
    Trash2,
    UtensilsCrossed,
    Wine,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
    DEFAULT_SITE_CONTENT,
    parseSiteContentConfig,
    type EventPricingPlan,
    type SiteContentConfig,
    type SiteContentFeature,
} from '@/lib/site-content'

type EventsContent = SiteContentConfig['events']

function listToText(items: string[]) {
    return items.join('\n')
}

function textToList(value: string) {
    return value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean)
}

function featuresToText(items: SiteContentFeature[]) {
    return items
        .map((item) => item.description ? `${item.name} | ${item.description}` : item.name)
        .join('\n')
}

function textToFeatures(value: string, previous: SiteContentFeature[]) {
    return textToList(value).map((line, index) => {
        const [name, ...descriptionParts] = line.split('|')
        const previousItem = previous[index]
        const description = descriptionParts.join('|').trim()

        return {
            name: name.trim(),
            description,
            icon: previousItem?.icon ?? 'star',
        }
    })
}

function serviceListToText(items: SiteContentFeature[]) {
    return items.map((item) => item.name).join('\n')
}

function textToServices(value: string, previous: SiteContentFeature[]) {
    return textToList(value).map((name, index) => ({
        name,
        icon: previous[index]?.icon ?? 'star',
    }))
}

const emptyPlan: EventPricingPlan = {
    name: 'Novo pacote',
    price: 0,
    features: ['Descrição do pacote'],
    highlight: false,
}

export default function AdminConfiguracoesPage() {
    const [content, setContent] = useState<SiteContentConfig>(DEFAULT_SITE_CONTENT)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const eventsContent = content.events

    useEffect(() => {
        let cancelled = false

        fetch('/api/admin/site-content', {
            credentials: 'include',
            cache: 'no-store',
        })
            .then(async (res) => {
                const data = await res.json()
                if (!res.ok || !data?.success) {
                    throw new Error(data?.error || 'Erro ao carregar conteúdo')
                }

                if (!cancelled) {
                    setContent(parseSiteContentConfig(data.data?.content))
                }
            })
            .catch((error) => {
                toast.error(error instanceof Error ? error.message : 'Erro ao carregar conteúdo')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [])

    const patchEventSection = <K extends keyof EventsContent>(section: K, patch: Partial<EventsContent[K]> | EventsContent[K]) => {
        setContent((prev) => ({
            ...prev,
            events: {
                ...prev.events,
                [section]: Array.isArray(patch)
                    ? patch
                    : {
                        ...(prev.events[section] as Record<string, unknown>),
                        ...(patch as Record<string, unknown>),
                    },
            } as EventsContent,
        }))
    }

    const updatePricingPlan = (index: number, patch: Partial<EventPricingPlan>) => {
        setContent((prev) => ({
            ...prev,
            events: {
                ...prev.events,
                pricing: {
                    ...prev.events.pricing,
                    plans: prev.events.pricing.plans.map((plan, planIndex) => (
                        planIndex === index ? { ...plan, ...patch } : plan
                    )),
                },
            },
        }))
    }

    const addPricingPlan = () => {
        setContent((prev) => ({
            ...prev,
            events: {
                ...prev.events,
                pricing: {
                    ...prev.events.pricing,
                    plans: [...prev.events.pricing.plans, emptyPlan],
                },
            },
        }))
    }

    const removePricingPlan = (index: number) => {
        setContent((prev) => ({
            ...prev,
            events: {
                ...prev.events,
                pricing: {
                    ...prev.events.pricing,
                    plans: prev.events.pricing.plans.filter((_, planIndex) => planIndex !== index),
                },
            },
        }))
    }

    const handleSave = async () => {
        setSaving(true)

        try {
            const res = await fetch('/api/admin/site-content', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content }),
            })
            const data = await res.json()

            if (!res.ok || !data?.success) {
                throw new Error(data?.error || 'Erro ao salvar conteúdo')
            }

            setContent(parseSiteContentConfig(data.data?.content))
            toast.success(data.message || 'Conteúdo salvo com sucesso')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar conteúdo')
        } finally {
            setSaving(false)
        }
    }

    const handleReset = () => {
        setContent(DEFAULT_SITE_CONTENT)
        toast.success('Conteúdo padrão carregado. Salve para publicar.')
    }

    return (
        <AdminLayout>
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Configurações</h1>
                    <p className="text-[#8a5c3f]">Conteúdo público da home e da página Faça seu Evento</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <Button type="button" variant="outline" onClick={handleReset} disabled={saving || loading}>
                        <RotateCcw className="h-4 w-4" />
                        Restaurar padrão
                    </Button>
                    <Button type="button" onClick={handleSave} isLoading={saving} disabled={loading}>
                        <Save className="h-4 w-4" />
                        Salvar Alterações
                    </Button>
                </div>
            </div>

            {loading ? (
                <Card>
                    <CardContent className="p-8 text-center text-[#8a5c3f]">
                        Carregando configurações...
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-[#d4a574]" />
                                    Home
                                </CardTitle>
                                <CardDescription>Bloco de eventos privados exibido na página inicial</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    label="Etiqueta"
                                    value={eventsContent.homeEventSection.eyebrow}
                                    onChange={(e) => patchEventSection('homeEventSection', { eyebrow: e.target.value })}
                                />
                                <Input
                                    label="Título"
                                    value={eventsContent.homeEventSection.title}
                                    onChange={(e) => patchEventSection('homeEventSection', { title: e.target.value })}
                                />
                                <Textarea
                                    label="Descrição"
                                    rows={4}
                                    value={eventsContent.homeEventSection.description}
                                    onChange={(e) => patchEventSection('homeEventSection', { description: e.target.value })}
                                />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input
                                        label="Botão principal"
                                        value={eventsContent.homeEventSection.ctaLabel}
                                        onChange={(e) => patchEventSection('homeEventSection', { ctaLabel: e.target.value })}
                                    />
                                    <Input
                                        label="Botão orçamento"
                                        value={eventsContent.homeEventSection.secondaryCtaLabel}
                                        onChange={(e) => patchEventSection('homeEventSection', { secondaryCtaLabel: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-[#d4a574]" />
                                    Faça seu Evento
                                </CardTitle>
                                <CardDescription>Hero, vitrine do espaço e chamadas principais</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    label="Etiqueta do hero"
                                    value={eventsContent.hero.eyebrow}
                                    onChange={(e) => patchEventSection('hero', { eyebrow: e.target.value })}
                                />
                                <Input
                                    label="Título do hero"
                                    value={eventsContent.hero.title}
                                    onChange={(e) => patchEventSection('hero', { title: e.target.value })}
                                />
                                <Textarea
                                    label="Subtítulo do hero"
                                    rows={4}
                                    value={eventsContent.hero.subtitle}
                                    onChange={(e) => patchEventSection('hero', { subtitle: e.target.value })}
                                />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input
                                        label="Botão do hero"
                                        value={eventsContent.hero.primaryCtaLabel}
                                        onChange={(e) => patchEventSection('hero', { primaryCtaLabel: e.target.value })}
                                    />
                                    <Input
                                        label="Telefone do hero"
                                        value={eventsContent.hero.phoneLabel}
                                        onChange={(e) => patchEventSection('hero', { phoneLabel: e.target.value })}
                                    />
                                    <Input
                                        label="Link do telefone"
                                        value={eventsContent.hero.phoneHref}
                                        onChange={(e) => patchEventSection('hero', { phoneHref: e.target.value })}
                                    />
                                    <Input
                                        label="Etiqueta da imagem do espaço"
                                        value={eventsContent.venue.eyebrow}
                                        onChange={(e) => patchEventSection('venue', { eyebrow: e.target.value })}
                                    />
                                </div>
                                <Input
                                    label="Título da imagem do espaço"
                                    value={eventsContent.venue.title}
                                    onChange={(e) => patchEventSection('venue', { title: e.target.value })}
                                />
                                <Textarea
                                    label="Texto da imagem do espaço"
                                    rows={3}
                                    value={eventsContent.venue.description}
                                    onChange={(e) => patchEventSection('venue', { description: e.target.value })}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <CalendarDays className="h-5 w-5 text-[#d4a574]" />
                                        Tabela de preços de eventos
                                    </CardTitle>
                                    <CardDescription>Valores usados na home e na página Faça seu Evento</CardDescription>
                                </div>
                                <Button type="button" variant="outline" onClick={addPricingPlan}>
                                    <Plus className="h-4 w-4" />
                                    Novo pacote
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 lg:grid-cols-3">
                                <Input
                                    label="Etiqueta"
                                    value={eventsContent.pricing.eyebrow}
                                    onChange={(e) => patchEventSection('pricing', { eyebrow: e.target.value })}
                                />
                                <Input
                                    label="Título"
                                    value={eventsContent.pricing.title}
                                    onChange={(e) => patchEventSection('pricing', { title: e.target.value })}
                                />
                                <Input
                                    label="Descrição resumida"
                                    value={eventsContent.pricing.description}
                                    onChange={(e) => patchEventSection('pricing', { description: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-5 lg:grid-cols-3">
                                {eventsContent.pricing.plans.map((plan, index) => (
                                    <div key={`${plan.name}-${index}`} className="rounded-xl border border-[#e0d5c7] bg-[#fdfbf8] p-5">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <p className="text-sm font-semibold text-[#2a2a2a]">Pacote {index + 1}</p>
                                            <button
                                                type="button"
                                                onClick={() => removePricingPlan(index)}
                                                disabled={eventsContent.pricing.plans.length <= 1}
                                                className="rounded-lg p-2 text-[#8a5c3f] transition-colors hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-40"
                                                aria-label="Remover pacote"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            <Input
                                                label="Nome"
                                                value={plan.name}
                                                onChange={(e) => updatePricingPlan(index, { name: e.target.value })}
                                            />
                                            <Input
                                                label="Valor"
                                                type="number"
                                                min={0}
                                                step={100}
                                                value={plan.price}
                                                onChange={(e) => updatePricingPlan(index, { price: Number(e.target.value || 0) })}
                                            />
                                            <Textarea
                                                label="Itens inclusos"
                                                rows={6}
                                                value={listToText(plan.features)}
                                                onChange={(e) => updatePricingPlan(index, { features: textToList(e.target.value) })}
                                            />
                                            <label className="flex items-center gap-3 rounded-lg border border-[#e0d5c7] bg-white px-4 py-3 text-sm text-[#2a2a2a]">
                                                <input
                                                    type="checkbox"
                                                    checked={plan.highlight}
                                                    onChange={(e) => updatePricingPlan(index, { highlight: e.target.checked })}
                                                    className="h-4 w-4 accent-[#d4a574]"
                                                />
                                                Destacar pacote
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Wine className="h-5 w-5 text-[#d4a574]" />
                                    Bar e Coquetelaria
                                </CardTitle>
                                <CardDescription>Texto, lista inclusa e valor por pessoa/unitário</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    label="Etiqueta"
                                    value={eventsContent.bar.eyebrow}
                                    onChange={(e) => patchEventSection('bar', { eyebrow: e.target.value })}
                                />
                                <Input
                                    label="Título"
                                    value={eventsContent.bar.title}
                                    onChange={(e) => patchEventSection('bar', { title: e.target.value })}
                                />
                                <Textarea
                                    label="Descrição"
                                    rows={4}
                                    value={eventsContent.bar.description}
                                    onChange={(e) => patchEventSection('bar', { description: e.target.value })}
                                />
                                <Input
                                    label="Título da lista"
                                    value={eventsContent.bar.includesTitle}
                                    onChange={(e) => patchEventSection('bar', { includesTitle: e.target.value })}
                                />
                                <Textarea
                                    label="Lista de inclusos"
                                    rows={7}
                                    value={listToText(eventsContent.bar.includes)}
                                    onChange={(e) => patchEventSection('bar', { includes: textToList(e.target.value) })}
                                />
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Input
                                        label="Legenda"
                                        value={eventsContent.bar.priceLabel}
                                        onChange={(e) => patchEventSection('bar', { priceLabel: e.target.value })}
                                    />
                                    <Input
                                        label="Prefixo"
                                        value={eventsContent.bar.pricePrefix}
                                        onChange={(e) => patchEventSection('bar', { pricePrefix: e.target.value })}
                                    />
                                    <Input
                                        label="Valor"
                                        type="number"
                                        min={0}
                                        step={5}
                                        value={eventsContent.bar.price}
                                        onChange={(e) => patchEventSection('bar', { price: Number(e.target.value || 0) })}
                                    />
                                </div>
                                <Input
                                    label="Observação"
                                    value={eventsContent.bar.unitNote}
                                    onChange={(e) => patchEventSection('bar', { unitNote: e.target.value })}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <UtensilsCrossed className="h-5 w-5 text-[#d4a574]" />
                                    Buffet
                                </CardTitle>
                                <CardDescription>Texto, sugestões e preço do finger food</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input
                                    label="Etiqueta"
                                    value={eventsContent.buffet.eyebrow}
                                    onChange={(e) => patchEventSection('buffet', { eyebrow: e.target.value })}
                                />
                                <Input
                                    label="Título"
                                    value={eventsContent.buffet.title}
                                    onChange={(e) => patchEventSection('buffet', { title: e.target.value })}
                                />
                                <Textarea
                                    label="Descrição"
                                    rows={4}
                                    value={eventsContent.buffet.description}
                                    onChange={(e) => patchEventSection('buffet', { description: e.target.value })}
                                />
                                <Input
                                    label="Título das opções"
                                    value={eventsContent.buffet.optionsTitle}
                                    onChange={(e) => patchEventSection('buffet', { optionsTitle: e.target.value })}
                                />
                                <Textarea
                                    label="Opções"
                                    rows={7}
                                    value={listToText(eventsContent.buffet.options)}
                                    onChange={(e) => patchEventSection('buffet', { options: textToList(e.target.value) })}
                                />
                                <Textarea
                                    label="Observação"
                                    rows={3}
                                    value={eventsContent.buffet.note}
                                    onChange={(e) => patchEventSection('buffet', { note: e.target.value })}
                                />
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Input
                                        label="Legenda"
                                        value={eventsContent.buffet.priceLabel}
                                        onChange={(e) => patchEventSection('buffet', { priceLabel: e.target.value })}
                                    />
                                    <Input
                                        label="Prefixo"
                                        value={eventsContent.buffet.pricePrefix}
                                        onChange={(e) => patchEventSection('buffet', { pricePrefix: e.target.value })}
                                    />
                                    <Input
                                        label="Valor"
                                        type="number"
                                        min={0}
                                        step={10}
                                        value={eventsContent.buffet.price}
                                        onChange={(e) => patchEventSection('buffet', { price: Number(e.target.value || 0) })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Tipos de eventos</CardTitle>
                                <CardDescription>Use uma linha por tipo no formato Nome | Descrição</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input
                                        label="Etiqueta"
                                        value={eventsContent.eventTypesSection.eyebrow}
                                        onChange={(e) => patchEventSection('eventTypesSection', { eyebrow: e.target.value })}
                                    />
                                    <Input
                                        label="Título"
                                        value={eventsContent.eventTypesSection.title}
                                        onChange={(e) => patchEventSection('eventTypesSection', { title: e.target.value })}
                                    />
                                </div>
                                <Textarea
                                    label="Tipos"
                                    rows={8}
                                    value={featuresToText(eventsContent.eventTypes)}
                                    onChange={(e) => patchEventSection('eventTypes', textToFeatures(e.target.value, eventsContent.eventTypes) as EventsContent['eventTypes'])}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Parceiros e contato</CardTitle>
                                <CardDescription>Serviços parceiros e canais de atendimento do evento</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input
                                        label="Etiqueta de parceiros"
                                        value={eventsContent.partners.eyebrow}
                                        onChange={(e) => patchEventSection('partners', { eyebrow: e.target.value })}
                                    />
                                    <Input
                                        label="Título de parceiros"
                                        value={eventsContent.partners.title}
                                        onChange={(e) => patchEventSection('partners', { title: e.target.value })}
                                    />
                                </div>
                                <Textarea
                                    label="Descrição de parceiros"
                                    rows={3}
                                    value={eventsContent.partners.description}
                                    onChange={(e) => patchEventSection('partners', { description: e.target.value })}
                                />
                                <Textarea
                                    label="Serviços parceiros"
                                    rows={6}
                                    value={serviceListToText(eventsContent.partners.services)}
                                    onChange={(e) => patchEventSection('partners', { services: textToServices(e.target.value, eventsContent.partners.services) })}
                                />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input
                                        label="Etiqueta do formulário"
                                        value={eventsContent.quoteForm.eyebrow}
                                        onChange={(e) => patchEventSection('quoteForm', { eyebrow: e.target.value })}
                                    />
                                    <Input
                                        label="Título do formulário"
                                        value={eventsContent.quoteForm.title}
                                        onChange={(e) => patchEventSection('quoteForm', { title: e.target.value })}
                                    />
                                </div>
                                <Textarea
                                    label="Descrição do formulário"
                                    rows={3}
                                    value={eventsContent.quoteForm.description}
                                    onChange={(e) => patchEventSection('quoteForm', { description: e.target.value })}
                                />
                                <Input
                                    label="Texto do contato direto"
                                    value={eventsContent.quoteForm.directContactLabel}
                                    onChange={(e) => patchEventSection('quoteForm', { directContactLabel: e.target.value })}
                                />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input
                                        label="Telefone"
                                        value={eventsContent.quoteForm.phoneLabel}
                                        onChange={(e) => patchEventSection('quoteForm', { phoneLabel: e.target.value })}
                                    />
                                    <Input
                                        label="Link do telefone"
                                        value={eventsContent.quoteForm.phoneHref}
                                        onChange={(e) => patchEventSection('quoteForm', { phoneHref: e.target.value })}
                                    />
                                    <Input
                                        label="E-mail"
                                        value={eventsContent.quoteForm.emailLabel}
                                        onChange={(e) => patchEventSection('quoteForm', { emailLabel: e.target.value })}
                                    />
                                    <Input
                                        label="Link do e-mail"
                                        value={eventsContent.quoteForm.emailHref}
                                        onChange={(e) => patchEventSection('quoteForm', { emailHref: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
