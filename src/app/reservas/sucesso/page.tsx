// AISSU Beach Lounge - Página de Sucesso da Reserva
import Link from 'next/link'
import { CheckCircle, Calendar, Mail, Waves } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function ReservaSucessoPage() {
    return (
        <div className="min-h-screen bg-[#fdfbf8] flex items-center justify-center">
            <div className="text-center max-w-md px-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>

                <h1 className="font-serif text-3xl font-bold text-[#2a2a2a] mb-4">Reserva Confirmada!</h1>

                <p className="text-[#8a5c3f] mb-6">
                    Sua reserva foi confirmada com sucesso. Você receberá um email com
                    todos os detalhes e QR Code para check-in.
                </p>

                <div className="bg-white rounded-xl p-6 border border-[#e0d5c7] mb-6">
                    <div className="flex items-center justify-center gap-3 text-[#8a5c3f]">
                        <Mail className="h-5 w-5" />
                        <span>Verifique seu email</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Link href="/">
                        <Button className="w-full" size="lg">
                            <Waves className="h-5 w-5" />
                            Voltar ao início
                        </Button>
                    </Link>
                    <Link href="/reservas">
                        <Button variant="secondary" className="w-full" size="lg">
                            <Calendar className="h-5 w-5" />
                            Nova reserva
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
