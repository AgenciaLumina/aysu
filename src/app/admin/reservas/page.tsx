// AISSU Beach Lounge - Admin Reservas (Refatorado)
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Users, Search, Plus } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, getReservationStatusVariant, getReservationStatusLabel } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'

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

    useEffect(() => {
        async function fetchReservations() {
            try {
                const res = await fetch('/api/reservations')
                const data = await res.json()
                if (data.success) setReservations(data.data)
            } catch (error) {
                console.error('Erro:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchReservations()
    }, [])

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
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#f1c595]/30 flex items-center justify-center">
                                            <Users className="h-6 w-6 text-[#d4a574]" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[#2a2a2a]">{reservation.customerName}</h3>
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
                                        <p className="font-bold text-[#d4a574]">{formatCurrency(reservation.totalPrice)}</p>
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
