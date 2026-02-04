import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-[#5a4c40] mb-1.5">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={twMerge(
                        clsx(
                            "flex min-h-[80px] w-full rounded-xl border border-[#e0d5c7] bg-white px-4 py-3 text-sm ring-offset-white placeholder:text-[#8a5c3f]/50 focus:outline-none focus:ring-2 focus:ring-[#d4a574] focus:border-[#d4a574] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 text-[#2a2a2a]",
                            error && "border-red-500 focus:ring-red-500",
                            className
                        )
                    )}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-xs text-red-500">{error}</p>
                )}
            </div>
        )
    }
)

Textarea.displayName = 'Textarea'
