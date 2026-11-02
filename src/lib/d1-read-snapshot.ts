import { randomUUID } from "node:crypto";
import { getD1Database, type BatchDatabase, type D1Statement } from "./d1-batch";

type Read = { sql: string; params: D1Statement["params"]; columns: string[]; rows: unknown[][] };
const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;

export class D1SnapshotConflict extends Error {
  constructor() { super("The data changed before the atomic operation. Retry from a fresh read."); this.name = "D1SnapshotConflict"; }
}

/**
 * Read phase for complex domain decisions. No write is allowed during planning.
 * Every observed query, including empty results, is rechecked inside the same
 * native D1 batch as the writes. A changed row, phantom or late failure rolls
 * back the complete batch. This is not an emulated Prisma transaction.
 */
export class D1ReadSnapshot {
  private readonly reads: Read[] = [];
  private committed = false;
  constructor(private readonly database: BatchDatabase = getD1Database()) {}

  prepare(sql: string) {
    if (!/^\s*SELECT\b/iu.test(sql) || /;\s*\S/u.test(sql)) throw new Error("Only a single SELECT is allowed while planning an atomic operation.");
    return { bind: (...params: D1Statement["params"]) => ({
      raw: async (options: { columnNames: true }) => {
        if (this.committed) throw new Error("Read snapshot is already closed.");
        const result = await this.database.prepare(sql).bind(...params).raw(options);
        const [header, ...rows] = result;
        if (!header?.every(value => typeof value === "string") || new Set(header).size !== header.length) throw new Error("Atomic read requires unique named columns.");
        if (params.length > 98 || rows.some(row => row.some(value => value !== null && typeof value !== "string" && (typeof value !== "number" || !Number.isFinite(value))))) {
          throw new Error("Unsupported value in atomic read snapshot.");
        }
        this.reads.push({ sql: sql.replace(/;\s*$/u, ""), params: [...params], columns: header as string[], rows: structuredClone(rows) });
        return result;
      },
      run: () => { throw new Error("Writes are prohibited while planning an atomic operation."); },
    }) };
  }

  async query<T>(sql: string, params: D1Statement["params"] = []): Promise<T[]> {
    const [columns, ...rows] = await this.prepare(sql).bind(...params).raw({ columnNames: true });
    return rows.map(row => Object.fromEntries(columns.map((column, index) => [String(column), row[index]])) as T);
  }

  async commit(statements: D1Statement[]) {
    if (this.committed || !this.reads.length || !statements.length) throw new Error("Invalid atomic operation lifecycle.");
    this.committed = true;
    const operation = randomUUID();
    const guards = this.reads.map((read, index): D1Statement => {
      // Concatenation strips SQLite's JSON subtype from text values, preserving
      // exactly the strings the driver returned. Numbers compare numerically,
      // so SQL 1.0 and JS 1 are equivalent without weakening text/null checks.
      const values = read.columns.map(column => `CASE WHEN typeof(q.${quote(column)}) = 'text' THEN q.${quote(column)} || '' ELSE q.${quote(column)} END`).join(",");
      const nodes = (table: string) => `SELECT fullkey, CASE WHEN type IN ('integer','real') THEN 'number' ELSE type END AS type, atom FROM ${table}, json_tree(${table}.body)`;
      return {
        sql: `WITH observed AS (SELECT json_group_array(json_array(${values})) AS body FROM (${read.sql}) q), expected AS (SELECT ? AS body)
          INSERT INTO _aysu_atomic_read_guard (id, valid) SELECT ?, CASE WHEN
          NOT EXISTS (${nodes("observed")} EXCEPT ${nodes("expected")})
          AND NOT EXISTS (${nodes("expected")} EXCEPT ${nodes("observed")}) THEN 1 ELSE 0 END`,
        params: [...read.params, JSON.stringify(read.rows), `${operation}:${index}`],
      };
    });
    try {
      const batch = [...guards, ...statements, { sql: "DELETE FROM _aysu_atomic_read_guard WHERE id LIKE ?", params: [`${operation}:%`] }];
      const result = await this.database.batch(batch.map(({ sql, params }) => this.database.prepare(sql).bind(...params)));
      if (result.some(item => !item.success)) throw new Error("Atomic D1 batch failed.");
      return result.slice(guards.length, guards.length + statements.length);
    } catch (error) {
      const cause = error instanceof Error ? `${error.message} ${String(error.cause ?? "")}` : "";
      if (cause.includes("_aysu_atomic_read_guard") && cause.includes("CHECK constraint failed")) throw new D1SnapshotConflict();
      throw error;
    }
  }
}
