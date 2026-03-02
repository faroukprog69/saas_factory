// packages/security/src/guard.ts
import { SecurityEngine } from "./engine";
import { AuthContext, Action } from "./context";

export function createGuard(engine: SecurityEngine) {
  return async (ctx: AuthContext, action: Action, resource?: any) => {
    const decision = await engine.can(ctx, action, resource);

    if (!decision.allowed) {
      // مستقبلاً سنستبدله بـ throw new AuthorizationError()
      throw new Error(
        `[${decision.policyName}] UNAUTHORIZED: ${decision.reason}`,
      );
    }

    return true;
  };
}
