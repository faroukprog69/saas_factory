// packages/security/src/policies/rbac.ts
import { Policy } from "../engine";
import { AuthContext, Decision, Action } from "../context";

export class RBACPolicy implements Policy {
  name = "RBAC_POLICY";
  priority = 10;

  constructor(private rolePermissions: Record<string, string[]>) {}

  async check(ctx: AuthContext, action: Action): Promise<Decision> {
    const role = ctx.team?.roleInTeam || ctx.user.role;
    const permissions = this.rolePermissions[role] || [];

    if (permissions.includes(action)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Role '${role}' does not have permission for '${action}'`,
    };
  }
}
