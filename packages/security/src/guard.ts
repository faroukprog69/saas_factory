// packages/security/src/guard.ts
import { SecurityEngine } from "./engine";
import { AuthContext, Action } from "./context";
import { AuthorizationError } from "@faroukprog69/errors";

/**
 * Guard factory that throws if authorization fails
 */
export function createGuard(engine: SecurityEngine) {
  return async (ctx: AuthContext, action: Action, resource?: any) => {
    const decision = await engine.can(ctx, action, resource);
    if (!decision.allowed) {
      throw new AuthorizationError(
        `[${decision.policyName}] ${decision.reason}`,
      );
    }
    return true;
  };
}
