import type { Prisma } from '@/lib/db'

// Cloudflare callers must guard reads and commit writes in a native D1.batch.
// This compatibility helper does not provide a lock or transaction.
export async function lockCommercialSettings(_tx: Prisma.TransactionClient) {
    // PostgreSQL advisory locks are unavailable on SQLite/D1.
    return
}
