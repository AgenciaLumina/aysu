import { NextResponse } from 'next/server'
import { DEFAULT_SITE_CONTENT } from '@/lib/site-content'
import { getSiteContentConfig } from '@/lib/site-content-store'
import type { ApiResponse } from '@/lib/types'

export async function GET() {
    try {
        if (!process.env.DATABASE_URL) {
            return NextResponse.json<ApiResponse>({
                success: true,
                data: {
                    content: DEFAULT_SITE_CONTENT,
                    updatedAt: null,
                },
            })
        }

        const config = await getSiteContentConfig()

        return NextResponse.json<ApiResponse>({
            success: true,
            data: config,
        })
    } catch (error) {
        console.error('[Public Site Content GET Error]', error)
        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                content: DEFAULT_SITE_CONTENT,
                updatedAt: null,
            },
        })
    }
}
