// packages/security/src/engine.ts
import { AuthContext, Decision, Action } from "./context";

export interface Policy {
  name: string;
  priority: number;
  check(
    ctx: AuthContext,
    action: Action,
    resource?: any,
  ): Promise<Decision> | Decision;
}

type DecisionHook = (
  decision: Decision,
  ctx: AuthContext,
  action: Action,
) => void;

export class SecurityEngine {
  private policies: Policy[] = [];
  private onDecisionHooks: DecisionHook[] = [];

  use(policy: Policy): this {
    this.policies.push(policy);
    this.policies.sort((a, b) => a.priority - b.priority);
    return this;
  }

  onDecision(hook: DecisionHook) {
    this.onDecisionHooks.push(hook);
  }

  async can(
    ctx: AuthContext,
    action: Action,
    resource?: any,
  ): Promise<Decision> {
    let finalDecision: Decision = { allowed: true };

    for (const policy of this.policies) {
      const decision = await Promise.resolve(
        policy.check(ctx, action, resource),
      );

      // Allow short-circuit
      if (decision.allowed && decision.final) {
        finalDecision = { ...decision, policyName: policy.name };
        break;
      }

      if (!decision.allowed) {
        finalDecision = { ...decision, policyName: policy.name };
        break; // deny short-circuit
      }
    }

    this.onDecisionHooks.forEach((hook) => hook(finalDecision, ctx, action));

    return finalDecision;
  }

  /**
   * Inverse helper: checks if action is not allowed
   */
  async cannot(
    ctx: AuthContext,
    action: Action,
    resource?: any,
  ): Promise<boolean> {
    const decision = await this.can(ctx, action, resource);
    return !decision.allowed;
  }
}
