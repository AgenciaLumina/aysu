// AISSU Beach Lounge - Prisma Client for Cloudflare D1
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaClient } from "../generated/client/client";

export * from "../generated/client/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  __globalPrismaD1?: PrismaClient;
};

export function getPrismaClient(): PrismaClient {
  // 1. Cloudflare request context
  try {
    const cf = getCloudflareContext({ async: false });
    const env = (cf as any)?.env;
    if (env?.DB) {
      if (!env.__prismaClient) {
        env.__prismaClient = new PrismaClient({
          adapter: new PrismaD1(env.DB),
        });
      }
      return env.__prismaClient;
    }
  } catch {
    // getCloudflareContext throws outside Cloudflare worker request scope
  }

  // 2. Global DB binding
  const d1 = (globalThis as any).DB || (process.env as any).DB;
  if (d1) {
    if (!globalForPrisma.__globalPrismaD1) {
      globalForPrisma.__globalPrismaD1 = new PrismaClient({
        adapter: new PrismaD1(d1),
      });
    }
    return globalForPrisma.__globalPrismaD1;
  }

  // 3. Fallback for Node.js build process / CLI scripts using local SQLite
  if (!globalForPrisma.prisma) {
    try {
      const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
      const dbPath =
        process.env.LOCAL_DB_PATH ||
        (process.env.DATABASE_URL?.startsWith("file:")
          ? process.env.DATABASE_URL.replace("file:", "")
          : "/Volumes/NVME/Migra Cloudflare/aysu/aysu_d1.sqlite");
      const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
      globalForPrisma.prisma = new PrismaClient({ adapter });
    } catch {
      globalForPrisma.prisma = new (PrismaClient as any)({ adapter: null });
    }
  }

  return globalForPrisma.prisma!;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default prisma;
