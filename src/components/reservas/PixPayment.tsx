'use client'

import { Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'

// Existing approved payment destination. Render only after a persisted active hold.
const PIX_KEY = '57.505.585/0001-19'

export function PixPayment() {
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(PIX_KEY)
            toast.success('Chave Pix copiada!')
        } catch { toast.error('Não foi possível copiar. Selecione a chave acima e copie manualmente.') }
    }
    return <section aria-label="Pagamento via Pix" className="mb-6 rounded-xl border border-[#e0d5c7] bg-white p-6 text-center">
        <h2 className="font-serif text-2xl font-semibold text-[#2a2a2a]">Pagamento via Pix</h2>
        <p className="mt-4 text-sm text-[#8a5c3f]">Chave Pix (CNPJ)</p>
        <p className="my-3 select-all break-all text-2xl font-bold text-[#2a2a2a]">{PIX_KEY}</p>
        <Button type="button" variant="secondary" onClick={copy}><Copy className="h-4 w-4" />Copiar chave Pix</Button>
        <p className="mt-5 text-sm text-[#5c3d2e]">Itaú · Aysú Beach Lounge</p>
        <p className="mt-4 text-sm text-[#5c3d2e]">Depois do pagamento, envie o comprovante pelo botão abaixo. A confirmação depende da validação da equipe.</p>
    </section>
}
