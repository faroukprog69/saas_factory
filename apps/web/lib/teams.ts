import { createTeams, type TeamsService } from "@faroukprog69/teams";
import { authSchema } from "@faroukprog69/auth/schema";
import { db } from "./db";
import { logAudit } from "./audit";

export const teamsService: TeamsService = createTeams(authSchema.user, {
  db: db,
  logAudit: logAudit,
});

export const teamsSchema = teamsService.schema;
