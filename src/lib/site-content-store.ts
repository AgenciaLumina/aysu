import { Prisma } from '@prisma/client'
import prisma from '@/lib/db'
import {
    DEFAULT_SITE_CONTENT,
    parseSiteContentConfig,
    type SiteContentConfig,
} from '@/lib/site-content'

const SITE_CONTENT_CONFIG_ID = 'default'

const CREATE_SITE_CONTENT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS "SiteContentConfig" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "content" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteContentConfig_pkey" PRIMARY KEY ("id")
)
`

interface SiteContentConfigRow {
    content: unknown
    updatedAt: Date
}

export interface StoredSiteContentConfig {
    content: SiteContentConfig
    updatedAt: string | null
}

function isMissingSiteContentTableError(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const code = error.code
        const cause = typeof error.meta?.cause === 'string' ? error.meta.cause.toLowerCase() : ''
        const table = typeof error.meta?.table === 'string' ? error.meta.table.toLowerCase() : ''

        return (
            code === 'P2021' ||
            code === 'P2010' ||
            cause.includes('sitecontentconfig') ||
            table.includes('sitecontentconfig')
        )
    }

    const message = error instanceof Error ? error.message.toLowerCase() : ''
    return message.includes('sitecontentconfig') || (message.includes('relation') && message.includes('does not exist'))
}

async function bootstrapSiteContentTableIfNeeded() {
    await prisma.$executeRawUnsafe(CREATE_SITE_CONTENT_TABLE_SQL)
    await prisma.$executeRawUnsafe(
        `
        INSERT INTO "SiteContentConfig" ("id", "content")
        VALUES ($1, $2::jsonb)
        ON CONFLICT ("id") DO NOTHING
        `,
        SITE_CONTENT_CONFIG_ID,
        JSON.stringify(DEFAULT_SITE_CONTENT)
    )
}

async function findSiteContentRow(): Promise<SiteContentConfigRow | null> {
    const rows = await prisma.$queryRaw<SiteContentConfigRow[]>`
        SELECT "content", "updatedAt"
        FROM "SiteContentConfig"
        WHERE "id" = ${SITE_CONTENT_CONFIG_ID}
        LIMIT 1
    `

    return rows[0] ?? null
}

export async function getSiteContentConfig(): Promise<StoredSiteContentConfig> {
    try {
        let row = await findSiteContentRow()

        if (!row) {
            await bootstrapSiteContentTableIfNeeded()
            row = await findSiteContentRow()
        }

        return {
            content: parseSiteContentConfig(row?.content),
            updatedAt: row?.updatedAt ? row.updatedAt.toISOString() : null,
        }
    } catch (error) {
        if (!isMissingSiteContentTableError(error)) {
            throw error
        }

        await bootstrapSiteContentTableIfNeeded()
        const row = await findSiteContentRow()

        return {
            content: parseSiteContentConfig(row?.content),
            updatedAt: row?.updatedAt ? row.updatedAt.toISOString() : null,
        }
    }
}

export async function updateSiteContentConfig(value: unknown): Promise<StoredSiteContentConfig> {
    const content = parseSiteContentConfig(value)

    await bootstrapSiteContentTableIfNeeded()
    await prisma.$executeRawUnsafe(
        `
        INSERT INTO "SiteContentConfig" ("id", "content")
        VALUES ($1, $2::jsonb)
        ON CONFLICT ("id") DO UPDATE
        SET "content" = EXCLUDED."content",
            "updatedAt" = CURRENT_TIMESTAMP
        `,
        SITE_CONTENT_CONFIG_ID,
        JSON.stringify(content)
    )

    const row = await findSiteContentRow()

    return {
        content: parseSiteContentConfig(row?.content),
        updatedAt: row?.updatedAt ? row.updatedAt.toISOString() : null,
    }
}
