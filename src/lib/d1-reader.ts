import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@/generated/client/client";
import { D1ReadSnapshot } from "./d1-read-snapshot";
import type { BatchDatabase } from "./d1-batch";

export function createD1DomainReader(database?: BatchDatabase) {
  const snapshot = new D1ReadSnapshot(database);
  const reader = new PrismaClient({ adapter: new PrismaD1(snapshot as unknown as ConstructorParameters<typeof PrismaD1>[0]) });
  return { reader, snapshot };
}
