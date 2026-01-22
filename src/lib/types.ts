// AISSU Beach Lounge - TypeScript Types
// Tipos centrais da aplicação

import type {
    User,
    Cabin,
    Reservation,
    Payment,
    MenuCategory,
    MenuItem,
    Event,
    PDVOrder,
    PDVOrderItem,
    UserRole,
    CabinCategory,
    ReservationStatus,
    ReservationSource,
    PaymentStatus,
    CardBrand,
    EventType,
    PDVOrderStatus
} from '@prisma/client'

// ============================================================
// RE-EXPORTS DOS TIPOS PRISMA
// ============================================================

export type {
    User,
    Cabin,
    Reservation,
    Payment,
    MenuCategory,
    MenuItem,
    Event,
    PDVOrder,
    PDVOrderItem
}

// ============================================================
// TIPOS DE RESPOSTA API
// ============================================================

export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    total: number
    page: number
    limit: number
    totalPages: number
}

// ============================================================
// TIPOS DE AUTENTICAÇÃO
// ============================================================

export interface LoginCredentials {
    email: string
    password: string
}

export interface AuthUser {
    id: string
    email: string
    name: string
    role: UserRole
}

export interface AuthToken {
    token: string
    user: AuthUser
}

export interface JWTPayload {
    userId: string
    email: string
    role: UserRole
    iat?: number
    exp?: number
}

// ============================================================
// TIPOS DE RESERVA
// ============================================================

export interface CreateReservationInput {
    cabinId: string
    customerName: string
    customerEmail: string
    customerPhone: string
    customerDocument?: string
    checkIn: Date | string
    checkOut: Date | string
    notes?: string
}

export interface ReservationWithDetails extends Reservation {
    cabin: Cabin
    payment?: Payment | null
}

export interface AvailabilitySlot {
    start: string
    end: string
    isOccupied: boolean
}

export interface CabinAvailability {
    cabinId: string
    cabinName: string
    date: string
    slots: AvailabilitySlot[]
}

// ============================================================
// TIPOS DE PAGAMENTO
// ============================================================

export interface CreatePaymentInput {
    reservationId: string
    amount: number
    tokenCardId: string // Token do SDK Rede (nunca o número completo!)
    installments: number
    customerName: string
    customerEmail: string
}

export interface RedeTransactionResponse {
    success: boolean
    transactionId?: string
    nsu?: string
    authCode?: string
    status?: string
    message?: string
}

export interface RedeWebhookPayload {
    transaction: {
        id: string
        status: string
        nsu: string
        authCode: string
        amount: number
        cardBrand?: string
        cardLastFour?: string
    }
}

// ============================================================
// TIPOS DE MENU
// ============================================================

export interface CreateMenuItemInput {
    categoryId: string
    name: string
    description?: string
    ingredients?: string
    price: number
    imageUrl?: string
    preparationTime?: number
    allergyInfo?: string[]
    tags?: string[]
}

export interface UpdateMenuItemInput extends Partial<CreateMenuItemInput> {
    isAvailable?: boolean
    displayOrder?: number
}

export interface MenuCategoryWithItems extends MenuCategory {
    items: MenuItem[]
}

// ============================================================
// TIPOS DE EVENTOS
// ============================================================

export interface CreateEventInput {
    title: string
    slug: string
    description?: string
    fullDescription?: string
    eventType: EventType
    startDate: Date | string
    endDate?: Date | string
    bannerImageUrl?: string
    posterImageUrl?: string
    galleryImages?: string[]
    djName?: string
    bands?: string[]
    specialDrinks?: string[]
    specialFood?: string[]
    themeColor?: string
    maxCapacity?: number
    ticketPrice?: number
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
    isActive?: boolean
    isFeatured?: boolean
}

// ============================================================
// TIPOS DE PDV
// ============================================================

export interface CreatePDVOrderInput {
    reservationId: string
    items: {
        menuItemId: string
        quantity: number
        specialInstructions?: string
    }[]
    notes?: string
}

export interface PDVOrderWithItems extends PDVOrder {
    items: (PDVOrderItem & {
        menuItem: MenuItem
    })[]
}

// ============================================================
// TIPOS DE DASHBOARD
// ============================================================

export interface DashboardMetrics {
    totalReservations: number
    totalRevenue: number
    upcomingEvents: number
    activeReservations: number
    todayCheckIns: number
    todayCheckOuts: number
    pendingPayments: number
    menuItemsCount: number
}

export interface RevenueByPeriod {
    period: string
    revenue: number
    reservations: number
}

// ============================================================
// TIPOS DE FILTROS
// ============================================================

export interface ReservationFilters {
    status?: ReservationStatus
    source?: ReservationSource
    cabinId?: string
    startDate?: string
    endDate?: string
    search?: string
}

export interface MenuFilters {
    categoryId?: string
    isAvailable?: boolean
    search?: string
    tags?: string[]
}

export interface EventFilters {
    eventType?: EventType
    isActive?: boolean
    isFeatured?: boolean
    startDate?: string
    endDate?: string
}
