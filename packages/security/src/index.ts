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

export function setupSecurity(roleRules: Record<string, string[]>) {
  const engine = new SecurityEngine()
    .use(new RBACPolicy(roleRules))
    .use(new OwnershipPolicy());

  const protect = createGuard(engine);

  return { engine, protect };
}
