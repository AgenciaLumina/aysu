// AISSU Beach Lounge - Admin Reservas
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Users, Search, Plus, Check, X, XCircle, Ban, Trash2, ChevronLeft, ChevronRight, MessageSquare, Edit } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, getReservationStatusVariant, getReservationStatusLabel } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency, formatDateUTC, formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ClosedDate {
    id: string
    date: string
    reason: string
}

interface Reservation {
    id: string
    customerName: string
    customerEmail: string
    checkIn: string
    checkOut: string
    status: string
    totalPrice: number
    cabin: { name: string }
    notes?: string
}

export default function AdminReservasPage() {
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [processingId, setProcessingId] = useState<string | null>(null)

    // Evento Fechado
    const [closedDates, setClosedDates] = useState<ClosedDate[]>([])
    const [closedLoading, setClosedLoading] = useState(false)
    const [closedMonth, setClosedMonth] = useState(() => new Date())
    const [closedReason, setClosedReason] = useState('Evento Fechado')

    // Edit Modal
    const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
    const [newDate, setNewDate] = useState('')
    const [editLoading, setEditLoading] = useState(false)

    const fetchReservations = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/admin/reservations', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) setReservations(data.data)
        } catch (error) {
            console.error('Erro:', error)
            toast.error('Erro ao carregar reservas')
        } finally {
            setLoading(false)
        }
    }

    const fetchClosedDates = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/admin/closed-dates', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (data.success) setClosedDates(data.data)
        } catch (error) {
            console.error('Erro:', error)
        }
    }

    const toggleClosedDate = async (dateStr: string) => {
        const existing = closedDates.find(cd => cd.date.split('T')[0] === dateStr)
        setClosedLoading(true)
        try {
            const token = localStorage.getItem('token')
            if (existing) {
                await fetch(`/api/admin/closed-dates/${existing.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                toast.success('Data reaberta')
            } else {
                await fetch('/api/admin/closed-dates', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ date: dateStr, reason: closedReason }),
                })
                toast.success('Data marcada como Evento Fechado')
            }
            fetchClosedDates()
        } catch {
            toast.error('Erro ao atualizar data')
        } finally {
            setClosedLoading(false)
        }
    }

    const getClosedMonthDays = () => {
        const year = closedMonth.getFullYear()
        const month = closedMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const startWeekday = firstDay.getDay()
        const days: (Date | null)[] = []
        for (let i = 0; i < startWeekday; i++) days.push(null)
        for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
        return days
    }

    const isDateClosed = (dateStr: string) =>
        closedDates.some(cd => cd.date.split('T')[0] === dateStr)

    const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    useEffect(() => {
        fetchReservations()
        fetchClosedDates()
    }, [])

    const handleStatusUpdate = async (id: string, newStatus: 'CONFIRMED' | 'CANCELLED') => {
        if (!confirm(`Tem certeza que deseja ${newStatus === 'CONFIRMED' ? 'APROVAR' : 'REJEITAR'} esta reserva?`)) return

        setProcessingId(id)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/reservations/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            })
            const data = await res.json()

            if (data.success) {
                toast.success(newStatus === 'CONFIRMED' ? 'Reserva Aprovada!' : 'Reserva Rejeitada')
                fetchReservations() // Recarrega a lista
            } else {
                toast.error(data.error || 'Erro ao atualizar status')
            }
        } catch (error) {
            console.error('Erro:', error)
            toast.error('Erro ao processar solicitação')
        } finally {
            setProcessingId(null)
        }
    }

    const filtered = reservations.filter(r =>
        r.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Estados e Filtros
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc') // Padrão: Mais recentes primeiro (desc)

    // ... codigo existente ...

    // Ordenação manual no front (já que a API traz tudo)
    const sortedReservations = [...filtered].sort((a, b) => {
        const dateA = new Date(a.checkIn).getTime()
        const dateB = new Date(b.checkIn).getTime()
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

    const toggleSort = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    }

    const handleDelete = async (id: string, customerName: string) => {
        if (!confirm(`⚠️ ATENÇÃO: Deseja apagar PERMANENTEMENTE a reserva de ${customerName}?\n\nEsta ação não pode ser desfeita.`)) return

        setProcessingId(id)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/admin/reservations/${id}/delete`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()

            if (data.success) {
                toast.success('Reserva apagada do sistema')
                fetchReservations()
            } else {
                toast.error(data.error || 'Erro ao apagar')
            }
        } catch (error) {
            console.error('Erro:', error)
            toast.error('Erro ao apagar reserva')
        } finally {
            setProcessingId(null)
        }
    }

    const openEditModal = (reservation: Reservation) => {
        setEditingReservation(reservation)
        // Extract YYYY-MM-DD from checkIn string (ISO)
        setNewDate(reservation.checkIn.split('T')[0])
    }

    const handleSaveDate = async () => {
        if (!editingReservation || !newDate) return

        setEditLoading(true)
        try {
            // Construct standard safe dates (T10:00 - T18:00)
            const checkIn = new Date(`${newDate}T10:00:00`)
            const checkOut = new Date(`${newDate}T18:00:00`)

            const token = localStorage.getItem('token')
            const res = await fetch(`/api/reservations/${editingReservation.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    checkIn: checkIn.toISOString(),
                    checkOut: checkOut.toISOString()
                })
            })
            const data = await res.json()

            if (data.success) {
                toast.success('Data alterada com sucesso!')
                setEditingReservation(null)
                fetchReservations() // Refresh list
            } else {
                toast.error(data.error || 'Erro ao alterar data')
            }
        } catch (error) {
            toast.error('Erro ao salvar nova data')
        } finally {
            setEditLoading(false)
        }
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Reservas</h1>
                    <p className="text-[#8a5c3f]">Gerencie todas as reservas do beach club</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={toggleSort} className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {sortOrder === 'desc' ? 'Mais Recentes' : 'Mais Antigas'}
                    </Button>
                    <Link href="/admin/frente-de-caixa/nova">
                        <Button>
                            <Plus className="h-4 w-4" />
                            Nova Reserva
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a5c3f]" />
                <input
                    type="text"
                    placeholder="Buscar por nome..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e0d5c7] text-sm focus:ring-2 focus:ring-[#d4a574] focus:border-[#d4a574] bg-white"
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : sortedReservations.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Calendar className="h-12 w-12 text-[#e0d5c7] mx-auto mb-4" />
                        <p className="text-[#8a5c3f] mb-2">Nenhuma reserva encontrada</p>
                        <p className="text-sm text-[#8a5c3f]/70 mb-6">
                            Faça login como admin para ver as reservas ou crie uma nova reserva.
                        </p>
                        <Link href="/admin/frente-de-caixa/nova">
                            <Button>
                                <Plus className="h-4 w-4" />
                                Criar Reserva
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0 divide-y divide-[#e0d5c7]">
                        {sortedReservations.map(reservation => (
                            <div key={reservation.id} className="p-4 hover:bg-[#fdfbf8] transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#f1c595]/30 flex items-center justify-center flex-shrink-0">
                                            <Users className="h-6 w-6 text-[#d4a574]" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[#2a2a2a]">{reservation.customerName}</h3>
                                            <p className="text-sm text-[#8a5c3f]">{reservation.cabin?.name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 flex-1">
                                        {/* Status & Price */}
                                        <div className="text-right">
                                            <Badge variant={getReservationStatusVariant(reservation.status)}>
                                                {getReservationStatusLabel(reservation.status)}
                                            </Badge>
                                            <p className="text-sm text-[#8a5c3f] mt-1">
                                                {formatDateUTC(reservation.checkIn)} {formatTime(reservation.checkIn)}
                                            </p>
                                            <p className="font-bold text-[#d4a574]">{formatCurrency(reservation.totalPrice)}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            {reservation.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(reservation.id, 'CONFIRMED')}
                                                        disabled={processingId === reservation.id}
                                                        title="Aprovar Reserva"
                                                        className="w-10 h-10 rounded-full bg-green-100 hover:bg-green-200 text-green-700 flex items-center justify-center transition-colors disabled:opacity-50"
                                                    >
                                                        {processingId === reservation.id ? <Spinner size="sm" /> : <Check className="h-5 w-5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(reservation.id, 'CANCELLED')}
                                                        disabled={processingId === reservation.id}
                                                        title="Rejeitar Reserva"
                                                        className="w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center transition-colors disabled:opacity-50"
                                                    >
                                                        {processingId === reservation.id ? <Spinner size="sm" /> : <X className="h-5 w-5" />}
                                                    </button>
                                                </>
                                            )}

                                            {/* Botão de Editar */}
                                            {reservation.status !== 'CANCELLED' && (
                                                <button
                                                    onClick={() => openEditModal(reservation)}
                                                    title="Alterar Data"
                                                    disabled={processingId === reservation.id}
                                                    className="w-10 h-10 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors disabled:opacity-50 ml-2"
                                                >
                                                    <Edit className="h-5 w-5" />
                                                </button>
                                            )}

                                            {/* Botão de Cancelar (para reservas confirmadas) */}
                                            {reservation.status === 'CONFIRMED' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(reservation.id, 'CANCELLED')}
                                                    disabled={processingId === reservation.id}
                                                    title="Cancelar Reserva"
                                                    className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors disabled:opacity-50"
                                                >
                                                    {processingId === reservation.id ? <Spinner size="sm" /> : <XCircle className="h-5 w-5" />}
                                                </button>
                                            )}

                                            {/* Botão de Excluir */}
                                            <button
                                                onClick={() => handleDelete(reservation.id, reservation.customerName)}
                                                disabled={processingId === reservation.id}
                                                title="Apagar permanentemente"
                                                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors disabled:opacity-50 ml-2"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {reservation.notes && (
                                    <div className="mt-3 ml-16 text-sm bg-yellow-50 text-[#8a5c3f] p-3 rounded-lg border border-yellow-100 flex items-start gap-2">
                                        <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-yellow-600" />
                                        <span><span className="font-semibold text-yellow-700">Observação:</span> {reservation.notes}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
            {/* ==========================================
                EVENTO FECHADO - Gerenciar Datas
                ========================================== */}
            <div className="mt-12">
                <div className="flex items-center gap-3 mb-6">
                    <Ban className="h-6 w-6 text-red-500" />
                    <div>
                        <h2 className="text-xl font-serif font-bold text-[#2a2a2a]">Evento Fechado</h2>
                        <p className="text-sm text-[#8a5c3f]">Marque datas em que o beach club não abrirá ao público</p>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-6">
                        {/* Motivo */}
                        <div className="mb-6">
                            <label className="text-sm font-medium text-[#2a2a2a] mb-1 block">Motivo do fechamento</label>
                            <input
                                type="text"
                                value={closedReason}
                                onChange={e => setClosedReason(e.target.value)}
                                className="w-full max-w-sm px-4 py-2 rounded-xl border border-[#e0d5c7] text-sm focus:ring-2 focus:ring-[#d4a574] focus:border-[#d4a574] bg-white"
                                placeholder="Evento Fechado"
                            />
                        </div>

                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4 max-w-sm">
                            <button
                                onClick={() => setClosedMonth(new Date(closedMonth.getFullYear(), closedMonth.getMonth() - 1, 1))}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-[#8a5c3f]"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="font-semibold text-[#2a2a2a]">
                                {MONTHS[closedMonth.getMonth()]} {closedMonth.getFullYear()}
                            </span>
                            <button
                                onClick={() => setClosedMonth(new Date(closedMonth.getFullYear(), closedMonth.getMonth() + 1, 1))}
                                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-[#8a5c3f]"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="max-w-sm">
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {WEEKDAYS.map(d => (
                                    <div key={d} className="text-center text-xs font-medium text-[#8a5c3f] py-1">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {getClosedMonthDays().map((date, idx) => {
                                    if (!date) return <div key={idx} />
                                    const dateStr = date.toISOString().split('T')[0]
                                    const isClosed = isDateClosed(dateStr)
                                    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => !isPast && !closedLoading && toggleClosedDate(dateStr)}
                                            disabled={isPast || closedLoading}
                                            className={`
                                                aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all
                                                ${isClosed
                                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                                    : isPast
                                                        ? 'text-gray-300 cursor-not-allowed'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                }
                                            `}
                                            title={isClosed ? 'Clique para reabrir' : 'Clique para fechar'}
                                        >
                                            {date.getDate()}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Lista de datas fechadas */}
                        {closedDates.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-[#e0d5c7]">
                                <h3 className="text-sm font-semibold text-[#2a2a2a] mb-3">Datas marcadas como fechadas:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {closedDates.map(cd => {
                                        const d = new Date(cd.date)
                                        return (
                                            <span
                                                key={cd.id}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-sm border border-red-200"
                                            >
                                                {d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                <span className="text-xs text-red-500">({cd.reason})</span>
                                                <button
                                                    onClick={() => toggleClosedDate(cd.date.split('T')[0])}
                                                    className="hover:text-red-900"
                                                    title="Remover"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </span>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal Editar */}
            {editingReservation && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-[#2a2a2a] mb-2">Alterar Data</h3>
                        <p className="text-[#8a5c3f] text-sm mb-6">
                            Remarcando reserva de <span className="font-semibold">{editingReservation.customerName}</span><br />
                            Actual: {formatDateUTC(editingReservation.checkIn)}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#2a2a2a] mb-1">Nova Data</label>
                                <input
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-[#e0d5c7] focus:ring-2 focus:ring-[#d4a574] focus:border-[#d4a574]"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setEditingReservation(null)}
                                    disabled={editLoading}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleSaveDate}
                                    isLoading={editLoading}
                                >
                                    Salvar Alteração
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
