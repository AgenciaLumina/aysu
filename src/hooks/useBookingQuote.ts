'use client'

import { useEffect, useState } from 'react'
import type { BookingQuote } from '@/lib/reservation-commercial'

export function useBookingQuote(cabinId: string | null, date: string | null, participants: number) {
    const [revision, setRevision] = useState(0)
    const key = cabinId && date ? `${cabinId}:${date}:${participants}:${revision}` : null
    const [result, setResult] = useState<{ key: string; quote?: BookingQuote; error?: string } | null>(null)
    useEffect(() => {
        if (!key || !cabinId || !date) return
        const controller = new AbortController()
        const params = new URLSearchParams({ cabinId, date, participants: String(participants) })
        fetch(`/api/reservations/quote?${params}`, { signal: controller.signal, cache: 'no-store' })
            .then(async response => {
                const data = await response.json()
                if (!controller.signal.aborted) setResult(data.success ? { key, quote: data.data } : { key, error: data.error || 'Não foi possível consultar esta reserva.' })
            })
            .catch(() => { if (!controller.signal.aborted) setResult({ key, error: 'Falha ao consultar a reserva. Tente novamente.' }) })
        return () => controller.abort()
    }, [key, cabinId, date, participants])
    const current = result?.key === key ? result : null
    return { quote: current?.quote ?? null, error: current?.error ?? null, loading: Boolean(key && !current), reload: () => setRevision(value => value + 1) }
}
