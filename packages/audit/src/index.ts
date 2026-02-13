import { type PgDatabase, type PgQueryResultHKT } from "drizzle-orm/pg-core";
import {
  type ExtractTablesWithRelations,
  type TablesRelationalConfig,
} from "drizzle-orm";
import { logAudit } from "./service";
import { LogAuditParams } from "./types";

export function createAudit<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown>,
  TSchema extends TablesRelationalConfig =
    ExtractTablesWithRelations<TFullSchema>,
>(deps: { db: PgDatabase<TQueryResult, TFullSchema, TSchema> }) {
  return {
    logAudit: (params: LogAuditParams) => logAudit(params, deps.db),
  };
}

export * from "./types";
export * from "./utils";
export * from "./permissions";
