'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/admin/dashboard'

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao fazer login')
            }

            // Salvar token no cookie (válido por 24h)
            const maxAge = 60 * 60 * 24 // 24h
            document.cookie = `admin_token=${data.data.token}; path=/; max-age=${maxAge}; SameSite=Lax`

            // Redireciona
            router.push(callbackUrl)
            router.refresh()

        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm font-medium text-[#2a2a2a] ml-1">Email Corporativo</label>
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#a09080]" />
                    <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 bg-[#faf8f5] border border-[#e0d5c7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30 transition-all text-[#2a2a2a]"
                        placeholder="admin@aysu.com.br"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-[#2a2a2a] ml-1">Senha de Acesso</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#a09080]" />
                    <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 bg-[#faf8f5] border border-[#e0d5c7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30 transition-all text-[#2a2a2a]"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Entrando...
                    </>
                ) : (
                    <>
                        Acessar Painel
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                )}
            </Button>
        </form>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-[#fdfbf8] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#e0d5c7] overflow-hidden">
                {/* Header */}
                <div className="bg-[#2a2a2a] p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-32 h-32 bg-[#d4a574]/10 rounded-full blur-2xl" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-1 shadow-lg mb-4">
                            <Image
                                src="/logo_aysu.png"
                                alt="Aysú"
                                width={64}
                                height={64}
                                className="rounded-full"
                            />
                        </div>
                        <h1 className="font-serif text-2xl text-white font-medium">Aysú Admin</h1>
                        <p className="text-white/60 text-sm mt-1">Acesso Restrito</p>
                    </div>
                </div>

                {/* Form */}
                <div className="p-8">
                    <Suspense fallback={
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-[#d4a574]" />
                        </div>
                    }>
                        <LoginForm />
                    </Suspense>
                </div>

                {/* Footer */}
                <div className="bg-[#faf8f5] p-4 text-center border-t border-[#e0d5c7]">
                    <p className="text-xs text-[#a09080]">
                        &copy; 2026 Aysú Beach Lounge. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </div>
    )
}
