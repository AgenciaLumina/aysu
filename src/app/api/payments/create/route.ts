// AISSU Beach Lounge - Payment Create API
// POST /api/payments/create

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createRedeTransaction, mapCardBrand, mapPaymentStatus } from '@/lib/rede-api'
import { createPaymentSchema } from '@/lib/validations'
import type { ApiResponse, RedeTransactionResponse } from '@/lib/types'
import { PaymentStatus, ReservationStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
    try {
        // Parse e valida body
        const body = await request.json()
        const validation = createPaymentSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const { reservationId, amount, tokenCardId, installments, customerName, customerEmail } = validation.data

        // Verifica se reserva existe e está pendente
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            include: { payment: true },
        })

        if (!reservation) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Reserva não encontrada' },
                { status: 404 }
            )
        }

        if (reservation.status !== ReservationStatus.PENDING) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Reserva não está pendente de pagamento' },
                { status: 400 }
            )
        }

        if (reservation.payment) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Já existe um pagamento para esta reserva' },
                { status: 400 }
            )
        }

        // Cria registro de pagamento pendente
        const payment = await prisma.payment.create({
            data: {
                reservationId,
                amount,
                installments,
                status: PaymentStatus.PENDING,
            },
        })

        // Processa pagamento na Rede
        const redeResponse: RedeTransactionResponse = await createRedeTransaction({
            tokenCardId, // Token do SDK Rede (NUNCA o número completo!)
            amount: Math.round(amount * 100), // Converte para centavos
            installments,
            orderId: reservationId,
            customerName,
            customerEmail,
        })

        if (!redeResponse.success) {
            // Atualiza pagamento como recusado
            await prisma.payment.update({
                where: { id: payment.id },
                data: { status: PaymentStatus.DECLINED },
            })

            return NextResponse.json<ApiResponse>(
                { success: false, error: redeResponse.message || 'Pagamento recusado' },
                { status: 400 }
            )
        }

        // Atualiza pagamento com dados da transação
        const updatedPayment = await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: PaymentStatus.AUTHORIZED,
                redeTransactionId: redeResponse.transactionId,
                redeNsu: redeResponse.nsu,
                redeAuthCode: redeResponse.authCode,
            },
        })

        // Atualiza status da reserva
        await prisma.reservation.update({
            where: { id: reservationId },
            data: { status: ReservationStatus.CONFIRMED },
        })

        // Log de auditoria
        console.log({
            action: 'PAYMENT_AUTHORIZED',
            timestamp: new Date().toISOString(),
            paymentId: payment.id,
            reservationId,
            transactionId: redeResponse.transactionId,
            amount,
        })

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                paymentId: updatedPayment.id,
                transactionId: redeResponse.transactionId,
                status: 'AUTHORIZED',
            },
            message: 'Pagamento autorizado com sucesso',
        })
    } catch (error) {
        console.error('[Payment Create Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao processar pagamento' },
            { status: 500 }
        )
    }
}
