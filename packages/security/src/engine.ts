// packages/security/src/engine.ts
import { AuthContext, Decision, Action } from "./context";

export interface Policy {
  name: string;
  priority: number;
  check(ctx: AuthContext, action: Action, resource?: any): Promise<Decision>;
}

type DecisionHook = (
  decision: Decision,
  ctx: AuthContext,
  action: Action,
) => void;

export class SecurityEngine {
  private policies: Policy[] = [];
  private onDecisionHook?: DecisionHook;

  use(policy: Policy): this {
    this.policies.push(policy);
    this.policies.sort((a, b) => a.priority - b.priority);
    return this;
  }

  onDecision(hook: DecisionHook) {
    this.onDecisionHook = hook;
  }

  async can(
    ctx: AuthContext,
    action: Action,
    resource?: any,
  ): Promise<Decision> {
    let finalDecision: Decision = { allowed: true };

    for (const policy of this.policies) {
      const decision = await policy.check(ctx, action, resource);
      if (!decision.allowed) {
        finalDecision = { ...decision, policyName: policy.name };
        break;
      }
    }

    this.onDecisionHook?.(finalDecision, ctx, action);

    return finalDecision;
  }
}
