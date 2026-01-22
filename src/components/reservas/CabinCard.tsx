// AISSU Beach Lounge - Cabin Card with Calendar
'use client'

import { useState } from 'react'
import { Users, DollarSign, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CalendarAvailability } from './CalendarAvailability'
import { formatCurrency } from '@/lib/utils'

export interface CabinType {
    id: string
    level: number
    name: string
    emoji: string
    units: number
    capacity: string
    price: number
    consumable: number
    description: string
    highlights: string[]
}

interface CabinCardProps {
    cabin: CabinType
    onReserve?: (cabinId: string, date: string) => void
}

export function CabinCard({ cabin, onReserve }: CabinCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [selectedDate, setSelectedDate] = useState<string>()

    const handleDateSelect = (date: string) => {
        setSelectedDate(date)
    }

    const handleReserve = () => {
        if (selectedDate) {
            onReserve?.(cabin.id, selectedDate)
        }
    }

    const levelColors = {
        1: 'from-yellow-400 to-yellow-500',
        2: 'from-orange-400 to-orange-500',
        3: 'from-red-500 to-red-600',
        4: 'from-pink-400 to-pink-500',
    }

    return (
        <div className="bg-white rounded-2xl border border-[#e0d5c7] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className={`bg-gradient-to-r ${levelColors[cabin.level as keyof typeof levelColors] || 'from-[#d4a574] to-[#bc8e5e]'} p-4 text-white`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{cabin.emoji}</span>
                        <div>
                            <h3 className="font-serif text-xl font-bold">{cabin.name}</h3>
                            <p className="text-white/80 text-sm">{cabin.units} unidades disponíveis</p>
                        </div>
                    </div>
                    <Badge className="bg-white/20 text-white border-0">Nível {cabin.level}</Badge>
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-[#8a5c3f]">
                        <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{cabin.capacity}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-[#d4a574]">{formatCurrency(cabin.price)}</p>
                        <p className="text-xs text-[#8a5c3f]">{formatCurrency(cabin.consumable)} consumíveis</p>
                    </div>
                </div>

                <p className="text-sm text-[#8a5c3f] mb-3">{cabin.description}</p>

                {/* Highlights */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {cabin.highlights.map((h, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            {h}
                        </Badge>
                    ))}
                </div>

                {/* Expand Calendar */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[#d4a574] hover:bg-[#f1c595]/10 rounded-lg transition-colors"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="h-4 w-4" />
                            Fechar calendário
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-4 w-4" />
                            Ver disponibilidade
                        </>
                    )}
                </button>
            </div>

            {/* Calendar (expandable) */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-[#e0d5c7] pt-4">
                    <CalendarAvailability
                        cabinId={cabin.id}
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                    />

                    {selectedDate && (
                        <div className="mt-4">
                            <Button className="w-full" size="lg" onClick={handleReserve}>
                                Reservar para {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
