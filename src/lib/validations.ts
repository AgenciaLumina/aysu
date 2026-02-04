// AISSU Beach Lounge - Validações Zod
// Schemas de validação para todas as APIs

import { z } from 'zod'

// ============================================================
// AUTH
// ============================================================

export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    phone: z.string().optional(),
    role: z.enum(['ADMIN', 'MANAGER', 'CASHIER', 'CHEF', 'BARISTA', 'STAFF']).default('STAFF'),
})

// ============================================================
// CABINS
// ============================================================

export const createCabinSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    capacity: z.number().int().positive('Capacidade deve ser positiva'),
    pricePerHour: z.number().positive('Preço deve ser positivo'),
    description: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal('')),
    category: z.enum(['CABANA', 'MESA', 'LOUNGE', 'VIP']).default('CABANA'),
})

export const updateCabinSchema = createCabinSchema.partial().extend({
    isActive: z.boolean().optional(),
})

// ============================================================
// RESERVATIONS
// ============================================================

export const createReservationSchema = z.object({
    cabinId: z.string().min(1, 'Cabin ID or Slug is required'),
    customerName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    customerEmail: z.string().email('Email inválido'),
    customerPhone: z.string().min(10, 'Telefone inválido'),
    customerDocument: z.string().optional(),
    notes: z.string().optional(), // Added this line as per instruction
    checkIn: z.string().or(z.date()),
    checkOut: z.string().or(z.date()),
    totalPrice: z.number().positive().optional(), // Se fornecido, ignora cálculo por hora
    source: z.enum(['ONLINE', 'OFFLINE']).default('ONLINE'),
})

export const updateReservationSchema = z.object({
    status: z.enum([
        'PENDING',
        'CONFIRMED',
        'CHECKED_IN',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
    ]).optional(),
    notes: z.string().optional(),
    customerName: z.string().min(2).optional(),
    customerEmail: z.string().email().optional(),
    customerPhone: z.string().min(10).optional(),
})

// ============================================================
// PAYMENTS
// ============================================================

export const createPaymentSchema = z.object({
    reservationId: z.string().uuid('Reservation ID inválido'),
    amount: z.number().positive('Valor deve ser positivo'),
    tokenCardId: z.string().min(1, 'Token do cartão é obrigatório'),
    installments: z.number().int().min(1).max(12).default(1),
    customerName: z.string().min(2, 'Nome é obrigatório'),
    customerEmail: z.string().email('Email inválido'),
})

// ============================================================
// MENU
// ============================================================

export const createMenuCategorySchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    slug: z.string().min(1, 'Slug é obrigatório'),
    description: z.string().optional(),
    displayOrder: z.number().int().default(0),
})

export const createMenuItemSchema = z.object({
    categoryId: z.string().uuid('Category ID inválido'),
    name: z.string().min(1, 'Nome é obrigatório'),
    description: z.string().optional(),
    ingredients: z.string().optional(),
    price: z.number().positive('Preço deve ser positivo'),
    imageUrl: z.string().url().optional().or(z.literal('')),
    preparationTime: z.number().int().positive().optional(),
    allergyInfo: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    displayOrder: z.number().int().default(0),
})

export const updateMenuItemSchema = createMenuItemSchema.partial().extend({
    isAvailable: z.boolean().optional(),
})

// ============================================================
// EVENTS
// ============================================================

export const createEventSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    slug: z.string().min(1, 'Slug é obrigatório'),
    description: z.string().optional(),
    fullDescription: z.string().optional(),
    eventType: z.enum(['DJ_NIGHT', 'LIVE_MUSIC', 'THEMED_PARTY', 'WEDDING', 'CORPORATE', 'OTHER']).default('OTHER'),
    startDate: z.string().or(z.date()),
    endDate: z.string().or(z.date()).optional(),
    bannerImageUrl: z.string().url().optional().or(z.literal('')),
    posterImageUrl: z.string().url().optional().or(z.literal('')),
    galleryImages: z.array(z.string().url()).optional(),
    djName: z.string().optional(),
    bands: z.array(z.string()).optional(),
    specialDrinks: z.array(z.string()).optional(),
    specialFood: z.array(z.string()).optional(),
    themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    maxCapacity: z.number().int().positive().optional(),
    ticketPrice: z.number().positive().optional(),
})

export const updateEventSchema = createEventSchema.partial().extend({
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
})

// ============================================================
// PDV
// ============================================================

export const createPDVOrderSchema = z.object({
    reservationId: z.string().uuid('Reservation ID inválido'),
    items: z.array(z.object({
        menuItemId: z.string().uuid('MenuItem ID inválido'),
        quantity: z.number().int().positive('Quantidade deve ser positiva'),
        specialInstructions: z.string().optional(),
    })).min(1, 'Pelo menos um item é obrigatório'),
    notes: z.string().optional(),
    discount: z.number().min(0).default(0),
})

export const updatePDVOrderSchema = z.object({
    status: z.enum([
        'PENDING',
        'PREPARING',
        'READY',
        'DELIVERED',
        'COMPLETED',
        'CANCELLED',
    ]).optional(),
    notes: z.string().optional(),
    discount: z.number().min(0).optional(),
})

// ============================================================
// QUERY PARAMS
// ============================================================

export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const reservationFiltersSchema = z.object({
    status: z.enum([
        'PENDING',
        'CONFIRMED',
        'CHECKED_IN',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
    ]).optional(),
    source: z.enum(['ONLINE', 'OFFLINE']).optional(),
    cabinId: z.string().uuid().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    search: z.string().optional(),
})

export const menuFiltersSchema = z.object({
    categoryId: z.string().uuid().optional(),
    isAvailable: z.coerce.boolean().optional(),
    search: z.string().optional(),
    tags: z.array(z.string()).optional(),
})

export const eventFiltersSchema = z.object({
    eventType: z.enum(['DJ_NIGHT', 'LIVE_MUSIC', 'THEMED_PARTY', 'WEDDING', 'CORPORATE', 'OTHER']).optional(),
    isActive: z.coerce.boolean().optional(),
    isFeatured: z.coerce.boolean().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
})
