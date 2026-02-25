'use client'

// DayInfoModal — exibe informações de uma data especial/bloqueada do calendário
// Acionado quando o usuário clica em datas EVENT, PRIVATE_EVENT ou BLOCKED

import { useEffect } from 'react'
import { X, Lock, Sparkles, Ban, Ticket, CalendarDays } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { DayConfigPayload, TicketLot } from '@/lib/day-config'

// ============================================================
// TIPOS
// ============================================================

interface DayInfoModalProps {
    isOpen: boolean
    onClose: () => void
    config: DayConfigPayload | null
    closedReason?: string
    isPrivate: boolean
    isClosed: boolean
    date: Date
    onReserve?: () => void
}

// ============================================================
// HELPERS
// ============================================================

function formatDateFull(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    })
}

function getActiveLot(lots: TicketLot[]): TicketLot | null {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    return (
        lots.find((lot) => {
            if (lot.soldOut) return false
            const endsAt = new Date(`${lot.endsAt}T23:59:59Z`)
            return endsAt >= today
        }) ?? null
    )
}

// ============================================================
// BADGE DE STATUS
// ============================================================

function StatusBadge({ isPrivate, isClosed, status }: { isPrivate: boolean; isClosed: boolean; status?: string }) {
    if (isPrivate) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-800 text-white">
                <Lock className="h-3.5 w-3.5" />
                Evento Privado
            </span>
        )
    }
    if (isClosed && status !== 'EVENT') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                <Ban className="h-3.5 w-3.5" />
                Data Fechada
            </span>
        )
    }
    return (
        <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'var(--aissu-nude-light)', color: 'var(--aissu-chocolate)' }}
        >
            <Sparkles className="h-3.5 w-3.5" />
            Evento Especial
        </span>
    )
}

// ============================================================
// CARD DE LOTE
// ============================================================

function LotCard({ lot, isActive }: { lot: TicketLot; isActive: boolean }) {
    const endsAt = new Date(`${lot.endsAt}T12:00:00`)
    const endsLabel = endsAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

    return (
        <div
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                lot.soldOut
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : isActive
                      ? 'bg-white border-[#d4a574] shadow-sm'
                      : 'bg-gray-50 border-gray-200'
            }`}
        >
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#2a2a2a] truncate">{lot.name}</p>
                    {isActive && !lot.soldOut && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 shrink-0">
                            Disponível
                        </span>
                    )}
                </div>
                <p className="text-xs text-[#8a5c3f] mt-0.5">até {endsLabel}</p>
            </div>
            <div className="text-right shrink-0 ml-4">
                {lot.soldOut ? (
                    <p className="text-sm font-bold text-red-500">Esgotado</p>
                ) : (
                    <>
                        <p className="text-sm font-bold text-[#2a2a2a]">{formatCurrency(lot.price)}</p>
                        {lot.consumable !== undefined && (
                            <p className="text-xs text-[#8a5c3f]">{formatCurrency(lot.consumable)} consumação</p>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function DayInfoModal({
    isOpen,
    onClose,
    config,
    closedReason,
    isPrivate,
    isClosed,
    date,
    onReserve,
}: DayInfoModalProps) {
    // Bloquear scroll do body quando modal aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    // Fechar com Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen) window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const title = config?.title || closedReason || 'Data Indisponível'
    const release = config?.release
    const flyerUrl = config?.flyerImageUrl
    const lots = config?.ticketLots ?? []
    const activeLot = getActiveLot(lots)
    const canReserve = !isClosed && !isPrivate && typeof onReserve === 'function'

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Painel — bottom sheet mobile, modal centralizado desktop */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="fixed z-50 inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center md:p-4"
            >
                <div
                    className="relative w-full md:max-w-lg md:w-full bg-white rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden
                                flex flex-col max-h-[92dvh] md:max-h-[90vh]"
                    style={{ animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)' }}
                >
                    {/* Drag handle (mobile) */}
                    <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
                        <div className="w-10 h-1 rounded-full bg-gray-200" />
                    </div>

                    {/* Header */}
                    <div className="flex items-start justify-between px-5 pt-3 pb-4 shrink-0">
                        <div className="flex flex-col gap-2">
                            <StatusBadge
                                isPrivate={isPrivate}
                                isClosed={isClosed}
                                status={config?.status}
                            />
                            <div className="flex items-center gap-1.5 text-xs text-[#8a5c3f]">
                                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                <span className="capitalize">{formatDateFull(date)}</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 ml-2 shrink-0"
                            aria-label="Fechar"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Scroll area */}
                    <div className="overflow-y-auto flex-1 pb-4">
                        {/* Flyer */}
                        {flyerUrl && (
                            <div className="px-5 mb-5">
                                <div
                                    className="w-full rounded-2xl overflow-hidden bg-gray-100"
                                    style={{ aspectRatio: '9 / 14' }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={flyerUrl}
                                        alt={`Flyer — ${title}`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Título + release */}
                        <div className="px-5 mb-5">
                            <h2
                                className="text-2xl font-semibold text-[#2a2a2a] leading-snug mb-3"
                                style={{ fontFamily: 'var(--font-display)' }}
                            >
                                {title}
                            </h2>
                            {release && (
                                <p className="text-sm leading-relaxed text-[#5C3D2E] whitespace-pre-line">{release}</p>
                            )}
                        </div>

                        {/* Lotes */}
                        {lots.length > 0 && (
                            <div className="px-5 mb-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <Ticket className="h-4 w-4 text-[#d4a574]" />
                                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8a5c3f]">
                                        Ingressos / Couvert
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {lots.map((lot) => (
                                        <LotCard
                                            key={`${lot.name}-${lot.endsAt}`}
                                            lot={lot}
                                            isActive={activeLot?.name === lot.name && activeLot?.endsAt === lot.endsAt}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer fixo */}
                    <div className="shrink-0 border-t border-[#e0d5c7] bg-white">
                        {canReserve ? (
                            <div className="p-4">
                                <button
                                    onClick={onReserve}
                                    className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95"
                                    style={{ background: 'var(--aissu-chocolate)' }}
                                >
                                    Reservar para esta data →
                                </button>
                            </div>
                        ) : (
                            <div className="px-5 py-4 flex items-start gap-3 bg-gray-50">
                                {isPrivate ? (
                                    <Lock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                                ) : (
                                    <Ban className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                                )}
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {isPrivate
                                        ? 'Este dia está reservado para um evento privado. Não haverá abertura ao público.'
                                        : closedReason
                                          ? `${closedReason} — não haverá abertura ao público nesta data.`
                                          : 'Esta data não está disponível para reservas ao público.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Animação CSS (injeta apenas uma vez) */}
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @media (min-width: 768px) {
                    @keyframes slideUp {
                        from { transform: scale(0.95); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                }
            `}</style>
        </>
    )
}
