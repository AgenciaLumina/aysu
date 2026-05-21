import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/lib/types'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const DEFAULT_TO_EMAIL = 'Aysubeachlounge@gmail.com'
const DEFAULT_FROM_EMAIL = 'Aysu Beach Lounge <contato@aysubeachlounge.com.br>'

interface ContactPayload {
    source?: string
    name?: string
    email?: string
    phone?: string
    eventType?: string
    eventDate?: string
    guestCount?: string
    message?: string
}

const eventTypeLabels: Record<string, string> = {
    casamento: 'Casamento',
    '15anos': 'Festa de 15 Anos',
    corporativo: 'Evento Corporativo',
    miniwedding: 'Miniwedding',
    aniversario: 'Aniversário',
    outro: 'Outro',
}

function cleanText(value: unknown, maxLength = 1000): string {
    if (typeof value !== 'string') return ''
    return value.trim().slice(0, maxLength)
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function formatOptional(value: string): string {
    return value || 'Não informado'
}

function buildEmailContent(payload: Required<ContactPayload>) {
    const eventType = eventTypeLabels[payload.eventType] || payload.eventType || 'Não informado'
    const rows = [
        ['Origem', payload.source === 'event_quote' ? 'Formulário Faça seu Evento' : payload.source],
        ['Nome', payload.name],
        ['E-mail', payload.email],
        ['Telefone', payload.phone],
        ['Tipo de evento', eventType],
        ['Data prevista', formatOptional(payload.eventDate)],
        ['Número de convidados', formatOptional(payload.guestCount)],
        ['Mensagem', formatOptional(payload.message)],
    ]

    const htmlRows = rows.map(([label, value]) => `
        <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #eadfce;color:#8a5c3f;font-weight:700;width:190px;">${escapeHtml(label)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eadfce;color:#2a2a2a;">${escapeHtml(value).replaceAll('\n', '<br />')}</td>
        </tr>
    `).join('')

    const text = rows
        .map(([label, value]) => `${label}: ${value}`)
        .join('\n')

    const html = `
        <div style="font-family:Arial,sans-serif;background:#fdfbf8;padding:24px;color:#2a2a2a;">
            <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #eadfce;border-radius:14px;overflow:hidden;">
                <div style="background:#2a2a2a;color:#ffffff;padding:22px 24px;">
                    <p style="margin:0 0 6px 0;color:#d4a574;text-transform:uppercase;letter-spacing:2px;font-size:12px;">Aysú Beach Lounge</p>
                    <h1 style="margin:0;font-size:24px;line-height:1.25;">Nova solicitação pelo site</h1>
                </div>
                <table style="width:100%;border-collapse:collapse;">
                    <tbody>${htmlRows}</tbody>
                </table>
            </div>
        </div>
    `

    return { html, text }
}

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.RESEND_API_KEY
        if (!apiKey) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Serviço de e-mail não configurado' },
                { status: 503 }
            )
        }

        const body = await request.json() as ContactPayload
        const payload: Required<ContactPayload> = {
            source: cleanText(body.source, 80) || 'site_contact',
            name: cleanText(body.name, 120),
            email: cleanText(body.email, 160).toLowerCase(),
            phone: cleanText(body.phone, 40),
            eventType: cleanText(body.eventType, 80),
            eventDate: cleanText(body.eventDate, 40),
            guestCount: cleanText(body.guestCount, 20),
            message: cleanText(body.message, 3000),
        }

        if (!payload.name || !payload.email || !payload.phone) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Nome, e-mail e telefone são obrigatórios' },
                { status: 400 }
            )
        }

        if (!isValidEmail(payload.email)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'E-mail inválido' },
                { status: 400 }
            )
        }

        if (payload.source === 'event_quote' && !payload.eventType) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Tipo de evento é obrigatório' },
                { status: 400 }
            )
        }

        const { html, text } = buildEmailContent(payload)
        const toEmail = process.env.CONTACT_TO_EMAIL || DEFAULT_TO_EMAIL
        const fromEmail = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL

        const response = await fetch(RESEND_ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [toEmail],
                reply_to: payload.email,
                subject: `Nova solicitação de evento - ${payload.name}`,
                html,
                text,
            }),
        })

        if (!response.ok) {
            const errorPayload = await response.json().catch(() => null)
            console.error('[Contact Email Error]', errorPayload)
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Não foi possível enviar o e-mail agora' },
                { status: 502 }
            )
        }

        const result = await response.json().catch(() => null)

        return NextResponse.json<ApiResponse>({
            success: true,
            data: result,
            message: 'Solicitação enviada com sucesso',
        })
    } catch (error) {
        console.error('[Contact POST Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao enviar solicitação' },
            { status: 500 }
        )
    }
}
