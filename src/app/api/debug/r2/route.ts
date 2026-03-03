// Debug endpoint to check R2 configuration
import { NextResponse } from 'next/server'
import { R2_CONFIG, R2_ENDPOINT } from '@/lib/r2'

export async function GET() {
    return NextResponse.json({
        R2_ACCOUNT_ID: R2_CONFIG.accountId,
        R2_BUCKET: R2_CONFIG.bucket,
        R2_PUBLIC_URL: R2_CONFIG.publicUrl,
        R2_ENDPOINT: R2_ENDPOINT,
    })
}
