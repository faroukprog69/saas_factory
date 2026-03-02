# `@faroukprog69/security`

The ultimate **Authorization Engine** for SaaS Factories. This package implements a high-performance **Policy Pipeline** with support for RBAC, Ownership, Billing Entitlements, and Async evaluation.

## 🚀 Key Upgrades (Level 10)

- **Policy Pipeline**: Executes a chain of policies sorted by **Priority**.
- **Decision Objects**: Returns detailed feedback (`allowed`, `reason`, `policyName`) instead of a simple boolean.
- **Async Ready**: All policies support `Promise<Decision>`, allowing for database or cache lookups.
- **Audit Hooks**: Built-in `onDecision` hook to plug in your logging or audit trail system.
- **Typed Actions**: Intelligent string literal types for Actions (e.g., `project:create`).

---

## 🏗️ Architecture: How it Works

The engine processes an `AuthContext` through a series of "Expert" policies:

`Request` ➔ `MaintenancePolicy (P:1)` ➔ `OwnershipPolicy (P:5)` ➔ `RBACPolicy (P:10)` ➔ `Decision`

---

## 💻 Usage

### 1. Initialize the Engine

Setup your roles and initialize the guard:

```typescript
import { setupSecurity } from "@faroukprog69/security";

const ROLES = {
  admin: ["project:create", "project:delete", "team:invite"],
  member: ["project:create"],
};

const { protect, engine } = setupSecurity(ROLES);

// Optional: Add an Audit Log
engine.onDecision((decision, ctx, action) => {
  if (!decision.allowed) {
    console.log(
      `Security Alert: ${ctx.user.id} denied ${action}. Reason: ${decision.reason}`,
    );
  }
});
```

### 2. Protect Your Actions

Use the `protect` guard in your Server Actions. It handles the context and throws detailed errors if unauthorized.

```typescript
export async function updateProject(projectId: string, data: any) {
  const ctx = await getAuthContext(); // User, Team, Flags
  const project = await db.project.find(projectId);

  // This one line checks:
  // 1. Is he an admin/member? (RBAC)
  // 2. Does he own this project? (Ownership)
  // 3. Does his plan allow this? (Billing)
  await protect(ctx, "project:update", project);

  return db.project.update(projectId, data);
}
```

---

## 🧩 Policy API

Each policy follows a simple interface. You can add custom logic easily:

```typescript
import { Policy, AuthContext, Decision } from "@faroukprog69/security";

export class IPBlacklistPolicy implements Policy {
  name = "IP_BLACKLIST";
  priority = 1; // High priority, check this first!

  async check(ctx: AuthContext): Promise<Decision> {
    const isBlacklisted = await checkIP(ctx.metadata?.ip);

    if (isBlacklisted) {
      return { allowed: false, reason: "Your IP is restricted." };
    }

    return { allowed: true };
  }
}

engine.use(new IPBlacklistPolicy());
```

---

## 🛠️ Data Structures

### `AuthContext`

The raw data provided to the engine:

- `user`: Identity and global role.
- `team`: Membership details and team-level role.
- `flags`: Feature toggles and usage limits (e.g., `max_projects: 5`).

### `Decision`

The output of the engine:

- `allowed`: boolean.
- `reason`: Human-readable string for debugging/UI.
- `policyName`: The specific policy that made the decision.
