import { ExtractTablesWithRelations } from "drizzle-orm";
import { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

export type DBInstance<
  TQueryResult extends PgQueryResultHKT = PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, unknown>,
> = PgDatabase<
  TQueryResult,
  TFullSchema,
  ExtractTablesWithRelations<TFullSchema>
>;
export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError };

export type ServiceError = {
  code:
    | "VALIDATION_ERROR"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "CONFLICT"
    | "INVALID_ACTION"
    | "EXPIRED"
    | "INTERNAL_ERROR"
    | "WEBHOOK_ERROR"
    | "INVALID_SUBSCRIPTION";
  message: string;
};
