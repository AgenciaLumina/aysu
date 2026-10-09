'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { BookingQuote } from '@/lib/reservation-commercial'
import { parseBookingAvailability, type BookingAvailability } from '@/lib/booking-selection'

interface QuoteResult {
    quote?: BookingQuote
    error?: string
    availability: BookingAvailability | null
}

export async function requestBookingQuote(cabinId: string, date: string, participants: number, signal: AbortSignal): Promise<QuoteResult> {
    const params = new URLSearchParams({ cabinId, date, participants: String(participants) })
    const response = await fetch(`/api/reservations/quote?${params}`, { signal, cache: 'no-store' })
    const data = await response.json() as { success: boolean; data?: BookingQuote; error?: string; availability?: BookingAvailability }
    if (data.success && data.data) return { quote: data.data, availability: parseBookingAvailability(data.data) }
    let availability = parseBookingAvailability(data.availability)
    // A changed group maximum can reject this quantity before stock is calculated.
    // Recover selector bounds with a read-only one-person quote, never its price.
    if (!availability && participants > 1 && response.status === 400) {
        const probe = new URLSearchParams({ cabinId, date, participants: '1' })
        const recovered = await fetch(`/api/reservations/quote?${probe}`, { signal, cache: 'no-store' })
        const bounds = await recovered.json() as { success: boolean; data?: BookingQuote; availability?: BookingAvailability }
        availability = parseBookingAvailability(bounds.success ? bounds.data : bounds.availability)
    }
    return { error: data.error || 'Não foi possível consultar esta reserva.', availability }
}

export function useBookingQuote(cabinId: string | null, date: string | null, participants: number) {
    const [revision, setRevision] = useState(0)
    const contextKey = cabinId && date ? `${cabinId}:${date}` : null
    const key = contextKey ? `${contextKey}:${participants}:${revision}` : null
    const [result, setResult] = useState<(QuoteResult & { key: string; contextKey: string }) | null>(null)
    const requestRef = useRef<AbortController | null>(null)
    // Cancel at commit time: an old refresh must not navigate while passive
    // effect cleanup is still waiting after a space/date/quantity change.
    useLayoutEffect(() => () => requestRef.current?.abort(), [key])
    useEffect(() => {
        if (!key || !contextKey || !cabinId || !date) return
        const controller = new AbortController()
        requestRef.current = controller
        requestBookingQuote(cabinId, date, participants, controller.signal)
            .then(data => { if (!controller.signal.aborted) setResult({ key, contextKey, ...data }) })
            .catch(() => { if (!controller.signal.aborted) setResult({ key, contextKey, error: 'Falha ao consultar a reserva. Tente novamente.', availability: null }) })
        return () => { controller.abort(); requestRef.current?.abort() }
    }, [key, contextKey, cabinId, date, participants])

    const refresh = async (): Promise<BookingQuote | null> => {
        if (!key || !contextKey || !cabinId || !date) return null
        requestRef.current?.abort()
        const controller = new AbortController()
        requestRef.current = controller
        // Keep the last stock snapshot for the selector, but never submit its old quote.
        setResult(previous => previous?.contextKey === contextKey ? { ...previous, key: `refreshing:${key}`, quote: undefined, error: undefined } : null)
        try {
            const data = await requestBookingQuote(cabinId, date, participants, controller.signal)
            if (controller.signal.aborted) return null
            setResult({ key, contextKey, ...data })
            return data.quote ?? null
        } catch {
            if (!controller.signal.aborted) setResult({ key, contextKey, error: 'Falha ao consultar a reserva. Tente novamente.', availability: null })
            return null
        }
    }
    const current = result?.key === key ? result : null
    const availability = result?.contextKey === contextKey ? result?.availability ?? null : null
    return { quote: current?.quote ?? null, error: current?.error ?? null, availability, loading: Boolean(key && !current), reload: () => setRevision(value => value + 1), refresh }
}
