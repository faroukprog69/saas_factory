// apps/web/lib/schema.ts

import { auditSchema } from "@faroukprog69/audit/schema";
import { authSchema, user } from "@faroukprog69/auth/schema";
import { getTeamsSchema } from "@faroukprog69/teams/schema";
import { getBillingSchema } from "@faroukprog69/billing/schema";
import { flagsSchema } from "@faroukprog69/flags/schema";

const teamsSchema = getTeamsSchema(user);
const billingSchema = getBillingSchema(teamsSchema.team);

export * from "@faroukprog69/audit/schema";
export * from "@faroukprog69/auth/schema";
export * from "@faroukprog69/teams/schema";
export * from "@faroukprog69/flags/schema";
export { subscriptionStatusEnum } from "@faroukprog69/billing/schema";

export const {
  team,
  teamMember,
  teamInvite,
  teamRelations,
  teamMemberRelations,
  teamInviteRelations,
} = teamsSchema;

export const { subscription, subscriptionRelations, targetRelations } =
  billingSchema;

export const schema = Object.freeze({
  ...auditSchema,
  ...authSchema,
  ...teamsSchema,
  ...billingSchema,
  ...flagsSchema,
});
