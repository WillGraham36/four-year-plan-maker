import "server-only";

import { Pool, QueryResult, QueryResultRow } from "pg";

declare global {
  var __terpPlannerPool: Pool | undefined;
}

function databaseUrl() {
  const value =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SPRING_DATASOURCE_URL;

  if (!value) {
    if (process.env.NODE_ENV !== "production") {
      const user = process.env.POSTGRES_USER || "postgres";
      const password = process.env.POSTGRES_PASSWORD || "WillGraham";
      const database = process.env.POSTGRES_DB || "four_year_planner";
      return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@localhost:5432/${encodeURIComponent(database)}`;
    }
    throw new Error("DATABASE_URL is required for Next.js API routes");
  }

  return value.replace(/^jdbc:/, "");
}

export function getPool() {
  if (!global.__terpPlannerPool) {
    global.__terpPlannerPool = new Pool({
      connectionString: databaseUrl(),
      max: Number(process.env.DATABASE_POOL_MAX || 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return global.__terpPlannerPool;
}

export type DatabaseClient = {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
};

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, values);
}
