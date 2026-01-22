// AISSU Beach Lounge - Event Detail API
// GET/PATCH/DELETE /api/events/[slug]

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { updateEventSchema } from '@/lib/validations'
import type { ApiResponse } from '@/lib/types'
import type { Event } from '@prisma/client'

interface RouteParams {
    params: Promise<{ slug: string }>
}

// GET - Detalhes do evento por slug
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params

        const event = await prisma.event.findUnique({
            where: { slug },
        })

        if (!event) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Evento não encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json<ApiResponse<Event>>({
            success: true,
            data: event,
        })
    } catch (error) {
        console.error('[Event GET Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao buscar evento' },
            { status: 500 }
        )
    }
}

// PATCH - Atualiza evento
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params
        const authUser = getAuthUser(request)

        if (!authUser || !isAdmin(authUser)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const validation = updateEventSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        // Verifica se existe
        const existing = await prisma.event.findUnique({
            where: { slug },
        })

        if (!existing) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Evento não encontrado' },
                { status: 404 }
            )
        }

        // Se mudou o slug, verifica duplicidade
        if (validation.data.slug && validation.data.slug !== slug) {
            const slugConflict = await prisma.event.findUnique({
                where: { slug: validation.data.slug },
            })

            if (slugConflict) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Já existe um evento com este slug' },
                    { status: 409 }
                )
            }
        }

        // Prepara dados para update
        const updateData: Record<string, unknown> = { ...validation.data }
        if (validation.data.startDate) {
            updateData.startDate = new Date(validation.data.startDate)
        }
        if (validation.data.endDate) {
            updateData.endDate = new Date(validation.data.endDate)
        }

        const event = await prisma.event.update({
            where: { slug },
            data: updateData,
        })

        console.log({
            action: 'EVENT_UPDATED',
            timestamp: new Date().toISOString(),
            eventId: existing.id,
            userId: authUser.userId,
        })

        return NextResponse.json<ApiResponse<Event>>({
            success: true,
            data: event,
            message: 'Evento atualizado com sucesso',
        })
    } catch (error) {
        console.error('[Event PATCH Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao atualizar evento' },
            { status: 500 }
        )
    }
}

// DELETE - Remove evento
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params
        const authUser = getAuthUser(request)

        if (!authUser || !isAdmin(authUser)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        // Verifica se existe
        const existing = await prisma.event.findUnique({
            where: { slug },
        })

        if (!existing) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Evento não encontrado' },
                { status: 404 }
            )
        }

        await prisma.event.delete({
            where: { slug },
        })

        console.log({
            action: 'EVENT_DELETED',
            timestamp: new Date().toISOString(),
            eventId: existing.id,
            userId: authUser.userId,
        })

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Evento removido com sucesso',
        })
    } catch (error) {
        console.error('[Event DELETE Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao remover evento' },
            { status: 500 }
        )
    }
}
