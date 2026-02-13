import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import {
  type ExtractTablesWithRelations,
  type TablesRelationalConfig,
} from "drizzle-orm";

export function createAuth<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown>,
  TSchema extends TablesRelationalConfig =
    ExtractTablesWithRelations<TFullSchema>,
>(
  db: PgDatabase<TQueryResult, TFullSchema, TSchema>,
  socialProviders?: { google?: { clientId: string; clientSecret: string } },
  options?: any,
) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
    }),

    socialProviders,
    ...options,
    plugins: [nextCookies()],
  });
}
