import {
  ExtractTablesWithRelations,
  InferInsertModel,
  InferSelectModel,
  TablesRelationalConfig,
} from "drizzle-orm";

import {
  team,
  teamMember,
  teamInvite,
  teamStatusEnum,
  teamRoleEnum,
} from "./schema";
import { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
/* =====================================================
   ENUM TYPES (DB enums → TS unions)
===================================================== */

export type TeamStatus = (typeof teamStatusEnum.enumValues)[number];

export type TeamRole = (typeof teamRoleEnum.enumValues)[number];

export type DBInstance<
  TQueryResult extends PgQueryResultHKT = PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, unknown>,
> = PgDatabase<
  TQueryResult,
  TFullSchema,
  ExtractTablesWithRelations<TFullSchema>
>;
