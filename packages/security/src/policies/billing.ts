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
      const limit = (ctx.flags["max_projects"] as number) || 0;
      const currentCount = (resource?.currentCount as number) || 0;
      return { allowed: currentCount < limit, policyName: this.name };
    }
    return { allowed: true, policyName: this.name };
  }
}
