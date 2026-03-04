'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, Pencil, Plus, Trash2, Ticket, CalendarClock, Upload, X } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Spinner } from '@/components/ui/Spinner'
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import type { DayConfigPayload, ReservationGlobalConfigPayload } from '@/lib/day-config'
import { DEFAULT_RESERVABLE_ITEMS } from '@/lib/day-config'
import { optimizeImageBeforeUpload, readUploadApiResponse, validateImageUpload } from '@/lib/upload-client'

const STATUS_OPTIONS = [
    { value: 'NORMAL', label: 'Operação Normal', badge: 'secondary' as const },
    { value: 'EVENT', label: 'Programação Especial (Ingressos)', badge: 'info' as const },
    { value: 'PRIVATE_EVENT', label: 'Locação Privada (Fechado)', badge: 'warning' as const },
    { value: 'BLOCKED', label: 'Bloqueado/Manutenção', badge: 'error' as const },
]

const SPACE_OVERRIDE_FIELDS = [
    { id: 'bangalo-lateral', label: 'Bangalô Lateral' },
    { id: 'bangalo-piscina', label: 'Bangalô Piscina' },
    { id: 'bangalo-frente-mar', label: 'Bangalô Frente Mar' },
    { id: 'bangalo-central', label: 'Bangalô Central' },
    { id: 'sunbed-casal', label: 'Sunbed Casal' },
    { id: 'mesa-restaurante', label: 'Mesa Restaurante' },
    { id: 'mesa-praia', label: 'Mesa Praia' },
    { id: 'day-use-praia', label: 'Day Use Praia' },
]

const DEFAULT_TICKET_LOTS = [
    { enabled: false, name: '1º Lote', endsAt: '', price: '', consumable: '', soldOut: false },
    { enabled: false, name: '2º Lote', endsAt: '', price: '', consumable: '', soldOut: false },
    { enabled: false, name: '3º Lote', endsAt: '', price: '', consumable: '', soldOut: false },
]

type SpaceOverrideForm = Record<string, {
    enabled: boolean
    price: string
    consumable: string
}>

interface TicketLotForm {
    enabled: boolean
    name: string
    endsAt: string
    price: string
    consumable: string
    soldOut: boolean
}

interface DayConfigForm {
    date: string
    status: 'NORMAL' | 'EVENT' | 'PRIVATE_EVENT' | 'BLOCKED'
    reservationsEnabled: boolean
    title: string
    release: string
    flyerImageUrl: string
    highlightOnHome: boolean
    reservableItems: {
        bangalos: boolean
        sunbeds: boolean
        restaurantTables: boolean
        beachTables: boolean
        dayUse: boolean
    }
    priceOverrides: SpaceOverrideForm
    ticketLots: TicketLotForm[]
}

interface GlobalConfigForm {
    reservableItems: DayConfigForm['reservableItems']
    priceOverrides: SpaceOverrideForm
}

const createEmptyPriceOverrides = (): SpaceOverrideForm => {
    return SPACE_OVERRIDE_FIELDS.reduce((acc, field) => {
        acc[field.id] = {
            enabled: false,
            price: '',
            consumable: '',
        }
        return acc
    }, {} as SpaceOverrideForm)
}

const createDefaultForm = (): DayConfigForm => ({
    date: '',
    status: 'NORMAL',
    reservationsEnabled: true,
    title: '',
    release: '',
    flyerImageUrl: '',
    highlightOnHome: false,
    reservableItems: { ...DEFAULT_RESERVABLE_ITEMS },
    priceOverrides: createEmptyPriceOverrides(),
    ticketLots: DEFAULT_TICKET_LOTS.map(lot => ({ ...lot })),
})

const createDefaultGlobalForm = (): GlobalConfigForm => ({
    reservableItems: { ...DEFAULT_RESERVABLE_ITEMS },
    priceOverrides: createEmptyPriceOverrides(),
})

function applyPriceOverridesToForm(
    base: SpaceOverrideForm,
    overrides: Record<string, { price: number; consumable?: number }>,
) {
    for (const [spaceId, override] of Object.entries(overrides || {})) {
        if (!base[spaceId]) continue
        base[spaceId] = {
            enabled: true,
            price: formatCurrencyInput(override.price.toString()),
            consumable: override.consumable !== undefined ? formatCurrencyInput(override.consumable.toString()) : '',
        }
    }
}

function formatDateBR(date: string) {
    return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

function sanitizeCurrencyTyping(value: string) {
    return value.replace(/[^\d.,]/g, '')
}

function parseCurrencyInput(value: string): number | null {
    const cleaned = value.trim().replace(/[^\d.,-]/g, '')
    if (!cleaned) return null

    const lastComma = cleaned.lastIndexOf(',')
    const lastDot = cleaned.lastIndexOf('.')
    const separatorIndex = Math.max(lastComma, lastDot)

    let normalized: string
    if (separatorIndex >= 0) {
        const integerPart = cleaned.slice(0, separatorIndex).replace(/[.,]/g, '')
        const decimalPart = cleaned.slice(separatorIndex + 1).replace(/[.,]/g, '')
        normalized = `${integerPart || '0'}.${decimalPart}`
    } else {
        normalized = cleaned.replace(/[.,]/g, '')
    }

    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
}

function formatCurrencyInput(value: string): string {
    const parsed = parseCurrencyInput(value)
    if (parsed === null) return ''

    return parsed.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

function AdminCalendarioPageContent() {
    const searchParams = useSearchParams()
    const [configs, setConfigs] = useState<DayConfigPayload[]>([])
    const [globalConfig, setGlobalConfig] = useState<ReservationGlobalConfigPayload | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingGlobal, setLoadingGlobal] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [savingGlobal, setSavingGlobal] = useState(false)
    const [uploadingFlyer, setUploadingFlyer] = useState(false)
    const [editingConfig, setEditingConfig] = useState<DayConfigPayload | null>(null)
    const [form, setForm] = useState<DayConfigForm>(createDefaultForm)
    const [globalForm, setGlobalForm] = useState<GlobalConfigForm>(createDefaultGlobalForm)
    const [prefillDone, setPrefillDone] = useState(false)
    const flyerInputRef = useRef<HTMLInputElement>(null)

    const statusSummary = useMemo(() => {
        return {
            total: configs.length,
            blocked: configs.filter(c => c.status === 'BLOCKED' || !c.reservationsEnabled).length,
            events: configs.filter(c => c.status === 'EVENT' || c.status === 'PRIVATE_EVENT').length,
        }
    }, [configs])

    const fetchConfigs = async () => {
        try {
            const res = await fetch('/api/admin/day-configs', {
                credentials: 'include',
            })
            const data = await res.json()
            if (data.success) {
                setConfigs(data.data)
            } else {
                toast.error(data.error || 'Erro ao carregar configurações')
            }
        } catch {
            toast.error('Erro ao carregar configurações do calendário')
        } finally {
            setLoading(false)
        }
    }

    const fetchGlobalConfig = async () => {
        try {
            const res = await fetch('/api/admin/day-configs/default', {
                credentials: 'include',
            })
            const data = await res.json()

            if (!data.success) {
                throw new Error(data.error || 'Erro ao carregar configuração padrão')
            }

            const config = data.data as ReservationGlobalConfigPayload
            setGlobalConfig(config)

            const nextForm = createDefaultGlobalForm()
            nextForm.reservableItems = config.reservableItems
            applyPriceOverridesToForm(nextForm.priceOverrides, config.priceOverrides || {})
            setGlobalForm(nextForm)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Erro ao carregar configuração padrão')
        } finally {
            setLoadingGlobal(false)
        }
    }

    useEffect(() => {
        fetchConfigs()
        fetchGlobalConfig()
    }, [])

    useEffect(() => {
        if (prefillDone) return

        const date = searchParams.get('date')
        const title = searchParams.get('title')
        const release = searchParams.get('release')
        const flyer = searchParams.get('flyer')

        if (!date && !title && !release && !flyer) {
            setPrefillDone(true)
            return
        }

        setForm(prev => ({
            ...prev,
            date: date || prev.date,
            title: title || prev.title,
            release: release || prev.release,
            flyerImageUrl: flyer || prev.flyerImageUrl,
            status: 'EVENT',
            highlightOnHome: true,
        }))
        setIsModalOpen(true)
        setPrefillDone(true)
    }, [prefillDone, searchParams])

    const openCreateModal = () => {
        setEditingConfig(null)
        setForm(createDefaultForm())
        setIsModalOpen(true)
    }

    const openEditModal = (config: DayConfigPayload) => {
        const nextForm = createDefaultForm()

        nextForm.date = config.date
        nextForm.status = config.status
        nextForm.reservationsEnabled = config.reservationsEnabled
        nextForm.title = config.title || ''
        nextForm.release = config.release || ''
        nextForm.flyerImageUrl = config.flyerImageUrl || ''
        nextForm.highlightOnHome = config.highlightOnHome
        nextForm.reservableItems = config.reservableItems

        applyPriceOverridesToForm(nextForm.priceOverrides, config.priceOverrides || {})

        config.ticketLots.forEach((lot, index) => {
            if (!nextForm.ticketLots[index]) {
                nextForm.ticketLots.push({
                    enabled: true,
                    name: lot.name,
                    endsAt: lot.endsAt,
                    price: formatCurrencyInput(lot.price.toString()),
                    consumable: lot.consumable !== undefined ? formatCurrencyInput(lot.consumable.toString()) : '',
                    soldOut: !!lot.soldOut,
                })
                return
            }

            nextForm.ticketLots[index] = {
                enabled: true,
                name: lot.name,
                endsAt: lot.endsAt,
                price: formatCurrencyInput(lot.price.toString()),
                consumable: lot.consumable !== undefined ? formatCurrencyInput(lot.consumable.toString()) : '',
                soldOut: !!lot.soldOut,
            }
        })

        setEditingConfig(config)
        setForm(nextForm)
        setIsModalOpen(true)
    }

    const handleDelete = async (config: DayConfigPayload) => {
        if (!confirm(`Excluir configuração de ${formatDateBR(config.date)}?`)) return

        try {
            const res = await fetch(`/api/admin/day-configs/${config.id}`, {
                method: 'DELETE',
                credentials: 'include',
            })
            const data = await res.json()

            if (!data.success) {
                throw new Error(data.error || 'Erro ao excluir')
            }

            toast.success('Configuração removida')
            fetchConfigs()
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Erro ao excluir configuração')
        }
    }

    const handleFlyerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const validationError = validateImageUpload(file)
        if (validationError) {
            toast.error(validationError)
            e.target.value = ''
            return
        }

        setUploadingFlyer(true)

        try {
            const optimizedFile = await optimizeImageBeforeUpload(file)
            const formData = new FormData()
            formData.append('file', optimizedFile)
            formData.append('folder', 'events')

            const res = await fetch('/api/upload', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            })
            const data = await readUploadApiResponse(res)

            const uploadedUrl = data.data?.url
            if (!res.ok || !data.success || typeof uploadedUrl !== 'string' || !uploadedUrl) {
                throw new Error(data.error || 'Erro ao enviar flyer')
            }

            setForm(prev => ({ ...prev, flyerImageUrl: uploadedUrl }))
            toast.success('Flyer enviado com sucesso')
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload do flyer')
        } finally {
            setUploadingFlyer(false)
            e.target.value = ''
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.date) {
            toast.error('Selecione uma data')
            return
        }

        const enabledOverrides = Object.entries(form.priceOverrides).reduce<Record<string, { price: number; consumable?: number }>>((acc, [spaceId, value]) => {
            if (!value.enabled) return acc

            const parsedPrice = parseCurrencyInput(value.price)
            if (parsedPrice === null || !Number.isFinite(parsedPrice) || parsedPrice < 0) return acc

            const parsedConsumable = value.consumable.trim() === '' ? null : parseCurrencyInput(value.consumable)
            acc[spaceId] = {
                price: parsedPrice,
                ...(parsedConsumable !== null && Number.isFinite(parsedConsumable) && parsedConsumable >= 0
                    ? { consumable: parsedConsumable }
                    : {}),
            }
            return acc
        }, {})

        const ticketLots = form.ticketLots
            .filter(lot => lot.enabled && lot.name.trim() && lot.endsAt && lot.price.trim())
            .map(lot => ({
                name: lot.name.trim(),
                endsAt: lot.endsAt,
                price: parseCurrencyInput(lot.price) ?? Number.NaN,
                ...(lot.consumable.trim() ? { consumable: parseCurrencyInput(lot.consumable) ?? Number.NaN } : {}),
                ...(lot.soldOut ? { soldOut: true } : {}),
            }))
            .filter(lot => Number.isFinite(lot.price) && lot.price >= 0)

        const payload = {
            date: form.date,
            status: form.status,
            reservationsEnabled: form.reservationsEnabled,
            title: form.title,
            release: form.release,
            flyerImageUrl: form.flyerImageUrl,
            highlightOnHome: form.highlightOnHome,
            reservableItems: form.reservableItems,
            priceOverrides: enabledOverrides,
            ticketLots,
        }

        setSaving(true)

        try {
            const url = editingConfig ? `/api/admin/day-configs/${editingConfig.id}` : '/api/admin/day-configs'
            const method = editingConfig ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()

            if (!data.success) {
                throw new Error(data.error || 'Erro ao salvar')
            }

            toast.success(data.message || (editingConfig ? 'Configuração atualizada' : 'Configuração criada'))
            setIsModalOpen(false)
            fetchConfigs()
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar configuração')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveGlobalConfig = async () => {
        const enabledOverrides = Object.entries(globalForm.priceOverrides).reduce<Record<string, { price: number; consumable?: number }>>((acc, [spaceId, value]) => {
            if (!value.enabled) return acc

            const parsedPrice = parseCurrencyInput(value.price)
            if (parsedPrice === null || !Number.isFinite(parsedPrice) || parsedPrice < 0) return acc

            const parsedConsumable = value.consumable.trim() === '' ? null : parseCurrencyInput(value.consumable)
            acc[spaceId] = {
                price: parsedPrice,
                ...(parsedConsumable !== null && Number.isFinite(parsedConsumable) && parsedConsumable >= 0
                    ? { consumable: parsedConsumable }
                    : {}),
            }
            return acc
        }, {})

        setSavingGlobal(true)
        try {
            const res = await fetch('/api/admin/day-configs/default', {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reservableItems: globalForm.reservableItems,
                    priceOverrides: enabledOverrides,
                }),
            })
            const data = await res.json()

            if (!data.success) {
                throw new Error(data.error || 'Erro ao salvar configuração padrão')
            }

            const config = data.data as ReservationGlobalConfigPayload
            setGlobalConfig(config)

            const normalizedForm = createDefaultGlobalForm()
            normalizedForm.reservableItems = config.reservableItems
            applyPriceOverridesToForm(normalizedForm.priceOverrides, config.priceOverrides || {})
            setGlobalForm(normalizedForm)

            toast.success('Configuração padrão atualizada')
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar configuração padrão')
        } finally {
            setSavingGlobal(false)
        }
    }

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Calendário & Eventos</h1>
                    <p className="text-[#8a5c3f]">Defina regras comerciais por data: preços, lotes, bloqueios e liberação de mesas/sunbeds/bangalôs.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/admin/eventos">
                        <Button variant="secondary">
                            <CalendarClock className="h-4 w-4" />
                            Ir para Programação
                        </Button>
                    </Link>
                    <Button onClick={openCreateModal}>
                        <Plus className="h-4 w-4" />
                        Nova Configuração
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-[#8a5c3f]">Datas configuradas</p>
                        <p className="text-2xl font-bold text-[#2a2a2a]">{statusSummary.total}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-[#8a5c3f]">Eventos cadastrados</p>
                        <p className="text-2xl font-bold text-[#2a2a2a]">{statusSummary.events}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-[#8a5c3f]">Dias bloqueados</p>
                        <p className="text-2xl font-bold text-[#2a2a2a]">{statusSummary.blocked}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-8">
                <CardContent className="p-6 space-y-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-[#2a2a2a]">Configuração padrão (dia a dia)</h2>
                            <p className="text-sm text-[#8a5c3f]">
                                Vale para datas sem regra específica no calendário. Em datas configuradas, a regra da data tem prioridade.
                            </p>
                        </div>
                        <Button onClick={handleSaveGlobalConfig} isLoading={savingGlobal} disabled={loadingGlobal}>
                            Salvar padrão
                        </Button>
                    </div>

                    {loadingGlobal ? (
                        <div className="flex justify-center py-8">
                            <Spinner size="md" />
                        </div>
                    ) : (
                        <>
                            <div className="rounded-xl border border-[#e0d5c7] p-4 space-y-4">
                                <h3 className="font-semibold text-[#2a2a2a]">Produtos liberados no dia a dia</h3>
                                <div className="grid md:grid-cols-3 gap-3 text-sm">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={globalForm.reservableItems.bangalos}
                                            onChange={(e) => setGlobalForm(prev => ({ ...prev, reservableItems: { ...prev.reservableItems, bangalos: e.target.checked } }))}
                                        />
                                        Bangalôs
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={globalForm.reservableItems.sunbeds}
                                            onChange={(e) => setGlobalForm(prev => ({ ...prev, reservableItems: { ...prev.reservableItems, sunbeds: e.target.checked } }))}
                                        />
                                        Sunbeds
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={globalForm.reservableItems.restaurantTables}
                                            onChange={(e) => setGlobalForm(prev => ({ ...prev, reservableItems: { ...prev.reservableItems, restaurantTables: e.target.checked } }))}
                                        />
                                        Mesas restaurante
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={globalForm.reservableItems.beachTables}
                                            onChange={(e) => setGlobalForm(prev => ({ ...prev, reservableItems: { ...prev.reservableItems, beachTables: e.target.checked } }))}
                                        />
                                        Mesas de praia
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={globalForm.reservableItems.dayUse}
                                            onChange={(e) => setGlobalForm(prev => ({ ...prev, reservableItems: { ...prev.reservableItems, dayUse: e.target.checked } }))}
                                        />
                                        Day Use
                                    </label>
                                </div>
                            </div>

                            <div className="rounded-xl border border-[#e0d5c7] p-4 space-y-4">
                                <h3 className="font-semibold text-[#2a2a2a]">Sobrescrever preços padrão</h3>
                                <p className="text-xs text-[#8a5c3f]/80">
                                    Use para definir preços fixos do dia a dia. Datas com configuração própria continuam sobrescrevendo estes valores.
                                </p>
                                <div className="space-y-3">
                                    <div className="hidden md:grid md:grid-cols-4 gap-3 items-center px-1 pb-1">
                                        <span />
                                        <span className="text-xs font-semibold uppercase tracking-wide text-[#8a5c3f]">Preço da reserva</span>
                                        <span className="text-xs font-semibold uppercase tracking-wide text-[#8a5c3f]">Consumação mínima</span>
                                    </div>
                                    {SPACE_OVERRIDE_FIELDS.map(space => {
                                        const override = globalForm.priceOverrides[space.id]
                                        return (
                                            <div key={space.id} className="grid md:grid-cols-4 gap-3 items-center">
                                                <label className="flex items-center gap-2 text-sm text-[#2a2a2a]">
                                                    <input
                                                        type="checkbox"
                                                        checked={override.enabled}
                                                        onChange={(e) => setGlobalForm(prev => ({
                                                            ...prev,
                                                            priceOverrides: {
                                                                ...prev.priceOverrides,
                                                                [space.id]: {
                                                                    ...prev.priceOverrides[space.id],
                                                                    enabled: e.target.checked,
                                                                },
                                                            },
                                                        }))}
                                                    />
                                                    {space.label}
                                                </label>
                                                <Input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="Preço (R$)"
                                                    value={override.price}
                                                    onChange={(e) => setGlobalForm(prev => ({
                                                        ...prev,
                                                        priceOverrides: {
                                                            ...prev.priceOverrides,
                                                            [space.id]: {
                                                                ...prev.priceOverrides[space.id],
                                                                price: sanitizeCurrencyTyping(e.target.value),
                                                            },
                                                        },
                                                    }))}
                                                    onBlur={(e) => {
                                                        const formatted = formatCurrencyInput(e.target.value)
                                                        setGlobalForm(prev => ({
                                                            ...prev,
                                                            priceOverrides: {
                                                                ...prev.priceOverrides,
                                                                [space.id]: {
                                                                    ...prev.priceOverrides[space.id],
                                                                    price: formatted,
                                                                },
                                                            },
                                                        }))
                                                    }}
                                                    disabled={!override.enabled}
                                                />
                                                <Input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="Consumação (R$)"
                                                    value={override.consumable}
                                                    onChange={(e) => setGlobalForm(prev => ({
                                                        ...prev,
                                                        priceOverrides: {
                                                            ...prev.priceOverrides,
                                                            [space.id]: {
                                                                ...prev.priceOverrides[space.id],
                                                                consumable: sanitizeCurrencyTyping(e.target.value),
                                                            },
                                                        },
                                                    }))}
                                                    onBlur={(e) => {
                                                        const formatted = formatCurrencyInput(e.target.value)
                                                        setGlobalForm(prev => ({
                                                            ...prev,
                                                            priceOverrides: {
                                                                ...prev.priceOverrides,
                                                                [space.id]: {
                                                                    ...prev.priceOverrides[space.id],
                                                                    consumable: formatted,
                                                                },
                                                            },
                                                        }))
                                                    }}
                                                    disabled={!override.enabled}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {globalConfig && (
                                <p className="text-xs text-[#8a5c3f]/70">
                                    Última atualização: {new Date(globalConfig.updatedAt).toLocaleString('pt-BR')}
                                </p>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner size="lg" />
                </div>
            ) : configs.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <CalendarDays className="h-12 w-12 text-[#e0d5c7] mx-auto mb-4" />
                        <p className="text-[#8a5c3f] mb-4">Nenhuma configuração por data cadastrada.</p>
                        <Button onClick={openCreateModal}>
                            <Plus className="h-4 w-4" />
                            Criar primeira configuração
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {configs.map(config => {
                        const statusOption = STATUS_OPTIONS.find(option => option.value === config.status)

                        return (
                            <Card key={config.id}>
                                <CardContent className="p-5">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="secondary">{formatDateBR(config.date)}</Badge>
                                                <Badge variant={statusOption?.badge || 'secondary'}>{statusOption?.label || config.status}</Badge>
                                                {!config.reservationsEnabled && <Badge variant="error">Reservas desativadas</Badge>}
                                                {config.highlightOnHome && <Badge variant="info">Destaque na home</Badge>}
                                            </div>

                                            <p className="text-lg font-semibold text-[#2a2a2a]">{config.title || 'Sem título'}</p>
                                            {config.release && (
                                                <p className="text-sm text-[#8a5c3f] line-clamp-3 max-w-3xl">{config.release}</p>
                                            )}
                                            {config.flyerImageUrl && (
                                                <div className="relative mt-2 w-24 aspect-[4/5] rounded-lg border border-[#e0d5c7] bg-[#f5f0eb] overflow-hidden">
                                                    <Image
                                                        src={config.flyerImageUrl}
                                                        alt={`Flyer de ${config.title || formatDateBR(config.date)}`}
                                                        fill
                                                        className="object-contain object-top"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex flex-wrap items-center gap-3 text-xs text-[#8a5c3f]">
                                                <span className="inline-flex items-center gap-1">
                                                    <CalendarClock className="h-3.5 w-3.5" />
                                                    {Object.keys(config.priceOverrides || {}).length} sobrescritas de preço
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Ticket className="h-3.5 w-3.5" />
                                                    {config.ticketLots.length} lotes
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button variant="secondary" size="sm" onClick={() => openEditModal(config)}>
                                                <Pencil className="h-4 w-4" />
                                                Editar
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(config)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
                <ModalContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <ModalHeader>
                        <ModalTitle>{editingConfig ? 'Editar configuração de data' : 'Nova configuração de data'}</ModalTitle>
                    </ModalHeader>

                    <form onSubmit={handleSave} className="p-4 space-y-6">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Input
                                label="Data"
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-[#2a2a2a] mb-1.5">Status do dia</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as DayConfigForm['status'] }))}
                                    className="w-full h-11 px-4 rounded-lg border border-[#e0d5c7] text-sm focus:ring-2 focus:ring-[#d4a574]"
                                >
                                    {STATUS_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>

                            <Input
                                label="Título do evento"
                                value={form.title}
                                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Ex: Best Line Sunset"
                            />

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-[#2a2a2a]">Flyer</label>
                                <input
                                    ref={flyerInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFlyerUpload}
                                    disabled={uploadingFlyer}
                                />
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => flyerInputRef.current?.click()}
                                        isLoading={uploadingFlyer}
                                    >
                                        <Upload className="h-4 w-4" />
                                        {form.flyerImageUrl ? 'Trocar imagem' : 'Adicionar imagem'}
                                    </Button>
                                    {form.flyerImageUrl && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setForm(prev => ({ ...prev, flyerImageUrl: '' }))}
                                        >
                                            <X className="h-4 w-4" />
                                            Remover
                                        </Button>
                                    )}
                                </div>
                                {form.flyerImageUrl ? (
                                    <div className="mt-2">
                                        <div className="relative w-24 aspect-[4/5] rounded-lg border border-[#e0d5c7] bg-[#f5f0eb] overflow-hidden">
                                            <Image
                                                src={form.flyerImageUrl}
                                                alt="Preview do flyer"
                                                fill
                                                className="object-contain object-top"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-[#8a5c3f]/70">Nenhum flyer enviado.</p>
                                )}
                            </div>
                        </div>

                        <Textarea
                            label="Release para o calendário"
                            value={form.release}
                            onChange={(e) => setForm(prev => ({ ...prev, release: e.target.value }))}
                            placeholder="Texto que aparece quando a pessoa clicar na data."
                            rows={4}
                        />

                        <div className="grid md:grid-cols-3 gap-4">
                            <label className="flex items-center gap-2 text-sm text-[#2a2a2a]">
                                <input
                                    type="checkbox"
                                    checked={form.reservationsEnabled}
                                    onChange={(e) => setForm(prev => ({ ...prev, reservationsEnabled: e.target.checked }))}
                                    className="rounded"
                                />
                                Reservas online habilitadas
                            </label>
                            <label className="flex items-center gap-2 text-sm text-[#2a2a2a]">
                                <input
                                    type="checkbox"
                                    checked={form.highlightOnHome}
                                    onChange={(e) => setForm(prev => ({ ...prev, highlightOnHome: e.target.checked }))}
                                    className="rounded"
                                />
                                Mostrar na home (Próximos eventos)
                            </label>
                        </div>

                        <div className="rounded-xl border border-[#e0d5c7] p-4 space-y-4">
                            <h3 className="font-semibold text-[#2a2a2a]">Produtos liberados para esta data</h3>
                            <div className="grid md:grid-cols-3 gap-3 text-sm">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.reservableItems.bangalos}
                                        onChange={(e) => setForm(prev => ({ ...prev, reservableItems: { ...prev.reservableItems, bangalos: e.target.checked } }))}
                                    />
                                    Bangalôs
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.reservableItems.sunbeds}
                                        onChange={(e) => setForm(prev => ({ ...prev, reservableItems: { ...prev.reservableItems, sunbeds: e.target.checked } }))}
                                    />
                                    Sunbeds
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.reservableItems.restaurantTables}
                                        onChange={(e) => setForm(prev => ({ ...prev, reservableItems: { ...prev.reservableItems, restaurantTables: e.target.checked } }))}
                                    />
                                    Mesas restaurante
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.reservableItems.beachTables}
                                        onChange={(e) => setForm(prev => ({ ...prev, reservableItems: { ...prev.reservableItems, beachTables: e.target.checked } }))}
                                    />
                                    Mesas de praia
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.reservableItems.dayUse}
                                        onChange={(e) => setForm(prev => ({ ...prev, reservableItems: { ...prev.reservableItems, dayUse: e.target.checked } }))}
                                    />
                                    Day Use
                                </label>
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#e0d5c7] p-4 space-y-4">
                            <h3 className="font-semibold text-[#2a2a2a]">Sobrescrever preços por espaço</h3>
                            <p className="text-xs text-[#8a5c3f]/80">
                                Quantidade segue o cadastro em Espaços. Aqui você altera apenas preço e consumação desta data.
                            </p>
                            <div className="space-y-3">
                                <div className="hidden md:grid md:grid-cols-4 gap-3 items-center px-1 pb-1">
                                    <span />
                                    <span className="text-xs font-semibold uppercase tracking-wide text-[#8a5c3f]">Preço da reserva</span>
                                    <span className="text-xs font-semibold uppercase tracking-wide text-[#8a5c3f]">Consumação mínima</span>
                                </div>
                                {SPACE_OVERRIDE_FIELDS.map(space => {
                                    const override = form.priceOverrides[space.id]
                                    return (
                                        <div key={space.id} className="grid md:grid-cols-4 gap-3 items-center">
                                            <label className="flex items-center gap-2 text-sm text-[#2a2a2a]">
                                                <input
                                                    type="checkbox"
                                                    checked={override.enabled}
                                                    onChange={(e) => setForm(prev => ({
                                                        ...prev,
                                                        priceOverrides: {
                                                            ...prev.priceOverrides,
                                                            [space.id]: {
                                                                ...prev.priceOverrides[space.id],
                                                                enabled: e.target.checked,
                                                            },
                                                        },
                                                    }))}
                                                />
                                                {space.label}
                                            </label>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="Preço (R$)"
                                                value={override.price}
                                                onChange={(e) => setForm(prev => ({
                                                    ...prev,
                                                    priceOverrides: {
                                                        ...prev.priceOverrides,
                                                        [space.id]: {
                                                            ...prev.priceOverrides[space.id],
                                                            price: sanitizeCurrencyTyping(e.target.value),
                                                        },
                                                    },
                                                }))}
                                                onBlur={(e) => {
                                                    const formatted = formatCurrencyInput(e.target.value)
                                                    setForm(prev => ({
                                                        ...prev,
                                                        priceOverrides: {
                                                            ...prev.priceOverrides,
                                                            [space.id]: {
                                                                ...prev.priceOverrides[space.id],
                                                                price: formatted,
                                                            },
                                                        },
                                                    }))
                                                }}
                                                disabled={!override.enabled}
                                            />
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="Consumação (R$)"
                                                value={override.consumable}
                                                onChange={(e) => setForm(prev => ({
                                                    ...prev,
                                                    priceOverrides: {
                                                        ...prev.priceOverrides,
                                                        [space.id]: {
                                                            ...prev.priceOverrides[space.id],
                                                            consumable: sanitizeCurrencyTyping(e.target.value),
                                                        },
                                                    },
                                                }))}
                                                onBlur={(e) => {
                                                    const formatted = formatCurrencyInput(e.target.value)
                                                    setForm(prev => ({
                                                        ...prev,
                                                        priceOverrides: {
                                                            ...prev.priceOverrides,
                                                            [space.id]: {
                                                                ...prev.priceOverrides[space.id],
                                                                consumable: formatted,
                                                            },
                                                        },
                                                    }))
                                                }}
                                                disabled={!override.enabled}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#e0d5c7] p-4 space-y-4">
                            <h3 className="font-semibold text-[#2a2a2a]">Lotes antecipados</h3>
                            <div className="space-y-3">
                                {form.ticketLots.map((lot, index) => (
                                    <div key={index} className="grid lg:grid-cols-6 gap-3 items-center">
                                        <label className="flex items-center gap-2 text-sm text-[#2a2a2a]">
                                            <input
                                                type="checkbox"
                                                checked={lot.enabled}
                                                onChange={(e) => setForm(prev => ({
                                                    ...prev,
                                                    ticketLots: prev.ticketLots.map((item, idx) => idx === index ? { ...item, enabled: e.target.checked } : item),
                                                }))}
                                            />
                                            Lote {index + 1}
                                        </label>

                                        <Input
                                            value={lot.name}
                                            onChange={(e) => setForm(prev => ({
                                                ...prev,
                                                ticketLots: prev.ticketLots.map((item, idx) => idx === index ? { ...item, name: e.target.value } : item),
                                            }))}
                                            placeholder="Nome"
                                            disabled={!lot.enabled}
                                        />
                                        <Input
                                            type="date"
                                            value={lot.endsAt}
                                            onChange={(e) => setForm(prev => ({
                                                ...prev,
                                                ticketLots: prev.ticketLots.map((item, idx) => idx === index ? { ...item, endsAt: e.target.value } : item),
                                            }))}
                                            disabled={!lot.enabled}
                                        />
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            value={lot.price}
                                            onChange={(e) => setForm(prev => ({
                                                ...prev,
                                                ticketLots: prev.ticketLots.map((item, idx) => idx === index ? { ...item, price: sanitizeCurrencyTyping(e.target.value) } : item),
                                            }))}
                                            onBlur={(e) => setForm(prev => ({
                                                ...prev,
                                                ticketLots: prev.ticketLots.map((item, idx) => idx === index ? { ...item, price: formatCurrencyInput(e.target.value) } : item),
                                            }))}
                                            placeholder="R$ 0,00"
                                            disabled={!lot.enabled}
                                        />
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            value={lot.consumable}
                                            onChange={(e) => setForm(prev => ({
                                                ...prev,
                                                ticketLots: prev.ticketLots.map((item, idx) => idx === index ? { ...item, consumable: sanitizeCurrencyTyping(e.target.value) } : item),
                                            }))}
                                            onBlur={(e) => setForm(prev => ({
                                                ...prev,
                                                ticketLots: prev.ticketLots.map((item, idx) => idx === index ? { ...item, consumable: formatCurrencyInput(e.target.value) } : item),
                                            }))}
                                            placeholder="R$ 0,00"
                                            disabled={!lot.enabled}
                                        />
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={lot.soldOut}
                                                onChange={(e) => setForm(prev => ({
                                                    ...prev,
                                                    ticketLots: prev.ticketLots.map((item, idx) => idx === index ? { ...item, soldOut: e.target.checked } : item),
                                                }))}
                                                disabled={!lot.enabled}
                                            />
                                            Esgotado
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <ModalFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" isLoading={saving}>
                                {editingConfig ? 'Salvar alterações' : 'Criar configuração'}
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </AdminLayout>
    )
}

export default function AdminCalendarioPage() {
    return (
        <Suspense fallback={(
            <AdminLayout>
                <div className="flex justify-center py-16">
                    <Spinner size="lg" />
                </div>
            </AdminLayout>
        )}
        >
            <AdminCalendarioPageContent />
        </Suspense>
    )
}
