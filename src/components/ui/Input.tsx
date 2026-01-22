// AISSU Beach Lounge - Input Component
// Componente de input estilizado

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, hint, id, ...props }, ref) => {
        const inputId = id || React.useId()

        return (
            <div className="space-y-1.5">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-[#2a2a2a]"
                    >
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    id={inputId}
                    className={cn(
                        'flex h-11 w-full rounded-lg border border-[#e0d5c7] bg-white px-4 py-2 text-sm text-[#2a2a2a] placeholder:text-[#8a5c3f]/50',
                        'ring-offset-background transition-colors duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-[#d4a574] focus:ring-offset-2 focus:border-[#d4a574]',
                        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#fdfbf8]',
                        error && 'border-red-500 focus:ring-red-500',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {hint && !error && (
                    <p className="text-xs text-[#8a5c3f]/70">{hint}</p>
                )}
                {error && (
                    <p className="text-xs text-red-500">{error}</p>
                )}
            </div>
        )
    }
)
Input.displayName = 'Input'

export { Input }
