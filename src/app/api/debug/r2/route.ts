// Debug endpoint to check R2 configuration
import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({
        R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '082470a50b13e1a72fb29987889950ea',
        R2_BUCKET: process.env.R2_BUCKET || 'aysu',
        R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || 'https://cdn.aysubeachlounge.com.br',
        R2_ENDPOINT: `https://${process.env.R2_ACCOUNT_ID || '082470a50b13e1a72fb29987889950ea'}.r2.cloudflarestorage.com`,
    })
}
