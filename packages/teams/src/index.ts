import { createTeamForUser, deleteTeam, updateTeam } from "./services/team";
import { addMember, changeRole, removeMember } from "./services/member";
import { acceptInvite, createInvite, revokeInvite } from "./services/invite";
import {
  team,
  teamMember,
  teamInvite,
  teamRelations,
  teamMemberRelations,
  teamInviteRelations,
  teamPlanEnum,
  teamStatusEnum,
  teamRoleEnum,
} from "./schema";
import {
  createTeamMemberSchema,
  createTeamSchema,
  createTeamInviteSchema,
  GetTeamMemberSelect,
  GetTeamSelect,
  GetTeamInviteSelect,
  TeamRole,
} from "./types";
import { type DBInstance } from "./types";
import { type PgQueryResultHKT } from "drizzle-orm/pg-core";
import {
  type ExtractTablesWithRelations,
  type TablesRelationalConfig,
} from "drizzle-orm";
import { type NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
export * from "./permissions";

type TeamsDeps<
  TQueryResult extends PgQueryResultHKT = PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, unknown>,
  TSchema extends TablesRelationalConfig =
    ExtractTablesWithRelations<TFullSchema>,
> = {
  db: DBInstance<TQueryResult, TFullSchema, TSchema>;
  audit: {
    log: (params: any) => Promise<any>;
  };
};

export type AppTeamsDeps<TFullSchema extends Record<string, unknown>> =
  TeamsDeps<NodePgQueryResultHKT, TFullSchema>;

export function createTeams<TFullSchema extends Record<string, unknown>>(
  userSchema: any,
  deps: AppTeamsDeps<TFullSchema>,
) {
  const teamSchema = createTeamSchema(userSchema);
  type Team = GetTeamSelect<typeof teamSchema>;
  const teamMemberSchema = createTeamMemberSchema(userSchema);
  type TeamMember = GetTeamMemberSelect<typeof teamMemberSchema>;

  const teamInviteSchema = createTeamInviteSchema(userSchema);
  type TeamInvite = GetTeamInviteSelect<typeof teamInviteSchema>;

  return {
    createTeamForUser: (userId: string, name: string) =>
      createTeamForUser<Team, TFullSchema>(
        userId,
        name,
        deps.db,
        deps.audit.log,
        teamSchema,
        teamMemberSchema,
      ),
    updateTeam: (
      teamId: string,
      currentUserId: string,
      updates: Partial<
        Omit<Team, "id" | "ownerId" | "createdAt" | "updatedAt" | "slug">
      >,
    ) =>
      updateTeam<Team, TFullSchema>(
        teamId,
        currentUserId,
        updates,
        deps.db,
        deps.audit.log,
        teamSchema,
        teamMemberSchema,
      ),

    deleteTeam: (currentUserId: string, teamId: string) =>
      deleteTeam<TFullSchema>(
        currentUserId,
        teamId,
        deps.db,
        deps.audit.log,
        teamSchema,
        teamMemberSchema,
      ),
    addMember: (
      teamId: string,
      userId: string,
      currentUserId: string,
      role: TeamRole,
    ) =>
      addMember<TeamMember, TFullSchema>(
        teamId,
        userId,
        role,
        currentUserId,
        deps.db,
        deps.audit.log,
        userSchema,
        teamMemberSchema,
        teamInviteSchema,
      ),

    changeRole: (
      teamId: string,
      userId: string,
      currentUserId: string,
      role: TeamRole,
    ) =>
      changeRole<TeamMember, TFullSchema>(
        teamId,
        userId,
        role,
        currentUserId,
        deps.db,
        deps.audit.log,
        teamMemberSchema,
      ),

    removeMember: (teamId: string, userId: string, currentUserId: string) =>
      removeMember<TeamMember, TFullSchema>(
        teamId,
        userId,
        currentUserId,
        deps.db,
        deps.audit.log,
        teamMemberSchema,
      ),

    createInvite: (
      teamId: string,
      currentUserId: string,
      email: string,
      role: TeamRole,
    ) =>
      createInvite<TeamInvite, TFullSchema>(
        teamId,
        currentUserId,
        email,
        role,
        deps.db,
        deps.audit.log,
        userSchema,
        teamMemberSchema,
        teamInviteSchema,
      ),

    acceptInvite: (token: string, userId: string) =>
      acceptInvite<TeamInvite, TFullSchema>(
        token,
        userId,
        deps.db,
        deps.audit.log,
        teamInviteSchema,
        teamMemberSchema,
      ),

    revokeInvite: (teamId: string, currentUserId: string, inviteId: string) =>
      revokeInvite<TeamInvite, TFullSchema>(
        teamId,
        currentUserId,
        inviteId,
        deps.db,
        deps.audit.log,
        teamInviteSchema,
        teamMemberSchema,
      ),
  };
}

export function getSchema(userSchema: any) {
  return {
    team: team(userSchema),
    teamMember: teamMember(userSchema),
    teamInvite: teamInvite(userSchema),
    teamRelations: teamRelations(userSchema),
    teamMemberRelations: teamMemberRelations(userSchema),
    teamInviteRelations: teamInviteRelations(userSchema),
    teamPlanEnum,
    teamStatusEnum,
    teamRoleEnum,
  };
}
