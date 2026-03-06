import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureEventGalleryTables, serializeEventGalleryDateField } from '@/lib/event-gallery'
import type { ApiResponse } from '@/lib/types'

export async function GET(request: NextRequest) {
    try {
        await ensureEventGalleryTables()

        const { searchParams } = new URL(request.url)
        const limitParam = Number(searchParams.get('limit') || 24)
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 24

        const galleries = await prisma.eventGallery.findMany({
            where: { isActive: true },
            orderBy: [
                { eventDate: 'desc' },
                { displayOrder: 'asc' },
                { createdAt: 'desc' },
            ],
            take: limit,
            include: {
                images: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' },
                    take: 4,
                },
                _count: {
                    select: { images: true },
                },
            },
        })

        return NextResponse.json({
            success: true,
            data: galleries.map(serializeEventGalleryDateField),
        })
    } catch (error) {
        console.error('[Event Galleries Public GET]', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Erro ao carregar galeria de eventos' }, { status: 500 })
    }
}
