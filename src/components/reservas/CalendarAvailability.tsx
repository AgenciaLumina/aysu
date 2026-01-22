// AISSU Beach Lounge - Calendar Availability Component
'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { isHoliday, getHolidayName } from '@/lib/holidays'
import { cn } from '@/lib/utils'

interface CalendarAvailabilityProps {
    cabinId: string
    onDateSelect?: (date: string) => void
    selectedDate?: string
}

interface DayAvailability {
    date: string
    status: 'available' | 'partial' | 'full' | 'past'
    availableUnits: number
    totalUnits: number
}

export function CalendarAvailability({ cabinId, onDateSelect, selectedDate }: CalendarAvailabilityProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [availability, setAvailability] = useState<Record<string, DayAvailability>>({})
    const [loading, setLoading] = useState(false)

    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // Gera dias do mês
    const days = useMemo(() => {
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startDayOfWeek = firstDay.getDay()

        const result: (Date | null)[] = []

        // Dias vazios antes do primeiro dia
        for (let i = 0; i < startDayOfWeek; i++) {
            result.push(null)
        }

        // Dias do mês
        for (let i = 1; i <= daysInMonth; i++) {
            result.push(new Date(year, month, i))
        }

        return result
    }, [year, month])

    // Busca disponibilidade do mês
    useEffect(() => {
        async function fetchAvailability() {
            setLoading(true)
            try {
                // Simula disponibilidade (em produção, buscar da API)
                const data: Record<string, DayAvailability> = {}
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                days.forEach(day => {
                    if (!day) return
                    const dateStr = day.toISOString().split('T')[0]
                    const isPast = day < today

                    // Simula ocupação aleatória para demo
                    const random = Math.random()
                    const totalUnits = 6
                    const availableUnits = isPast ? 0 : Math.floor(random * (totalUnits + 1))

                    data[dateStr] = {
                        date: dateStr,
                        status: isPast ? 'past' : availableUnits === 0 ? 'full' : availableUnits <= 2 ? 'partial' : 'available',
                        availableUnits,
                        totalUnits,
                    }
                })

                setAvailability(data)
            } catch (error) {
                console.error('Erro ao buscar disponibilidade:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchAvailability()
    }, [days, cabinId])

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

    const monthName = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-500 text-white hover:bg-green-600'
            case 'partial': return 'bg-yellow-500 text-white hover:bg-yellow-600'
            case 'full': return 'bg-red-400 text-white cursor-not-allowed'
            case 'past': return 'bg-gray-200 text-gray-400 cursor-not-allowed'
            default: return 'bg-gray-100'
        }
    }

    return (
        <div className="bg-white rounded-xl border border-[#e0d5c7] p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1 hover:bg-[#f1c595]/20 rounded">
                    <ChevronLeft className="h-5 w-5 text-[#8a5c3f]" />
                </button>
                <h3 className="font-medium text-[#2a2a2a] capitalize">{monthName}</h3>
                <button onClick={nextMonth} className="p-1 hover:bg-[#f1c595]/20 rounded">
                    <ChevronRight className="h-5 w-5 text-[#8a5c3f]" />
                </button>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="text-center text-xs text-[#8a5c3f] font-medium py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                    if (!day) {
                        return <div key={`empty-${index}`} className="aspect-square" />
                    }

                    const dateStr = day.toISOString().split('T')[0]
                    const dayData = availability[dateStr]
                    const holiday = isHoliday(dateStr)
                    const holidayName = getHolidayName(dateStr)
                    const isSelected = selectedDate === dateStr
                    const isClickable = dayData?.status === 'available' || dayData?.status === 'partial'

                    return (
                        <button
                            key={dateStr}
                            onClick={() => isClickable && onDateSelect?.(dateStr)}
                            disabled={!isClickable}
                            title={holidayName || `${dayData?.availableUnits || 0} vagas`}
                            className={cn(
                                'aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative transition-all',
                                dayData ? getStatusColor(dayData.status) : 'bg-gray-100',
                                isSelected && 'ring-2 ring-[#d4a574] ring-offset-2',
                                holiday && 'ring-2 ring-amber-400'
                            )}
                        >
                            <span className="font-medium">{day.getDate()}</span>
                            {holiday && (
                                <Star className="h-3 w-3 text-amber-300 absolute top-0.5 right-0.5" fill="currentColor" />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[#8a5c3f]">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500" />
                    <span>Disponível</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-500" />
                    <span>Poucas</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-400" />
                    <span>Lotado</span>
                </div>
                <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-400" fill="currentColor" />
                    <span>Feriado</span>
                </div>
            </div>
        </div>
    )
}
