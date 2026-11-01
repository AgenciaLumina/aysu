import type { Prisma } from '@/lib/db'

// Settings and bookings use transactions. In SQLite/D1 transactions are serialized.
export async function lockCommercialSettings(_tx: Prisma.TransactionClient) {
    // No-op on SQLite/D1 as advisory locks are Postgres-only and transactions are serial.
    return
}
