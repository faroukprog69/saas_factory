// apps/web/lib/schema.ts
import { authSchema } from "@faroukprog69/auth/schema";
import { auditSchema } from "@faroukprog69/audit/schema";
import { getTeamsSchema } from "@faroukprog69/teams/schema";

const generatedTeamsSchema = getTeamsSchema(authSchema.user);

export * from "@faroukprog69/audit/schema";
export * from "@faroukprog69/auth/schema";
export * from "@faroukprog69/teams/schema";
export const {
  team,
  teamMember,
  teamInvite,
  teamRelations,
  teamMemberRelations,
  teamInviteRelations,
} = generatedTeamsSchema;

export const schema = {
  ...auditSchema,
  ...authSchema,
  ...generatedTeamsSchema,
};
