// AISSU Beach Lounge - Rede API Integration
// SDK Checkout Transparente - Tokenização de Cartões

import jwt from 'jsonwebtoken'
import type { RedeTransactionResponse, RedeWebhookPayload } from './types'

// ============================================================
// CONSTANTES
// ============================================================

const REDE_API_URL = process.env.REDE_API_URL || 'https://api.userede.com.br/redelabs'
const REDE_OAUTH_URL = process.env.REDE_OAUTH_URL || 'https://api.userede.com.br/redelabs/oauth/token'
const REDE_CLIENT_ID = process.env.REDE_CLIENT_ID || ''
const REDE_CLIENT_SECRET = process.env.REDE_CLIENT_SECRET || ''
const REDE_MERCHANT_ID = process.env.REDE_MERCHANT_ID || ''
const REDE_WEBHOOK_SECRET = process.env.REDE_WEBHOOK_SECRET || ''

// Cache para OAuth token
let cachedAccessToken: { token: string; expiresAt: number } | null = null

// ============================================================
// OAUTH - Token de Acesso
// ============================================================

/**
 * Obtém access token OAuth da Rede com caching
 * O token é válido por 1 hora (3600 segundos)
 */
export async function getAccessToken(): Promise<string> {
    // Verifica cache (com margem de 5 minutos)
    if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 300000) {
        return cachedAccessToken.token
    }

    try {
        const credentials = Buffer.from(`${REDE_CLIENT_ID}:${REDE_CLIENT_SECRET}`).toString('base64')

        const response = await fetch(REDE_OAUTH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`,
            },
            body: 'grant_type=client_credentials',
        })

        if (!response.ok) {
            const error = await response.text()
            console.error('[Rede OAuth Error]', error)
            throw new Error('Falha ao obter token OAuth da Rede')
        }

        const data = await response.json()

        // Cache com expiração
        cachedAccessToken = {
            token: data.access_token,
            expiresAt: Date.now() + (data.expires_in * 1000),
        }

        return data.access_token
    } catch (error) {
        console.error('[Rede OAuth Error]', error)
        throw error
    }
}

// ============================================================
// TRANSAÇÕES
// ============================================================

interface CreateTransactionParams {
    tokenCardId: string // Token do SDK Rede (NUNCA o número completo!)
    amount: number // Em centavos
    installments: number
    orderId: string // ID único da reserva
    customerName: string
    customerEmail: string
    softDescriptor?: string // Nome que aparece na fatura
}

/**
 * Cria transação de pagamento na Rede
 * Usa o tokenCardId obtido pelo SDK no frontend (PCI-DSS compliance)
 */
export async function createRedeTransaction(
    params: CreateTransactionParams
): Promise<RedeTransactionResponse> {
    try {
        const accessToken = await getAccessToken()

        const payload = {
            merchantId: REDE_MERCHANT_ID,
            amount: params.amount,
            installments: params.installments,
            reference: params.orderId,
            softDescriptor: params.softDescriptor || 'AYSU BEACH',
            capture: true, // Autoriza e captura em um step
            token: params.tokenCardId,
            customer: {
                name: params.customerName,
                email: params.customerEmail,
            },
        }

        const response = await fetch(`${REDE_API_URL}/v1/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('[Rede Transaction Error]', data)
            return {
                success: false,
                message: data.returnMessage || 'Falha ao processar pagamento',
                status: data.returnCode,
            }
        }

        return {
            success: true,
            transactionId: data.transactionId,
            nsu: data.nsu,
            authCode: data.authorizationCode,
            status: data.status,
            message: 'Pagamento autorizado com sucesso',
        }
    } catch (error) {
        console.error('[Rede Transaction Error]', error)
        return {
            success: false,
            message: 'Erro de comunicação com a Rede',
        }
    }
}

/**
 * Consulta status de uma transação
 */
export async function getRedeTransactionStatus(
    transactionId: string
): Promise<RedeTransactionResponse> {
    try {
        const accessToken = await getAccessToken()

        const response = await fetch(
            `${REDE_API_URL}/v1/transactions/${transactionId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        )

        if (!response.ok) {
            const error = await response.json()
            return {
                success: false,
                message: error.returnMessage || 'Transação não encontrada',
            }
        }

        const data = await response.json()

        return {
            success: true,
            transactionId: data.transactionId,
            nsu: data.nsu,
            authCode: data.authorizationCode,
            status: data.status,
        }
    } catch (error) {
        console.error('[Rede Status Error]', error)
        return {
            success: false,
            message: 'Erro ao consultar transação',
        }
    }
}

/**
 * Reembolsa uma transação (total ou parcial)
 */
export async function refundRedeTransaction(
    transactionId: string,
    amount?: number // Se não informado, reembolso total
): Promise<RedeTransactionResponse> {
    try {
        const accessToken = await getAccessToken()

        const payload = amount ? { amount } : {}

        const response = await fetch(
            `${REDE_API_URL}/v1/transactions/${transactionId}/refunds`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            }
        )

        if (!response.ok) {
            const error = await response.json()
            return {
                success: false,
                message: error.returnMessage || 'Falha ao processar reembolso',
            }
        }

        const data = await response.json()

        return {
            success: true,
            transactionId: data.transactionId,
            status: 'REFUNDED',
            message: 'Reembolso processado com sucesso',
        }
    } catch (error) {
        console.error('[Rede Refund Error]', error)
        return {
            success: false,
            message: 'Erro ao processar reembolso',
        }
    }
}

// ============================================================
// WEBHOOK
// ============================================================

/**
 * Verifica assinatura JWT do webhook da Rede
 * CRÍTICO: Sempre validar antes de processar webhook
 */
export function verifyWebhookSignature(
    payload: string,
    signature: string
): RedeWebhookPayload | null {
    try {
        if (!REDE_WEBHOOK_SECRET) {
            console.error('[Rede Webhook] Secret não configurado')
            return null
        }

        // Verifica JWT com o secret
        const decoded = jwt.verify(signature, REDE_WEBHOOK_SECRET) as {
            payload: string
            iat: number
        }

        // Verifica se o payload bate
        if (decoded.payload !== payload) {
            console.error('[Rede Webhook] Payload não confere')
            return null
        }

        // Verifica timestamp (evita replay attack - max 5 minutos)
        const now = Math.floor(Date.now() / 1000)
        if (decoded.iat && now - decoded.iat > 300) {
            console.error('[Rede Webhook] Timestamp expirado')
            return null
        }

        return JSON.parse(payload) as RedeWebhookPayload
    } catch (error) {
        console.error('[Rede Webhook Verify Error]', error)
        return null
    }
}

/**
 * Mapeia código de retorno Rede para CardBrand
 */
export function mapCardBrand(brand: string | undefined): string {
    if (!brand) return 'OTHER'

    const brandMap: Record<string, string> = {
        'Visa': 'VISA',
        'Mastercard': 'MASTERCARD',
        'Elo': 'ELO',
        'Amex': 'AMEX',
        'Hipercard': 'HIPERCARD',
        'Diners': 'DINERS',
    }

    return brandMap[brand] || 'OTHER'
}

/**
 * Mapeia status da transação Rede para PaymentStatus
 */
export function mapPaymentStatus(status: string): string {
    const statusMap: Record<string, string> = {
        'Approved': 'CAPTURED',
        'Authorized': 'AUTHORIZED',
        'Denied': 'DECLINED',
        'Cancelled': 'CANCELLED',
        'Refunded': 'REFUNDED',
    }

    return statusMap[status] || 'PENDING'
}
