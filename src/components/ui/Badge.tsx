// AISSU Beach Lounge - Badge Component
// Badge para exibir status e tags

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#d4a574] focus:ring-offset-2',
    {
        variants: {
            variant: {
                // Default: nude
                default: 'border-transparent bg-[#f1c595] text-[#8a5c3f]',
                // Secundário
                secondary: 'border-[#e0d5c7] bg-[#fdfbf8] text-[#8a5c3f]',
                // Outline
                outline: 'border-[#d4a574] text-[#8a5c3f]',
                // Status
                success: 'border-transparent bg-green-100 text-green-700',
                warning: 'border-transparent bg-amber-100 text-amber-700',
                error: 'border-transparent bg-red-100 text-red-700',
                info: 'border-transparent bg-blue-100 text-blue-700',
                // Reserva Status
                pending: 'border-transparent bg-amber-100 text-amber-700',
                confirmed: 'border-transparent bg-green-100 text-green-700',
                checkedIn: 'border-transparent bg-blue-100 text-blue-700',
                inProgress: 'border-transparent bg-purple-100 text-purple-700',
                completed: 'border-transparent bg-gray-100 text-gray-700',
                cancelled: 'border-transparent bg-red-100 text-red-700',
                noShow: 'border-transparent bg-orange-100 text-orange-700',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

// Helper para mapear status de reserva para variant
export function getReservationStatusVariant(status: string): BadgeProps['variant'] {
    const map: Record<string, BadgeProps['variant']> = {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        CHECKED_IN: 'checkedIn',
        IN_PROGRESS: 'inProgress',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
        NO_SHOW: 'noShow',
        pending: 'pending',
        confirmed: 'confirmed',
        checked_in: 'checkedIn',
        checked_out: 'completed',
        cancelled: 'cancelled',
        no_show: 'noShow',
    }
    return map[status] || 'default'
}

// Helper para traduzir status
export function getReservationStatusLabel(status: string): string {
    const map: Record<string, string> = {
        PENDING: 'Pendente',
        CONFIRMED: 'Confirmada',
        CHECKED_IN: 'Check-in',
        IN_PROGRESS: 'Em Andamento',
        COMPLETED: 'Concluída',
        CANCELLED: 'Cancelada',
        NO_SHOW: 'Não Compareceu',
        pending: 'Pendente',
        confirmed: 'Confirmada',
        checked_in: 'Check-in',
        checked_out: 'Concluída',
        cancelled: 'Cancelada',
        no_show: 'Não Compareceu',
    }
    return map[status] || status
}

export { Badge, badgeVariants }
