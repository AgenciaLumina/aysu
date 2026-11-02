import { getCloudflareContext } from "@opennextjs/cloudflare";

export type D1Statement = { sql: string; params: Array<string | number | null> };
export type BoundStatement = {
  bind(...values: Array<string | number | null>): BoundStatement;
  all<T>(): Promise<{ success: boolean; results: T[] }>;
  raw(options: { columnNames: true }): Promise<unknown[][]>;
};
export type BatchDatabase = {
  prepare(sql: string): BoundStatement;
  batch(statements: BoundStatement[]): Promise<Array<{ success: boolean; meta: { changes: number } }>>;
};

export function getD1Database(): BatchDatabase {
  const env = getCloudflareContext().env as unknown as { DB?: BatchDatabase };
  if (!env.DB) throw new Error("D1 binding unavailable for database operation.");
  return env.DB;
}

export function isCloudflareDatabaseRuntime(): boolean {
  try { getCloudflareContext(); return true; }
  catch { return false; }
}

/** Native D1 batch rolls back every statement if any statement fails. */
export async function executeD1Batch(statements: D1Statement[]) {
  const db = getD1Database();
  const results = await db.batch(statements.map(({ sql, params }) => db.prepare(sql).bind(...params)));
  if (results.some((result) => !result.success)) throw new Error("Atomic D1 operation failed.");
  return results;
}

export async function queryD1<T>(sql: string, params: D1Statement["params"] = []): Promise<T[]> {
  const result = await getD1Database().prepare(sql).bind(...params).all<T>();
  if (!result.success) throw new Error("D1 database read failed.");
  return result.results;
}
