import { Policy } from "../engine";
import { AuthContext, Decision } from "../context";

export class OwnershipPolicy implements Policy {
  name = "OWNERSHIP_POLICY";
  priority = 5;

  async check(ctx: AuthContext, resource?: any): Promise<Decision> {
    if (!resource || !resource.ownerId) return { allowed: true };

    const isOwner = resource.ownerId === ctx.user.id;
    const isTeamOwner = ctx.team?.roleInTeam === "owner";

    return { allowed: isOwner || isTeamOwner, policyName: this.name };
  }
}
