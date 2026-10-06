import type { Prisma } from '@prisma/client'
import { SPACE_SLUG_PREFIX } from '@/lib/space-slugs'

// Settings and bookings use the same locks. A price/capacity edit cannot race a commit.
export async function lockCommercialSettings(tx: Prisma.TransactionClient) {
    for (const key of Object.keys(SPACE_SLUG_PREFIX).sort()) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`aysu-reservation:${key}`}))`
    }
}
