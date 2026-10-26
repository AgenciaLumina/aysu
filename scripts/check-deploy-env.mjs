// Offline preflight: never connects, writes data, or prints environment values.
const errors = []
const required = name => {
    const value = process.env[name]?.trim()
    if (!value) errors.push(`${name}: ausente`)
    return value
}

const target = process.env.VERCEL_TARGET_ENV || process.env.VERCEL_ENV
if (!['production', 'preview', 'development'].includes(target)) {
    errors.push('VERCEL_ENV: definir production, preview ou development')
}
const production = target === 'production'
const secret = required('JWT_SECRET')
if (secret && (secret.length < 32 || secret === 'fallback-secret-change-in-production')) {
    errors.push('JWT_SECRET: usar segredo aleatorio com pelo menos 32 caracteres')
}

const connection = required('DATABASE_URL')
required('DIRECT_URL')
if (connection) {
    try {
        const url = new URL(connection)
        if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.username || !url.password || url.pathname === '/') {
            errors.push('DATABASE_URL: conexao PostgreSQL incompleta')
        }
        if (['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname)) {
            errors.push('DATABASE_URL: loopback nao pode ser acessado pelas funcoes da Vercel')
        }
        if (url.searchParams.get('sslmode') !== 'require' || url.searchParams.get('sslaccept') !== 'strict') {
            errors.push('DATABASE_URL: exigir sslmode=require e sslaccept=strict')
        }
        for (const key of ['connection_limit', 'pool_timeout', 'connect_timeout']) {
            const value = url.searchParams.get(key)
            if (!value || !/^[1-9]\d*$/.test(value)) errors.push(`DATABASE_URL: definir ${key} positivo`)
        }
    } catch {
        errors.push('DATABASE_URL: URL invalida (valor omitido)')
    }
}

if (production) {
    if (process.env.APP_READ_ONLY_MODE !== '0') errors.push('APP_READ_ONLY_MODE: producao comercial exige 0')
    for (const key of ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_PUBLIC_URL', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'CONTACT_TO_EMAIL']) required(key)
    if (!process.env.R2_BUCKET?.trim() && !process.env.R2_BUCKET_NAME?.trim()) errors.push('R2_BUCKET: ausente')
} else {
    if (process.env.APP_READ_ONLY_MODE !== '1') errors.push('APP_READ_ONLY_MODE: preview/desenvolvimento exige 1')
    for (const key of ['RESEND_API_KEY', 'REDE_CLIENT_SECRET', 'R2_SECRET_ACCESS_KEY']) {
        if (process.env[key]?.trim()) errors.push(`${key}: nao disponibilizar credenciais operacionais ao preview`)
    }
}
if (process.env.PENDING_HOLD_MINUTES !== '0') {
    errors.push('PENDING_HOLD_MINUTES: preservar 0, conforme producao verificada')
}

if (errors.length) {
    console.error('Preflight de deploy bloqueado:\n' + errors.map(error => `- ${error}`).join('\n'))
    process.exitCode = 1
} else {
    console.log(`Preflight ${target}: configuracao presente; conectividade e aceite funcional ainda precisam de verificacao.`)
}
