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
