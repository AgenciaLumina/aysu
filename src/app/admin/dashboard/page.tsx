// AISSU Beach Lounge - Admin Dashboard (Refatorado)
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Calendar, Users, DollarSign, UtensilsCrossed, Music,
    TrendingUp, CheckCircle, AlertCircle, ChevronRight, ImageIcon, FolderOpen, MessageSquare
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge, getReservationStatusVariant, getReservationStatusLabel } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'

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
                    const today = new Date().toISOString().split('T')[0]
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
        { href: '/admin/midia', icon: FolderOpen, label: 'Mídia R2', description: 'Arquivos CDN' },
        { href: '/admin/eventos', icon: Music, label: 'Eventos', description: 'Gerenciar programação' },
    ]

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Dashboard</h1>
                    <p className="text-[#8a5c3f]">Visão geral do Aysú Beach Lounge</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-[#8a5c3f]">{formatDate(new Date().toISOString())}</span>
                    <Link href="/admin/frente-de-caixa/nova">
                        <Button>+ Nova Reserva</Button>
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Spinner size="lg" />
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-[#8a5c3f]">Total Reservas</p>
                                        <p className="text-3xl font-bold text-[#2a2a2a]">{stats.totalReservations}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-[#f1c595]/30 flex items-center justify-center">
                                        <Calendar className="h-6 w-6 text-[#d4a574]" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-[#8a5c3f]">Reservas Hoje</p>
                                        <p className="text-3xl font-bold text-[#2a2a2a]">{stats.todayReservations}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-[#8a5c3f]">Receita Total</p>
                                        <p className="text-3xl font-bold text-[#2a2a2a]">{formatCurrency(stats.totalRevenue)}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <TrendingUp className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-[#8a5c3f]">Pgtos Pendentes</p>
                                        <p className="text-3xl font-bold text-[#2a2a2a]">{stats.pendingPayments}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                        <AlertCircle className="h-6 w-6 text-amber-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Content Grid */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Recent Reservations */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Reservas Recentes</CardTitle>
                                        <CardDescription>Últimas reservas do sistema</CardDescription>
                                    </div>
                                    <Link href="/admin/reservas">
                                        <Button variant="ghost" size="sm">
                                            Ver todas
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    {recentReservations.length === 0 ? (
                                        <p className="text-center text-[#8a5c3f] py-8">Nenhuma reserva encontrada</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {recentReservations.map(reservation => (
                                                <div key={reservation.id} className="flex flex-col gap-2 p-3 hover:bg-[#fdfbf8] transition-colors border-b border-[#e0d5c7] last:border-0">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-[#f1c595]/30 flex items-center justify-center flex-shrink-0">
                                                                <Users className="h-5 w-5 text-[#d4a574]" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-[#2a2a2a]">{reservation.customerName}</p>
                                                                <p className="text-sm text-[#8a5c3f]">{reservation.cabin?.name}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <Badge variant={getReservationStatusVariant(reservation.status)}>
                                                                {getReservationStatusLabel(reservation.status)}
                                                            </Badge>
                                                            <p className="text-sm text-[#8a5c3f] mt-1">
                                                                {formatDate(reservation.checkIn)} {formatTime(reservation.checkIn)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {reservation.notes && (
                                                        <div className="ml-12 text-xs bg-yellow-50 text-[#8a5c3f] p-2 rounded border border-yellow-100 flex items-start gap-1.5">
                                                            <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0 text-yellow-600" />
                                                            <span>{reservation.notes}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Ações Rápidas</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {quickActions.map(item => (
                                        <Link key={item.href} href={item.href}>
                                            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f1c595]/20 transition-colors cursor-pointer">
                                                <div className="w-10 h-10 rounded-lg bg-[#f1c595]/30 flex items-center justify-center">
                                                    <item.icon className="h-5 w-5 text-[#d4a574]" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[#2a2a2a]">{item.label}</p>
                                                    <p className="text-xs text-[#8a5c3f]">{item.description}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Horário de Funcionamento</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-[#8a5c3f]">Seg - Sex</span>
                                            <span className="font-medium">10:00 - 22:00</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#8a5c3f]">Sábado</span>
                                            <span className="font-medium">10:00 - 23:00</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#8a5c3f]">Domingo</span>
                                            <span className="font-medium">10:00 - 20:00</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </>
            )}
        </AdminLayout>
    )
}
