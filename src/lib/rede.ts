import axios from 'axios'

// Tipos básicos da Rede
interface RedeAuthResponse {
    access_token: string
    token_type: string
    expires_in: number
}

interface TransactionRequest {
    kind: 'credit' | 'debit'
    amount: number // em centavos
    installments?: number
    cardHolderName?: string
    cardNumber?: string
    expirationMonth?: string
    expirationYear?: string
    securityCode?: string
    softDescriptor?: string
    subscription?: boolean
    capture?: boolean
}

// Configuração
const REDE_CONFIG = {
    authUrl: process.env.REDE_OAUTH_URL || 'https://api.userede.com.br/oauth/token',
    apiUrl: process.env.REDE_API_URL || 'https://api.userede.com.br/e-rede/v1',
    clientId: process.env.REDE_CLIENT_ID,
    clientSecret: process.env.REDE_CLIENT_SECRET,
    merchantId: process.env.REDE_MERCHANT_ID
}

// Cache do token em memória (simples)
let cachedToken: string | null = null
let tokenExpiration: number = 0

export class RedeService {

    /**
     * Autentica e retorna o Access Token
     */
    async getAccessToken(): Promise<string> {
        // Se token ainda válido, retorna cache
        if (cachedToken && Date.now() < tokenExpiration) {
            return cachedToken
        }

        if (!REDE_CONFIG.clientId || !REDE_CONFIG.clientSecret) {
            throw new Error('Credenciais da Rede não configuradas (CLIENT_ID/SECRET)')
        }

        // Auth Basic com ClientId:ClientSecret
        const auth = Buffer.from(`${REDE_CONFIG.clientId}:${REDE_CONFIG.clientSecret}`).toString('base64')

        try {
            const { data } = await axios.post<RedeAuthResponse>(
                REDE_CONFIG.authUrl,
                'grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            )

            cachedToken = data.access_token
            // Expira um pouco antes para segurança (expires_in vem em segundos)
            tokenExpiration = Date.now() + (data.expires_in * 1000) - 60000

            return cachedToken
        } catch (error) {
            console.error('[Rede Auth Error]', error)
            throw new Error('Falha na autenticação com a Rede')
        }
    }

    /**
     * Cria uma transação
     */
    async createTransaction(payload: any) {
        const token = await this.getAccessToken()

        try {
            const { data } = await axios.post(
                `${REDE_CONFIG.apiUrl}/transactions`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            )
            return data
        } catch (error: any) {
            console.error('[Rede Transaction Error]', error.response?.data || error.message)
            throw error
        }
    }

    /**
     * Exemplo: Cria Link de Pagamento (se a API suportar ou via checkout transparente)
     * A API padrão da Rede é transparente (Server-to-Server).
     * Para checkout, o frontend deve coletar os dados do cartão e enviar para nosso backend
     * que chama este serviço.
     */
}

export const redeService = new RedeService()
