import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureEventGalleryTables } from '@/lib/event-gallery'
import type { ApiResponse } from '@/lib/types'

interface RouteParams {
    params: Promise<{ slug: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        await ensureEventGalleryTables()

        const { slug } = await params

        const gallery = await prisma.eventGallery.findFirst({
            where: {
                slug,
                isActive: true,
            },
            include: {
                images: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' },
                },
                _count: {
                    select: { images: true },
                },
            },
        })

        if (!gallery) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Galeria não encontrada' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: gallery })
    } catch (error) {
        console.error('[Event Galleries Public GET by slug]', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Erro ao carregar galeria' }, { status: 500 })
    }
}
