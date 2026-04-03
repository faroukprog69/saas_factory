# @faroukprog69/security

Policy-based authorization engine for SaaS — composable RBAC, ownership checks, and billing guards with a single `protect()` call.

---

## Why This Exists

Authorization logic in SaaS apps tends to sprawl: role checks in middleware, ownership checks in service functions, plan limit checks scattered across resolvers. This library centralizes all of that into a **priority-ordered policy chain** that runs a consistent `allow / deny + reason` decision on every action.

Use it when you need:

- **Role-based access control** — "only `admin` can delete projects"
- **Ownership enforcement** — "only the resource owner or team owner can edit"
- **Plan-gated actions** — "only allowed if the billing flag permits it"
- **Auditability** — every denial has a named policy and a reason string

---

## Installation

```bash
pnpm add @faroukprog69/security
# or
npm install @faroukprog69/security
```

No peer dependencies. Brings in `@faroukprog69/errors` for typed `AuthorizationError` throws.

---

## Quick Start

```ts
import { setupSecurity } from "@faroukprog69/security";

// Define role → allowed actions
const { protect } = setupSecurity({
  admin: ["project:create", "project:delete", "member:manage"],
  member: ["project:read", "project:update"],
  viewer: ["project:read"],
});

// In your service / API handler
await protect(
  {
    user: { id: "u_1", role: "user" },
    team: { id: "t_1", roleInTeam: "member", plan: "pro" },
    flags: { max_projects: 10 },
  },
  "project:delete",
  { ownerId: "u_1" }, // optional resource
);
// → throws AuthorizationError if denied, returns true if allowed
```

---

## Core Concepts

### AuthContext

Represents the acting principal, passed to every `protect()` call.

```ts
interface AuthContext {
  user: { id: string; role: string };
  team?: { id: string; roleInTeam: string; plan: string };
  flags: Record<string, boolean | number>; // from feature flags
  metadata?: Record<string, any>;
}
```

### Action

A `"resource:operation"` string. Operations are `create | read | update | delete | manage`. Any string is accepted for custom actions.

```ts
type Action = `${ResourceName}:${Operation}` | (string & {});
// e.g. "project:delete", "billing:manage", "invite:create"
```

### Decision

What every policy returns:

```ts
interface Decision {
  allowed: boolean;
  reason?: string; // Human-readable denial reason
  policyName?: string; // Which policy denied
  final?: boolean; // Optional short-circuit if true
}
```

### Policy Chain

Policies run in **ascending priority order**.

- The first denial short-circuits the chain.
- Policies can optionally short-circuit on allow by returning `{ allowed: true, final: true }`.

```
Priority 1 → BillingPolicy    (plan limits)
Priority 5 → OwnershipPolicy  (resource owner check)
Priority 10 → RBACPolicy      (role permissions)
```

Custom policies can fit anywhere using a numeric priority.

---

## API Overview

### `setupSecurity(roleRules)`

Entry point. Wires `RBACPolicy` + `OwnershipPolicy` and returns a ready-to-use guard.

```ts
const { protect, engine } = setupSecurity({
  admin: ["project:create", "project:delete", "member:manage"],
  member: ["project:read", "project:update"],
});
```

Returns `{ engine, protect }`.

> ⚠️ `BillingPolicy` is **not included by default** because it requires `resource.currentCount`. Add manually via `engine.use(new BillingPolicy())` where needed.

---

### `protect(ctx, action, resource?)`

Throws `AuthorizationError` on denial, returns `true` on success.

```ts
await protect(ctx, "project:update", { ownerId: "u_abc" });
```

---

### `SecurityEngine`

Low-level engine for advanced use:

```ts
import {
  SecurityEngine,
  BillingPolicy,
  RBACPolicy,
  OwnershipPolicy,
} from "@faroukprog69/security";

const engine = new SecurityEngine()
  .use(new BillingPolicy())
  .use(new OwnershipPolicy())
  .use(new RBACPolicy({ admin: ["project:manage"] }));

const decision = await engine.can(ctx, "project:create", { currentCount: 3 });
// { allowed: false, reason: "...", policyName: "BILLING_POLICY" }
```

#### Observability

```ts
engine.onDecision((decision, ctx, action) => {
  logger.info({
    userId: ctx.user.id,
    action,
    allowed: decision.allowed,
    policy: decision.policyName,
    reason: decision.reason,
  });
});
```

#### Conditional checks without exceptions

```ts
if (await engine.cannot(ctx, "project:delete", project)) {
  showWarning("You cannot delete this project");
}
```

---

## Built-in Policies

| Policy            | Priority | Description                                              |
| ----------------- | -------- | -------------------------------------------------------- |
| `BillingPolicy`   | 1        | Blocks actions if resource usage exceeds `ctx.flags`.    |
| `OwnershipPolicy` | 5        | Passes only if the user or team owner owns the resource. |
| `RBACPolicy`      | 10       | Checks role permissions against a static map.            |

---

## Custom Policy

Implement the `Policy` interface:

```ts
import { Policy, AuthContext, Action, Decision } from "@faroukprog69/security";

export class AuditModePolicy implements Policy {
  name = "AUDIT_MODE_POLICY";
  priority = 2;

  async check(ctx: AuthContext, action: Action): Promise<Decision> {
    if (ctx.flags["audit_mode"] && action.endsWith(":delete")) {
      return { allowed: false, reason: "Deletions blocked during audit mode" };
    }
    return { allowed: true, final: true };
  }
}

engine.use(new AuditModePolicy());
```

---

## Example Use Case

```ts
import { setupSecurity, BillingPolicy } from "@faroukprog69/security";

const { engine, protect } = setupSecurity({
  admin: ["project:create", "project:delete", "project:manage"],
  member: ["project:create", "project:read", "project:update"],
  viewer: ["project:read"],
});

engine.use(new BillingPolicy());

engine.onDecision((decision, ctx, action) => {
  auditLog.write({ userId: ctx.user.id, action, ...decision });
});

async function deleteProject(ctx: AuthContext, projectId: string) {
  const project = await db.project.findById(projectId);
  await protect(ctx, "project:delete", { ownerId: project.createdBy });
  return db.project.delete(projectId);
}
```

---

## Folder Structure

```
src/
├── index.ts              # setupSecurity + re-exports
├── context.ts            # AuthContext, Decision, Action types
├── engine.ts             # SecurityEngine class, Policy interface
├── guard.ts              # createGuard → protect()
└── policies/
    ├── rbac.ts           # RBACPolicy
    ├── ownership.ts      # OwnershipPolicy
    └── billing.ts        # BillingPolicy
```

---

## Notes & Design Decisions

- **Policies are async** — can include DB calls without changing interface.
- **Team role takes precedence over user role** — `ctx.team.roleInTeam` used if present.
- **Flags in context** — intentionally loose (`boolean | number`). Hydrate from `@faroukprog69/flags`.
- **Cannot short-circuit** — use `final: true` on allow for early exit.
- **Observability** — use `onDecision()` to log or audit every action.
