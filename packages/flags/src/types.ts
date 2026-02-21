import { ExtractTablesWithRelations } from "drizzle-orm";
import { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

export type FlagContext = {
  userId?: string;
  teamId?: string;
  userRole?: string;
  planId?: string;
};

export type FlagRule = {
  plans?: Record<string, any>;
  roles?: string[];
  percentage?: number;
  users?: string[];
};

export type DBInstance<
  TQueryResult extends PgQueryResultHKT = PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, unknown>,
> = PgDatabase<
  TQueryResult,
  TFullSchema,
  ExtractTablesWithRelations<TFullSchema>
>;
