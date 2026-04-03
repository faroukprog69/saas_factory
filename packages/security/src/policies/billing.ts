// packages/security/src/policies/billing.ts
import { Policy } from "../engine";
import { AuthContext, Decision, Action } from "../context";

export class BillingPolicy implements Policy {
  name = "BILLING_POLICY";
  priority = 1;

  async check(
    ctx: AuthContext,
    action: Action,
    resource?: any,
  ): Promise<Decision> {
    if (action === "project:create") {
      const limit = (ctx.flags["max_projects"] as number) ?? Infinity;
      const currentCount = (resource?.currentCount as number) ?? 0;

      if (currentCount >= limit) {
        return {
          allowed: false,
          policyName: this.name,
          reason: `Reached project limit (${currentCount}/${limit})`,
        };
      }
    }

    return { allowed: true, policyName: this.name };
  }
}
