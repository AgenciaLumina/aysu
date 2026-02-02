'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
    CalendarDays,
    Users,
    DollarSign,
    Clock,
    CheckCircle2,
    XCircle,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    Phone,
    MoreVertical,
    Loader2,
    Bell
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge, getReservationStatusVariant, getReservationStatusLabel } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Reservation {
    id: string
    customerName: string
    customerPhone: string
    spaceName: string
    spaceType: string
    date: string
    time: string
    totalPrice: number
    status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
    source: 'online' | 'manual'
}

interface PendingReservation {
    id: string
    customerName: string
    customerPhone: string
    spaceName: string
    date: string
    totalPrice: number
    createdAt: string
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function FrenteDeCaixaPage() {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [pendingReservations, setPendingReservations] = useState<PendingReservation[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isActionsOpen, setIsActionsOpen] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [approvalLoading, setApprovalLoading] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const fetchPendingReservations = async () => {
        try {
            const res = await fetch('/api/admin/reservations/pending')
            const data = await res.json()
            if (data.success) setPendingReservations(data.data)
        } catch (error) {
            console.error('Erro ao buscar pendentes:', error)
        }
    }

    const handleApprove = async (id: string) => {
        setApprovalLoading(id)
        try {
            const token = document.cookie.split('; ').find(c => c.startsWith('admin_token='))?.split('=')[1]
            const res = await fetch(`/api/reservations/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'CONFIRMED' }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Reserva aprovada!')
                fetchPendingReservations()
                fetchReservations()
            } else {
                toast.error(data.error || 'Erro ao aprovar')
            }
        } catch {
            toast.error('Erro ao aprovar reserva')
        } finally {
            setApprovalLoading(null)
        }
    }

    const handleReject = async (id: string) => {
        if (!confirm('Tem certeza que deseja rejeitar esta reserva?')) return
        setApprovalLoading(id)
        try {
            const token = document.cookie.split('; ').find(c => c.startsWith('admin_token='))?.split('=')[1]
            const res = await fetch(`/api/reservations/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'CANCELLED' }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Reserva rejeitada')
                fetchPendingReservations()
                fetchReservations()
            } else {
                toast.error(data.error || 'Erro ao rejeitar')
            }
        } catch {
            toast.error('Erro ao rejeitar reserva')
        } finally {
            setApprovalLoading(null)
        }
    }

    // Fetch reservations when date changes
    useEffect(() => {
        fetchReservations()
    }, [selectedDate])

    // Fetch pending on mount and every 30s
    useEffect(() => {
        fetchPendingReservations()
        const interval = setInterval(fetchPendingReservations, 30000)
        return () => clearInterval(interval)
    }, [])

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsActionsOpen(null)
            }
        }

        if (isActionsOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isActionsOpen])

    const fetchReservations = async () => {
        try {
            setLoading(true)
            const dateStr = selectedDate.toISOString().split('T')[0]
            const res = await fetch(`/api/admin/reservations?date=${dateStr}`)
            const data = await res.json()

            if (data.success) {
                setReservations(data.data)
            } else {
                console.error('Failed to fetch reservations:', data.error)
            }
        } catch (error) {
            console.error('Error fetching reservations:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDateDisplay = (date: Date) => {
        const day = date.getDate()
        const month = MONTHS[date.getMonth()]
        const weekday = DAYS[date.getDay()]
        return `${weekday}, ${day} de ${month}`
    }

    const goToPrevDay = () => {
        const newDate = new Date(selectedDate)
        newDate.setDate(newDate.getDate() - 1)
        setSelectedDate(newDate)
    }

    const goToNextDay = () => {
        const newDate = new Date(selectedDate)
        newDate.setDate(newDate.getDate() + 1)
        setSelectedDate(newDate)
    }

    const goToToday = () => {
        setSelectedDate(new Date())
    }

    // Filtrar reservas por busca
    const filteredReservations = reservations.filter(r =>
        r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerPhone.includes(searchQuery) ||
        r.spaceName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Stats do dia
    const stats = {
        total: reservations.length,
        checkedIn: reservations.filter(r => r.status === 'checked_in').length,
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        pending: pendingReservations.length,
        revenue: reservations.filter(r => r.status !== 'cancelled' && r.status !== 'no_show')
            .reduce((sum, r) => sum + r.totalPrice, 0)
    }

    const handleCheckIn = async (id: string) => {
        try {
            setActionLoading(id)
            const res = await fetch(`/api/admin/reservations/${id}/check-in`, {
                method: 'POST',
            })
            const data = await res.json()

            if (data.success) {
                // Update local state
                setReservations(prev =>
                    prev.map(r => r.id === id ? { ...r, status: 'checked_in' as const } : r)
                )
                setIsActionsOpen(null)
                // TODO: Show success toast
            } else {
                console.error('Check-in failed:', data.error)
                // TODO: Show error toast
            }
        } catch (error) {
            console.error('Error during check-in:', error)
            // TODO: Show error toast
        } finally {
            setActionLoading(null)
        }
    }

    const handleCheckOut = async (id: string) => {
        try {
            setActionLoading(id)
            const res = await fetch(`/api/admin/reservations/${id}/check-out`, {
                method: 'POST',
            })
            const data = await res.json()

            if (data.success) {
                // Update local state
                setReservations(prev =>
                    prev.map(r => r.id === id ? { ...r, status: 'checked_out' as const } : r)
                )
                setIsActionsOpen(null)
                // TODO: Show success toast
            } else {
                console.error('Check-out failed:', data.error)
                // TODO: Show error toast
            }
        } catch (error) {
            console.error('Error during check-out:', error)
            // TODO: Show error toast
        } finally {
            setActionLoading(null)
        }
    }

    const handleCancel = async (id: string) => {
        if (!confirm('Tem certeza que deseja cancelar esta reserva?')) {
            return
        }

        try {
            setActionLoading(id)
            const res = await fetch(`/api/admin/reservations/${id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Cancelado pelo admin' }),
            })
            const data = await res.json()

            if (data.success) {
                // Update local state
                setReservations(prev =>
                    prev.map(r => r.id === id ? { ...r, status: 'cancelled' as const } : r)
                )
                setIsActionsOpen(null)
                // TODO: Show success toast
            } else {
                console.error('Cancellation failed:', data.error)
                // TODO: Show error toast
            }
        } catch (error) {
            console.error('Error cancelling reservation:', error)
            // TODO: Show error toast
        } finally {
            setActionLoading(null)
        }
    }

    const handleViewDetails = (id: string) => {
        // TODO: Open details modal
        console.log('View details for:', id)
        setIsActionsOpen(null)
    }

    const getStatusIcon = (status: Reservation['status']) => {
        switch (status) {
            case 'pending':
                return <Bell className="h-4 w-4 text-amber-600 animate-pulse" />
            case 'checked_in':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />
            case 'checked_out':
                return <CheckCircle2 className="h-4 w-4 text-gray-400" />
            case 'confirmed':
                return <Clock className="h-4 w-4 text-amber-500" />
            case 'cancelled':
            case 'no_show':
                return <XCircle className="h-4 w-4 text-red-500" />
            default:
                return null
        }
    }

    return (
        <AdminLayout>
            {/* Header com Data */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Frente de Caixa</h1>
                    <p className="text-[#8a5c3f]">Gerencie as reservas do dia</p>
                </div>

                {/* Date Navigation */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={goToPrevDay}
                        className="p-2 rounded-lg hover:bg-[#f5f0e8] text-[#8a5c3f] transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    <button
                        onClick={goToToday}
                        className="px-4 py-2 bg-white rounded-lg border border-[#e0d5c7] font-medium text-[#2a2a2a] min-w-[200px] text-center"
                    >
                        {formatDateDisplay(selectedDate)}
                    </button>

                    <button
                        onClick={goToNextDay}
                        className="p-2 rounded-lg hover:bg-[#f5f0e8] text-[#8a5c3f] transition-colors"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>

                {/* Nova Reserva */}
                <Link href="/admin/frente-de-caixa/nova">
                    <Button>
                        <Plus className="h-4 w-4" />
                        Nova Reserva Manual
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#f1c595]/30 flex items-center justify-center">
                                <CalendarDays className="h-5 w-5 text-[#d4a574]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#2a2a2a]">{stats.total}</p>
                                <p className="text-xs text-[#8a5c3f]">Reservas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#2a2a2a]">{stats.checkedIn}</p>
                                <p className="text-xs text-[#8a5c3f]">Check-ins</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#2a2a2a]">{stats.confirmed}</p>
                                <p className="text-xs text-[#8a5c3f]">Aguardando</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#d4a574]/20 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-[#d4a574]" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#2a2a2a]">{formatCurrency(stats.revenue)}</p>
                                <p className="text-xs text-[#8a5c3f]">Receita</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Reservations Alert */}
            {pendingReservations.length > 0 && (
                <Card className="mb-8 border-amber-300 bg-amber-50/50">
                    <CardHeader className="border-b border-amber-200">
                        <CardTitle className="flex items-center gap-3 text-amber-800">
                            <div className="relative">
                                <Bell className="h-5 w-5" />
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {pendingReservations.length}
                                </span>
                            </div>
                            Reservas Aguardando Aprovação
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 divide-y divide-amber-200">
                        {pendingReservations.map(reservation => (
                            <div key={reservation.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                                        <Clock className="h-5 w-5 text-amber-700" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[#2a2a2a]">{reservation.customerName}</p>
                                        <p className="text-sm text-[#8a5c3f]">{reservation.spaceName}</p>
                                        <div className="flex items-center gap-3 text-xs text-[#8a5c3f] mt-1">
                                            <span className="flex items-center gap-1">
                                                <CalendarDays className="h-3 w-3" />
                                                {formatDate(reservation.date)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                {reservation.customerPhone}
                                            </span>
                                            <span className="font-bold text-[#d4a574]">{formatCurrency(reservation.totalPrice)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-14 md:ml-0">
                                    <button
                                        onClick={() => handleApprove(reservation.id)}
                                        disabled={approvalLoading === reservation.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {approvalLoading === reservation.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4" />
                                        )}
                                        Aprovar
                                    </button>
                                    <button
                                        onClick={() => handleReject(reservation.id)}
                                        disabled={approvalLoading === reservation.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Rejeitar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Search */}
            <div className="relative max-w-md mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a5c3f]" />
                <input
                    type="text"
                    placeholder="Buscar por nome, telefone ou espaço..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e0d5c7] text-sm focus:ring-2 focus:ring-[#d4a574] focus:border-[#d4a574] bg-white"
                />
            </div>

            {/* Reservations List */}
            <Card>
                <CardHeader className="border-b border-[#e0d5c7]">
                    <CardTitle>Reservas do Dia</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="py-16 text-center">
                            <Loader2 className="h-12 w-12 text-[#d4a574] mx-auto mb-4 animate-spin" />
                            <p className="text-[#8a5c3f]">Carregando reservas...</p>
                        </div>
                    ) : filteredReservations.length === 0 ? (
                        <div className="py-16 text-center">
                            <CalendarDays className="h-12 w-12 text-[#e0d5c7] mx-auto mb-4" />
                            <p className="text-[#8a5c3f] mb-2">Nenhuma reserva encontrada</p>
                            <Link href="/admin/frente-de-caixa/nova">
                                <Button variant="secondary">
                                    <Plus className="h-4 w-4" />
                                    Adicionar Reserva
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#e0d5c7]">
                            {filteredReservations.map((reservation) => (
                                <div
                                    key={reservation.id}
                                    className={`p-4 hover:bg-[#fdfbf8] transition-colors ${isActionsOpen === reservation.id ? 'relative z-20 bg-[#fdfbf8]' : 'relative z-0'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {/* Status Icon */}
                                            <div className="flex-shrink-0">
                                                {getStatusIcon(reservation.status)}
                                            </div>

                                            {/* Time */}
                                            <div className="w-16 text-center">
                                                <p className="font-bold text-[#2a2a2a]">{reservation.time}</p>
                                            </div>

                                            {/* Customer Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-[#2a2a2a] truncate">
                                                        {reservation.customerName}
                                                    </p>
                                                    {reservation.source === 'manual' && (
                                                        <Badge variant="outline">Manual</Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-[#8a5c3f]">
                                                    <Phone className="h-3 w-3" />
                                                    <span>{reservation.customerPhone}</span>
                                                </div>
                                            </div>

                                            {/* Space */}
                                            <div className="hidden md:block w-40">
                                                <p className="font-medium text-[#2a2a2a]">{reservation.spaceName}</p>
                                            </div>

                                            {/* Price */}
                                            <div className="hidden sm:block w-28 text-right">
                                                <p className="font-bold text-[#d4a574]">
                                                    {formatCurrency(reservation.totalPrice)}
                                                </p>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="w-28">
                                                <Badge variant={getReservationStatusVariant(reservation.status)}>
                                                    {getReservationStatusLabel(reservation.status)}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div ref={dropdownRef} className="relative">
                                            <button
                                                onClick={() => setIsActionsOpen(isActionsOpen === reservation.id ? null : reservation.id)}
                                                className={`p-2 rounded-lg hover:bg-[#f5f0e8] transition-colors ${isActionsOpen === reservation.id ? 'bg-[#f5f0e8] text-[#d4a574]' : 'text-[#8a5c3f]'}`}
                                                disabled={actionLoading === reservation.id}
                                            >
                                                <MoreVertical className="h-5 w-5" />
                                            </button>

                                            {isActionsOpen === reservation.id && (
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-[#e0d5c7] py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                                    {reservation.status === 'confirmed' && (
                                                        <button
                                                            onClick={() => handleCheckIn(reservation.id)}
                                                            className="w-full px-4 py-2 text-left text-sm hover:bg-[#f5f0e8] text-[#2a2a2a] flex items-center gap-2 disabled:opacity-50"
                                                            disabled={actionLoading === reservation.id}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                            Fazer Check-in
                                                        </button>
                                                    )}
                                                    {reservation.status === 'checked_in' && (
                                                        <button
                                                            onClick={() => handleCheckOut(reservation.id)}
                                                            className="w-full px-4 py-2 text-left text-sm hover:bg-[#f5f0e8] text-[#2a2a2a] flex items-center gap-2 disabled:opacity-50"
                                                            disabled={actionLoading === reservation.id}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4 text-gray-400" />
                                                            Fazer Check-out
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleViewDetails(reservation.id)}
                                                        className="w-full px-4 py-2 text-left text-sm hover:bg-[#f5f0e8] text-[#2a2a2a] flex items-center gap-2"
                                                    >
                                                        <Users className="h-4 w-4" />
                                                        Ver Detalhes
                                                    </button>
                                                    {(reservation.status === 'confirmed' || reservation.status === 'checked_in') && (
                                                        <button
                                                            onClick={() => handleCancel(reservation.id)}
                                                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 disabled:opacity-50"
                                                            disabled={actionLoading === reservation.id}
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                            Cancelar
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    )
}
