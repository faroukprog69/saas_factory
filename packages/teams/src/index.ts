import { createTeamForUser, deleteTeam, updateTeam } from "./services/team";
import { addMember, changeRole, removeMember } from "./services/member";
import { acceptInvite, createInvite, revokeInvite } from "./services/invite";
import { getTeamsSchema } from "./schema";
import { DBInstance, TeamRole } from "./types";

import { InferSelectModel } from "drizzle-orm";
import { ServiceResult } from "@faroukprog69/types";
export * from "./permissions";

export type TeamsDeps = {
  db: DBInstance<any, any>;
  logAudit: (params: any) => Promise<any>;
};

export type AppTeamsDeps = TeamsDeps;
export type TeamsService = {
  createTeamForUser: (
    userId: string,
    name: string,
  ) => Promise<ServiceResult<any>>;
  updateTeam: (
    teamId: string,
    currentUserId: string,
    updates: any,
  ) => Promise<ServiceResult<any>>;
  deleteTeam: (
    currentUserId: string,
    teamId: string,
  ) => Promise<ServiceResult<{ message: string }>>;
  addMember: (
    teamId: string,
    userId: string,
    currentUserId: string,
    role: TeamRole,
  ) => Promise<ServiceResult<any>>;
  changeRole: (
    teamId: string,
    userId: string,
    currentUserId: string,
    role: TeamRole,
  ) => Promise<ServiceResult<any>>;
  removeMember: (
    teamId: string,
    userId: string,
    currentUserId: string,
  ) => Promise<ServiceResult<{ message: string }>>;
  createInvite: (
    teamId: string,
    currentUserId: string,
    email: string,
    role: TeamRole,
  ) => Promise<ServiceResult<any>>;
  acceptInvite: (token: string, userId: string) => Promise<ServiceResult<any>>;
  revokeInvite: (
    teamId: string,
    currentUserId: string,
    inviteId: string,
  ) => Promise<ServiceResult<any>>;
  schema: ReturnType<typeof getTeamsSchema>;
};
export function createTeams<
  TFullSchema extends Record<string, unknown> = Record<string, any>,
>(userSchema: any, deps: AppTeamsDeps): TeamsService {
  const schema = getTeamsSchema(userSchema);
  const teamSchema = schema.team;
  const teamMemberSchema = schema.teamMember;
  const teamInviteSchema = schema.teamInvite;

  return {
    createTeamForUser: (userId: string, name: string) =>
      createTeamForUser<InferSelectModel<typeof teamSchema>, TFullSchema>(
        userId,
        name,
        deps.db,
        deps.logAudit,
        teamSchema,
        teamMemberSchema,
      ),
    updateTeam: (
      teamId: string,
      currentUserId: string,
      updates: Partial<
        Omit<
          InferSelectModel<typeof teamSchema>,
          "id" | "ownerId" | "createdAt" | "updatedAt" | "slug"
        >
      >,
    ) =>
      updateTeam<InferSelectModel<typeof teamSchema>, TFullSchema>(
        teamId,
        currentUserId,
        updates,
        deps.db,
        deps.logAudit,
        teamSchema,
        teamMemberSchema,
      ),

    deleteTeam: (currentUserId: string, teamId: string) =>
      deleteTeam<TFullSchema>(
        currentUserId,
        teamId,
        deps.db,
        deps.logAudit,
        teamSchema,
        teamMemberSchema,
      ),
    addMember: (
      teamId: string,
      userId: string,
      currentUserId: string,
      role: TeamRole,
    ) =>
      addMember<InferSelectModel<typeof teamMemberSchema>, TFullSchema>(
        teamId,
        userId,
        role,
        currentUserId,
        deps.db,
        deps.logAudit,
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
      changeRole<InferSelectModel<typeof teamMemberSchema>, TFullSchema>(
        teamId,
        userId,
        role,
        currentUserId,
        deps.db,
        deps.logAudit,
        teamMemberSchema,
      ),

    removeMember: (teamId: string, userId: string, currentUserId: string) =>
      removeMember<InferSelectModel<typeof teamMemberSchema>, TFullSchema>(
        teamId,
        userId,
        currentUserId,
        deps.db,
        deps.logAudit,
        teamMemberSchema,
      ),

    createInvite: (
      teamId: string,
      currentUserId: string,
      email: string,
      role: TeamRole,
    ) =>
      createInvite<InferSelectModel<typeof teamInviteSchema>, TFullSchema>(
        teamId,
        currentUserId,
        email,
        role,
        deps.db,
        deps.logAudit,
        userSchema,
        teamMemberSchema,
        teamInviteSchema,
      ),

    acceptInvite: (token: string, userId: string) =>
      acceptInvite<InferSelectModel<typeof teamInviteSchema>, TFullSchema>(
        token,
        userId,
        deps.db,
        deps.logAudit,
        teamInviteSchema,
        teamMemberSchema,
      ),

    revokeInvite: (teamId: string, currentUserId: string, inviteId: string) =>
      revokeInvite<InferSelectModel<typeof teamInviteSchema>, TFullSchema>(
        teamId,
        currentUserId,
        inviteId,
        deps.db,
        deps.logAudit,
        teamInviteSchema,
        teamMemberSchema,
      ),

    schema,
  };
}
