// AISSU Beach Lounge - Payment Webhook API
// POST /api/payments/webhook

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyWebhookSignature, mapCardBrand, mapPaymentStatus } from '@/lib/rede-api'
import type { ApiResponse } from '@/lib/types'
import { PaymentStatus, ReservationStatus, CardBrand } from '@prisma/client'

export async function POST(request: NextRequest) {
    try {
        // Extrai assinatura do header
        const signature = request.headers.get('x-rede-signature')
        const body = await request.text()

        // Valida assinatura JWT (CRÍTICO!)
        if (!signature) {
            console.error('[Webhook] Signature header ausente')
            // Retorna 200 mesmo assim para não repetir
            return NextResponse.json<ApiResponse>({ success: true })
        }

        const webhookPayload = verifyWebhookSignature(body, signature)

        if (!webhookPayload) {
            console.error('[Webhook] Assinatura inválida')
            // Retorna 200 para não repetir (evita loop)
            return NextResponse.json<ApiResponse>({ success: true })
        }

        const { transaction } = webhookPayload

        // Idempotência: Busca pagamento por redeTransactionId
        const payment = await prisma.payment.findUnique({
            where: { redeTransactionId: transaction.id },
            include: { reservation: true },
        })

        if (!payment) {
            console.error('[Webhook] Pagamento não encontrado:', transaction.id)
            // Retorna 200 - não podemos processar
            return NextResponse.json<ApiResponse>({ success: true })
        }

        // Idempotência: Se já recebeu webhook, ignora
        if (payment.webhookReceived) {
            console.log('[Webhook] Já processado anteriormente:', transaction.id)
            return NextResponse.json<ApiResponse>({ success: true })
        }

        // Mapeia status
        const paymentStatus = mapPaymentStatus(transaction.status) as PaymentStatus
        const cardBrand = transaction.cardBrand
            ? mapCardBrand(transaction.cardBrand) as CardBrand
            : null

        // Atualiza pagamento com dados do webhook
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: paymentStatus,
                redeNsu: transaction.nsu || payment.redeNsu,
                redeAuthCode: transaction.authCode || payment.redeAuthCode,
                cardBrand: cardBrand,
                cardLastFour: transaction.cardLastFour || payment.cardLastFour,
                webhookReceived: true,
                webhookData: JSON.parse(body),
            },
        })

        // Se CAPTURED, confirma reserva
        if (paymentStatus === PaymentStatus.CAPTURED) {
            await prisma.reservation.update({
                where: { id: payment.reservationId },
                data: { status: ReservationStatus.CONFIRMED },
            })

            // TODO: Enviar email de confirmação
            // TODO: Enviar WhatsApp (opcional)
            console.log({
                action: 'RESERVATION_CONFIRMED_VIA_WEBHOOK',
                timestamp: new Date().toISOString(),
                reservationId: payment.reservationId,
                transactionId: transaction.id,
            })
        }

        // Se CANCELLED ou REFUNDED, cancela reserva
        if (paymentStatus === PaymentStatus.CANCELLED || paymentStatus === PaymentStatus.REFUNDED) {
            await prisma.reservation.update({
                where: { id: payment.reservationId },
                data: { status: ReservationStatus.CANCELLED },
            })

            console.log({
                action: 'RESERVATION_CANCELLED_VIA_WEBHOOK',
                timestamp: new Date().toISOString(),
                reservationId: payment.reservationId,
                transactionId: transaction.id,
                reason: paymentStatus,
            })
        }

        // Sempre retorna 200 (idempotente)
        return NextResponse.json<ApiResponse>({ success: true })
    } catch (error) {
        console.error('[Webhook Error]', error)
        // CRÍTICO: Sempre retornar 200 para evitar retry infinito
        return NextResponse.json<ApiResponse>({ success: true })
    }
}
