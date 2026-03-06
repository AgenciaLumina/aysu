import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canAccessAdminPanel, getAuthUser } from '@/lib/auth'
import {
    ensureEventGalleryTables,
    normalizeEventGallerySlug,
    parseEventGalleryDate,
    serializeEventGalleryDateField,
} from '@/lib/event-gallery'
import { updateEventGallerySchema } from '@/lib/validations'
import type { ApiResponse } from '@/lib/types'

interface RouteParams {
    params: Promise<{ id: string }>
}

function nullableString(value: string | null | undefined): string | null {
    if (value == null) return null
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const authUser = getAuthUser(request)
        if (!canAccessAdminPanel(authUser)) {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
        }

        await ensureEventGalleryTables()

        const { id } = await params

        const gallery = await prisma.eventGallery.findUnique({
            where: { id },
            include: {
                images: {
                    orderBy: { displayOrder: 'asc' },
                },
                _count: {
                    select: { images: true },
                },
            },
        })

        if (!gallery) {
            return NextResponse.json({ success: false, error: 'Galeria não encontrada' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: serializeEventGalleryDateField(gallery) })
    } catch (error) {
        console.error('[Admin Event Galleries GET by id]', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Erro ao carregar galeria' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const authUser = getAuthUser(request)
        if (!canAccessAdminPanel(authUser)) {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
        }

        await ensureEventGalleryTables()

        const { id } = await params
        const body = await request.json()
        const validation = updateEventGallerySchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
        }

        const payload = validation.data

        const existing = await prisma.eventGallery.findUnique({
            where: { id },
            select: { id: true, slug: true },
        })

        if (!existing) {
            return NextResponse.json({ success: false, error: 'Galeria não encontrada' }, { status: 404 })
        }

        let nextSlug: string | undefined
        if (payload.slug !== undefined) {
            nextSlug = normalizeEventGallerySlug(payload.slug)
            if (!nextSlug) {
                return NextResponse.json({ success: false, error: 'Slug inválido' }, { status: 400 })
            }

            if (nextSlug !== existing.slug) {
                const slugConflict = await prisma.eventGallery.findUnique({
                    where: { slug: nextSlug },
                    select: { id: true },
                })

                if (slugConflict) {
                    return NextResponse.json({ success: false, error: 'Já existe uma galeria com este slug' }, { status: 409 })
                }
            }
        }

        const updateData: Record<string, unknown> = {}

        if (payload.title !== undefined) updateData.title = payload.title.trim()
        if (payload.slug !== undefined) updateData.slug = nextSlug
        if (payload.eventDate !== undefined) updateData.eventDate = parseEventGalleryDate(payload.eventDate)
        if (payload.shortDescription !== undefined) updateData.shortDescription = nullableString(payload.shortDescription)
        if (payload.description !== undefined) updateData.description = nullableString(payload.description)
        if (payload.coverImageUrl !== undefined) updateData.coverImageUrl = nullableString(payload.coverImageUrl)
        if (payload.ctaText !== undefined) updateData.ctaText = nullableString(payload.ctaText)
        if (payload.ctaHref !== undefined) updateData.ctaHref = nullableString(payload.ctaHref)
        if (payload.isActive !== undefined) updateData.isActive = payload.isActive
        if (payload.displayOrder !== undefined) updateData.displayOrder = payload.displayOrder

        const updated = await prisma.$transaction(async (tx) => {
            const gallery = await tx.eventGallery.update({
                where: { id },
                data: updateData,
            })

            if (payload.images !== undefined) {
                await tx.eventGalleryPhoto.deleteMany({ where: { galleryId: id } })

                if (payload.images.length > 0) {
                    await tx.eventGalleryPhoto.createMany({
                        data: payload.images.map((image, index) => ({
                            galleryId: id,
                            imageUrl: image.imageUrl,
                            caption: image.caption?.trim() || null,
                            displayOrder: image.displayOrder ?? index,
                            isActive: true,
                        })),
                    })
                }
            }

            return tx.eventGallery.findUnique({
                where: { id: gallery.id },
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
        })

        return NextResponse.json({
            success: true,
            data: updated ? serializeEventGalleryDateField(updated) : null,
            message: 'Galeria atualizada com sucesso',
        })
    } catch (error) {
        console.error('[Admin Event Galleries PATCH]', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Erro ao atualizar galeria' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const authUser = getAuthUser(request)
        if (!canAccessAdminPanel(authUser)) {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
        }

        await ensureEventGalleryTables()

        const { id } = await params

        await prisma.eventGallery.delete({
            where: { id },
        })

        return NextResponse.json({ success: true, message: 'Galeria removida com sucesso' })
    } catch (error) {
        console.error('[Admin Event Galleries DELETE]', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Erro ao remover galeria' }, { status: 500 })
    }
}
