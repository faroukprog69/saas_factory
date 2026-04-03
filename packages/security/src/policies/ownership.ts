// packages/security/src/policies/ownership.ts
import { Policy } from "../engine";
import { AuthContext, Decision, Action } from "../context";

export class OwnershipPolicy implements Policy {
  name = "OWNERSHIP_POLICY";
  priority = 5;

  async check(
    ctx: AuthContext,
    action: Action,
    resource?: any,
  ): Promise<Decision> {
    if (!resource || !resource.ownerId)
      return { allowed: true, policyName: this.name };

    const isOwner = resource.ownerId === ctx.user.id;
    const isTeamOwner = ctx.team?.roleInTeam === "owner";

    return {
      allowed: isOwner || isTeamOwner,
      policyName: this.name,
      reason: isOwner || isTeamOwner ? undefined : "User is not the owner",
    };
  }
}
