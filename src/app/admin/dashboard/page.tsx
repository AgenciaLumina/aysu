// AISSU Beach Lounge - Admin Dashboard (Refatorado)
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Calendar, Users, DollarSign, UtensilsCrossed, Music,
    CheckCircle, AlertCircle, ChevronRight, ImageIcon, FolderOpen, MessageSquare, Images
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge, getReservationStatusVariant, getReservationStatusLabel } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency, formatDate, formatTime, toLocalISODate } from '@/lib/utils'

interface DashboardStats {
    totalReservations: number
    todayReservations: number
    totalRevenue: number
    pendingPayments: number
}

interface RecentReservation {
    id: string
    customerName: string
    cabin: { name: string }
    checkIn: string
    status: string
    notes?: string
    totalPrice: number
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalReservations: 0,
        todayReservations: 0,
        totalRevenue: 0,
        pendingPayments: 0,
    })
    const [recentReservations, setRecentReservations] = useState<RecentReservation[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const res = await fetch('/api/admin/reservations?limit=5')
                const data = await res.json()

                if (data.success) {
                    setRecentReservations(data.data)

                    // Calcula estatísticas
                    // Usa toLocalISODate para garantir que "hoje" seja a data local correta
                    const today = toLocalISODate(new Date())
                    const todayReservations = data.data.filter((r: RecentReservation) =>
                        r.checkIn.startsWith(today)
                    ).length

                    const totalRevenue = data.data.reduce((sum: number, r: RecentReservation) =>
                        sum + Number(r.totalPrice), 0
                    )

                    const pendingPayments = data.data.filter((r: RecentReservation) =>
                        r.status === 'PENDING'
                    ).length

                    setStats({
                        totalReservations: data.total || data.data.length,
                        todayReservations,
                        totalRevenue,
                        pendingPayments,
                    })
                }
            } catch (error) {
                console.error('Erro ao carregar dashboard:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchDashboardData()
    }, [])

    const quickActions = [
        { href: '/admin/frente-de-caixa', icon: Calendar, label: 'Frente de Caixa', description: 'Operação do dia' },
        { href: '/admin/reservas', icon: Calendar, label: 'Reservas', description: 'Gerenciar reservas' },
        { href: '/admin/cardapio', icon: UtensilsCrossed, label: 'Cardápio', description: 'Gerenciar itens' },
        { href: '/admin/galeria', icon: ImageIcon, label: 'Galeria', description: 'Fotos do Instagram' },
        { href: '/admin/galeria-eventos', icon: Images, label: 'Galeria de Eventos', description: 'Portfólio de eventos' },
        { href: '/admin/midia', icon: FolderOpen, label: 'Mídia R2', description: 'Arquivos CDN' },
        { href: '/admin/eventos', icon: Music, label: 'Eventos', description: 'Gerenciar programação' },
    ]
    const todayLabel = formatDate(new Date().toISOString())
    const statCards = [
        {
            label: 'Total de reservas',
            value: stats.totalReservations.toString(),
            caption: 'Volume geral carregado do sistema.',
            icon: Calendar,
            iconClassName: 'bg-[#f1c595]/30 text-[#d4a574]',
        },
        {
            label: 'Operação de hoje',
            value: stats.todayReservations.toString(),
            caption: stats.todayReservations === 1 ? '1 chegada prevista para hoje.' : `${stats.todayReservations} chegadas previstas hoje.`,
            icon: CheckCircle,
            iconClassName: 'bg-green-100 text-green-600',
        },
        {
            label: 'Receita monitorada',
            value: formatCurrency(stats.totalRevenue),
            caption: 'Somatório das reservas exibidas agora.',
            icon: DollarSign,
            iconClassName: 'bg-blue-100 text-blue-600',
        },
        {
            label: 'Pagamentos pendentes',
            value: stats.pendingPayments.toString(),
            caption: stats.pendingPayments > 0 ? 'Há pagamentos pedindo ação da equipe.' : 'Nenhuma pendência crítica no momento.',
            icon: AlertCircle,
            iconClassName: 'bg-amber-100 text-amber-600',
        },
    ]

    return (
        <AdminLayout>
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Spinner size="lg" />
                </div>
            ) : (
                <div className="space-y-6 sm:space-y-8">
                    <section className="overflow-hidden rounded-[28px] border border-[#e0d5c7] bg-[linear-gradient(135deg,#fff9f2_0%,#f6ede4_50%,#ffffff_100%)] p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                            <div className="space-y-4">
                                <div className="inline-flex items-center rounded-full border border-[#e7d5c0] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b58d68]">
                                    Operação do dia
                                </div>
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-serif font-bold text-[#2a2a2a] sm:text-4xl">
                                        Dashboard
                                    </h1>
                                    <p className="max-w-2xl text-sm leading-6 text-[#8a5c3f] sm:text-base">
                                        Visão rápida do movimento, pendências e acessos principais do Aysú Beach Lounge.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                                    <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3">
                                        <p className="text-xs uppercase tracking-[0.2em] text-[#b58d68]">Hoje</p>
                                        <p className="mt-1 text-lg font-semibold text-[#2a2a2a]">
                                            {stats.todayReservations} reservas
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3">
                                        <p className="text-xs uppercase tracking-[0.2em] text-[#b58d68]">Pendências</p>
                                        <p className="mt-1 text-lg font-semibold text-[#2a2a2a]">
                                            {stats.pendingPayments} pagamentos
                                        </p>
                                    </div>
                                    <div className="col-span-2 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 sm:col-span-1">
                                        <p className="text-xs uppercase tracking-[0.2em] text-[#b58d68]">Receita visível</p>
                                        <p className="mt-1 text-lg font-semibold text-[#2a2a2a]">
                                            {formatCurrency(stats.totalRevenue)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] xl:min-w-[18rem] xl:max-w-sm">
                                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4">
                                    <p className="text-xs uppercase tracking-[0.24em] text-[#b58d68]">Data local</p>
                                    <p className="mt-2 text-base font-semibold text-[#2a2a2a] sm:text-lg">{todayLabel}</p>
                                    <p className="mt-1 text-sm text-[#8a5c3f]">Resumo preparado para acompanhamento rápido no celular.</p>
                                </div>
                                <Link href="/admin/frente-de-caixa/nova" className="w-full sm:w-auto">
                                    <Button size="lg" className="w-full justify-center">
                                        + Nova Reserva
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </section>

                    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                        {statCards.map((item) => (
                            <Card key={item.label} className="border-[#e7dccd]">
                                <CardContent className="p-4 sm:p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b58d68]">
                                                {item.label}
                                            </p>
                                            <p className="mt-3 text-xl font-bold leading-tight text-[#2a2a2a] sm:text-3xl">
                                                {item.value}
                                            </p>
                                            <p className="mt-2 text-xs leading-5 text-[#8a5c3f] sm:text-sm">
                                                {item.caption}
                                            </p>
                                        </div>
                                        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${item.iconClassName}`}>
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(19rem,1fr)]">
                        <Card>
                            <CardHeader className="gap-4 border-b border-[#f1e7da] pb-5 sm:flex-row sm:items-end sm:justify-between">
                                <div className="space-y-1">
                                    <CardTitle>Reservas Recentes</CardTitle>
                                    <CardDescription>Últimos movimentos registrados no sistema.</CardDescription>
                                </div>
                                <Link href="/admin/reservas" className="w-full sm:w-auto">
                                    <Button variant="ghost" size="sm" className="w-full justify-center sm:w-auto">
                                        Ver todas
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                                {recentReservations.length === 0 ? (
                                    <p className="py-8 text-center text-[#8a5c3f]">Nenhuma reserva encontrada</p>
                                ) : (
                                    <div className="space-y-3">
                                        {recentReservations.map((reservation) => (
                                            <div
                                                key={reservation.id}
                                                className="rounded-2xl border border-[#eee2d3] bg-[#fffdfa] p-4 transition-colors hover:bg-[#fdfbf8] sm:p-5"
                                            >
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="flex min-w-0 items-start gap-3">
                                                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f1c595]/30">
                                                            <Users className="h-5 w-5 text-[#d4a574]" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-base font-semibold text-[#2a2a2a]">
                                                                {reservation.customerName}
                                                            </p>
                                                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#8a5c3f]">
                                                                <span>{reservation.cabin?.name}</span>
                                                                <span className="hidden sm:inline">•</span>
                                                                <span>{formatCurrency(Number(reservation.totalPrice))}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                                                        <Badge variant={getReservationStatusVariant(reservation.status)}>
                                                            {getReservationStatusLabel(reservation.status)}
                                                        </Badge>
                                                        <p className="text-sm text-[#8a5c3f]">
                                                            {formatDate(reservation.checkIn)} às {formatTime(reservation.checkIn)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {reservation.notes && (
                                                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-yellow-100 bg-yellow-50 p-3 text-xs text-[#8a5c3f] sm:text-sm">
                                                        <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600" />
                                                        <span>{reservation.notes}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle>Ações Rápidas</CardTitle>
                                    <CardDescription>Atalhos prontos para uso rápido no celular.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-1">
                                    {quickActions.map((item) => (
                                        <Link key={item.href} href={item.href} className="group">
                                            <div className="flex h-full flex-col gap-3 rounded-2xl border border-[#eee2d3] p-4 transition-colors hover:bg-[#fdf7ef]">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f1c595]/30">
                                                        <item.icon className="h-5 w-5 text-[#d4a574]" />
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-[#c3a181] transition-transform group-hover:translate-x-0.5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium leading-tight text-[#2a2a2a]">{item.label}</p>
                                                    <p className="mt-1 hidden text-xs leading-5 text-[#8a5c3f] sm:block">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle>Horário de Funcionamento</CardTitle>
                                    <CardDescription>Referência rápida para atendimento e operação.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between rounded-xl bg-[#fdfbf8] px-4 py-3 text-sm">
                                        <span className="text-[#8a5c3f]">Seg - Sex</span>
                                        <span className="font-medium text-[#2a2a2a]">10:00 - 22:00</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-[#fdfbf8] px-4 py-3 text-sm">
                                        <span className="text-[#8a5c3f]">Sábado</span>
                                        <span className="font-medium text-[#2a2a2a]">10:00 - 23:00</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-[#fdfbf8] px-4 py-3 text-sm">
                                        <span className="text-[#8a5c3f]">Domingo</span>
                                        <span className="font-medium text-[#2a2a2a]">10:00 - 20:00</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                </div>
            )}
        </AdminLayout>
    )
}
