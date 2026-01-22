// AISSU Beach Lounge - Spinner Component
// Loading spinner animado

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
    xl: 'h-12 w-12 border-4',
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
    ({ className, size = 'md', ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                'animate-spin rounded-full border-[#d4a574] border-t-transparent',
                sizeClasses[size],
                className
            )}
            {...props}
        />
    )
)
Spinner.displayName = 'Spinner'

// Loading overlay para páginas/seções
interface LoadingOverlayProps {
    message?: string
    fullScreen?: boolean
}

function LoadingOverlay({ message = 'Carregando...', fullScreen = false }: LoadingOverlayProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm',
                fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0 rounded-xl'
            )}
        >
            <Spinner size="lg" />
            <p className="text-sm text-[#8a5c3f] font-medium">{message}</p>
        </div>
    )
}

// Skeleton para loading de conteúdo
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-[#f1c595]/30',
                className
            )}
            {...props}
        />
    )
}

export { Spinner, LoadingOverlay, Skeleton }
