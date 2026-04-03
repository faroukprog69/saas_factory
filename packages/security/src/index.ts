// packages/security/src/index.ts
export * from "./context";
export * from "./engine";
export * from "./guard";
export * from "./policies/rbac";
export * from "./policies/ownership";
export * from "./policies/billing";

import { SecurityEngine } from "./engine";
import { createGuard } from "./guard";
import { RBACPolicy } from "./policies/rbac";
import { OwnershipPolicy } from "./policies/ownership";
import { BillingPolicy } from "./policies/billing";

/**
 * Setup security engine with default policies.
 * @param roleRules Role → permissions mapping
 * @param extraPolicies Optional additional policies (e.g., BillingPolicy)
 */
export function setupSecurity(
  roleRules: Record<string, string[]>,
  extraPolicies: Array<
    InstanceType<
      typeof RBACPolicy | typeof OwnershipPolicy | typeof BillingPolicy
    >
  > = [],
) {
  const engine = new SecurityEngine()
    .use(new RBACPolicy(roleRules))
    .use(new OwnershipPolicy());

  extraPolicies.forEach((policy) => engine.use(policy));

  const protect = createGuard(engine);
  return { engine, protect };
}
