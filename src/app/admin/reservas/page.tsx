// AISSU Beach Lounge - Admin Reservas
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Users, Search, Plus, Check, X } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, getReservationStatusVariant, getReservationStatusLabel } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Reservation {
    id: string
    customerName: string
    customerEmail: string
    checkIn: string
    checkOut: string
    status: string
    totalPrice: number
    cabin: { name: string }
}

export default function AdminReservasPage() {
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [processingId, setProcessingId] = useState<string | null>(null)

    const fetchReservations = async () => {
        try {
            const res = await fetch('/api/reservations')
            const data = await res.json()
            if (data.success) setReservations(data.data)
        } catch (error) {
            console.error('Erro:', error)
            toast.error('Erro ao carregar reservas')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReservations()
    }, [])

    const handleStatusUpdate = async (id: string, newStatus: 'CONFIRMED' | 'CANCELLED') => {
        if (!confirm(`Tem certeza que deseja ${newStatus === 'CONFIRMED' ? 'APROVAR' : 'REJEITAR'} esta reserva?`)) return

        setProcessingId(id)
        try {
            const res = await fetch(`/api/reservations/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
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

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-serif font-bold text-[#2a2a2a]">Reservas</h1>
                    <p className="text-[#8a5c3f]">Gerencie todas as reservas do beach club</p>
                </div>
                <Link href="/admin/frente-de-caixa/nova">
                    <Button>
                        <Plus className="h-4 w-4" />
                        Nova Reserva
                    </Button>
                </Link>
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
            ) : filtered.length === 0 ? (
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
                        {filtered.map(reservation => (
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
                                                {formatDate(reservation.checkIn)} {formatTime(reservation.checkIn)}
                                            </p>
                                            <p className="font-bold text-[#d4a574]">{formatCurrency(reservation.totalPrice)}</p>
                                        </div>

                                        {/* Actions (Only for PENDING) */}
                                        {reservation.status === 'PENDING' && (
                                            <div className="flex items-center gap-2">
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
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </AdminLayout>
    )
}
