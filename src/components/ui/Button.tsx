// AISSU Beach Lounge - Button Component
// Componente de botão com variantes estilizadas

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
    // Base styles
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                // Primário: nude claro
                default:
                    'bg-[#d4a574] text-white hover:bg-[#bc8e5e] focus-visible:ring-[#d4a574] shadow-md hover:shadow-lg active:scale-[0.98]',
                // Secundário: borda nude
                secondary:
                    'border-2 border-[#d4a574] bg-transparent text-[#8a5c3f] hover:bg-[#f1c595]/20 focus-visible:ring-[#d4a574]',
                // Outline: borda mais suave
                outline:
                    'border border-[#e0d5c7] bg-transparent text-[#8a5c3f] hover:bg-[#fdfbf8] hover:border-[#d4a574] focus-visible:ring-[#d4a574]',
                // Ghost: sem borda
                ghost:
                    'text-[#8a5c3f] hover:bg-[#f1c595]/20 focus-visible:ring-[#d4a574]',
                // Destrutivo
                destructive:
                    'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500',
                // Link
                link:
                    'text-[#bc8e5e] underline-offset-4 hover:underline focus-visible:ring-[#d4a574]',
            },
            size: {
                sm: 'h-9 px-3 text-xs',
                md: 'h-11 px-5 text-sm',
                lg: 'h-12 px-8 text-base',
                xl: 'h-14 px-10 text-lg',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
    isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button'
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span>Carregando...</span>
                    </>
                ) : (
                    children
                )}
            </Comp>
        )
    }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
