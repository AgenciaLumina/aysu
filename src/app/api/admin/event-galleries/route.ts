import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canAccessAdminPanel, getAuthUser } from '@/lib/auth'
import { createEventGallerySchema } from '@/lib/validations'
import { ensureEventGalleryTables, normalizeEventGallerySlug, parseEventGalleryDate } from '@/lib/event-gallery'
import type { ApiResponse } from '@/lib/types'

export async function GET(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canAccessAdminPanel(authUser)) {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
        }

        await ensureEventGalleryTables()

        const galleries = await prisma.eventGallery.findMany({
            orderBy: [
                { eventDate: 'desc' },
                { displayOrder: 'asc' },
                { createdAt: 'desc' },
            ],
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

        return NextResponse.json({ success: true, data: galleries })
    } catch (error) {
        console.error('[Admin Event Galleries GET]', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Erro ao carregar galerias' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canAccessAdminPanel(authUser)) {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
        }

        await ensureEventGalleryTables()

        const body = await request.json()
        const validation = createEventGallerySchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
        }

        const payload = validation.data
        const normalizedSlug = normalizeEventGallerySlug(payload.slug)

        if (!normalizedSlug) {
            return NextResponse.json({ success: false, error: 'Slug inválido' }, { status: 400 })
        }

        const existingSlug = await prisma.eventGallery.findUnique({
            where: { slug: normalizedSlug },
            select: { id: true },
        })

        if (existingSlug) {
            return NextResponse.json({ success: false, error: 'Já existe uma galeria com este slug' }, { status: 409 })
        }

        const maxOrder = await prisma.eventGallery.findFirst({
            orderBy: { displayOrder: 'desc' },
            select: { displayOrder: true },
        })

        const created = await prisma.eventGallery.create({
            data: {
                title: payload.title.trim(),
                slug: normalizedSlug,
                eventDate: parseEventGalleryDate(payload.eventDate),
                shortDescription: payload.shortDescription?.trim() || null,
                description: payload.description?.trim() || null,
                coverImageUrl: payload.coverImageUrl?.trim() || null,
                ctaText: payload.ctaText?.trim() || null,
                ctaHref: payload.ctaHref?.trim() || null,
                isActive: payload.isActive,
                displayOrder: payload.displayOrder ?? ((maxOrder?.displayOrder ?? -1) + 1),
                images: payload.images?.length
                    ? {
                        create: payload.images.map((image, index) => ({
                            imageUrl: image.imageUrl,
                            caption: image.caption?.trim() || null,
                            displayOrder: image.displayOrder ?? index,
                            isActive: true,
                        })),
                    }
                    : undefined,
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

        return NextResponse.json({
            success: true,
            data: created,
            message: 'Galeria de eventos criada com sucesso',
        }, { status: 201 })
    } catch (error) {
        console.error('[Admin Event Galleries POST]', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Erro ao criar galeria de eventos' }, { status: 500 })
    }
}
