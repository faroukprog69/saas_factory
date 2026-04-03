# @faroukprog69/flags

Database-backed feature flags for SaaS — boolean toggles, numeric limits, A/B variants, and percentage rollouts with per-user/team overrides.

---

## Why This Exists

Most SaaS apps need more than simple on/off flags. You need:

- **Plan-based limits** — "Pro gets 10 workspaces, Free gets 1"
- **Role-based access** — "Admins see the new dashboard, others don't"
- **Gradual rollouts** — "Enable for 20% of teams, then expand"
- **Manual overrides** — "Force-enable for a specific user or team without changing the flag globally"

This library evaluates all of that from a single Postgres table via Drizzle ORM, with a deterministic MurmurHash3-based rollout engine — no third-party flag service needed.

---

## Installation

```bash
pnpm add @faroukprog69/flags
# or
npm install @faroukprog69/flags
```

**Peer dependencies:** `drizzle-orm`, a Postgres driver (e.g. `postgres`)

---

## Quick Start

```ts
import { createFlagClient } from "@faroukprog69/flags";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const db = drizzle(postgres(process.env.DATABASE_URL!));

const flags = createFlagClient({ db });

const context = {
  userId: "user_123",
  teamId: "team_abc",
  userRole: "admin",
  planId: "pro",
};

// Boolean toggle
const canExport = await flags.isEnabled("export-csv", context);

// Numeric limit (e.g. plan quota)
const maxSeats = await flags.getLimit("max-team-seats", context);

// A/B variant
const dashboardVariant = await flags.getVariant("dashboard-layout", context);
```

---

## Database Setup

Add the schema to your Drizzle config and run migrations:

```ts
import { flagsSchema } from "@faroukprog69/flags/schema";

// merge into your existing schema
export default { ...yourSchema, ...flagsSchema };
```

- **`feature_flags` table** — stores flag definitions, rules, and default values.
- **`flag_overrides` table** — per-user or per-team overrides, cascades on flag delete.

---

## Core Concepts

### FlagContext

Passed on every evaluation. Provide whichever fields you have — the engine uses relevant ones automatically.

```ts
type FlagContext = {
  userId?: string;
  teamId?: string;
  userRole?: string;
  planId?: string;
};
```

### Flag Types

| Type      | `isEnabled` | `getLimit` | `getVariant` |
| --------- | ----------- | ---------- | ------------ |
| `boolean` | ✅          | —          | —            |
| `numeric` | —           | ✅         | —            |
| `variant` | —           | —          | ✅           |

### Evaluation Priority

1. **Manual override** — a row in `flag_overrides` matching `userId` or `teamId`
2. **User whitelist** — `rules.users` contains the `userId`
3. **Role match** — `rules.roles` contains the `userRole`
4. **Plan value** — `rules.plans[planId]` is defined
5. **Percentage rollout** — deterministic hash of `flagKey + targetId` vs `rules.percentage`
   - `teamId` takes priority over `userId` for hashing

6. **Default value** — `feature_flags.defaultValue`

---

### Rules Schema (JSONB)

```ts
type FlagRule = {
  users?: string[]; // Whitelisted user IDs
  roles?: string[]; // Matching roles get enabled
  plans?: Record<string, any>; // planId → boolean | number | string
  percentage?: number; // 0–100 rollout percentage
};
```

---

## API Overview

### `createFlagClient(config)`

Factory function. Returns a client bound to your DB instance.

```ts
const flags = createFlagClient({ db });
```

---

### `flags.isEnabled(key, context): Promise<boolean>`

Returns `true` if the flag is active and evaluates to a truthy value for this context. Defaults to `false` if the flag is missing or inactive.

```ts
if (
  await flags.isEnabled("new-onboarding", { userId: "u_1", planId: "free" })
) {
  return redirect("/onboarding-v2");
}
```

---

### `flags.getLimit(key, context): Promise<number>`

Returns a numeric value. Defaults to `0` if the flag is missing or inactive.

```ts
const maxProjects = await flags.getLimit("max-projects", { planId: "pro" });
if (projectCount >= maxProjects)
  throw new PlanLimitError("Project limit reached");
```

---

### `flags.getVariant(key, context): Promise<string>`

Returns a string value. Defaults to `"null"` if the flag is missing or inactive.

```ts
const layout = await flags.getVariant("sidebar-layout", { userId: "u_1" });
// → "compact" | "expanded" | "hidden"
```

---

## Example Use Case

**Plan-based seat limits with a team override:**

```ts
// DB flag:
// key: "max-team-members"
// type: "numeric"
// defaultValue: "5"
// rules: { plans: { starter: 3, pro: 25, enterprise: -1 } }

// DB override:
// flagKey: "max-team-members", targetType: "team", targetId: "team_vip", value: "100"

const context = { teamId: "team_vip", planId: "starter" };
const limit = await flags.getLimit("max-team-members", context);
// → 100 (override wins, even though plan says 3)

const context2 = { teamId: "team_regular", planId: "pro" };
const limit2 = await flags.getLimit("max-team-members", context2);
// → 25 (plan rule)
```

**Gradual feature rollout:**

```ts
// rules: { percentage: 20 }
const enabled = await flags.isEnabled("new-editor", { teamId: "team_xyz" });
// ~20% of teams enabled, deterministic per teamId
```

---

## Folder Structure

```
src/
├── index.ts        # createFlagClient, FlagClient type
├── engine.ts       # FlagEngine — pure evaluation logic
├── schema.ts       # Drizzle schema (featureFlags, flagOverrides)
├── types.ts        # FlagContext, FlagRule, DBInstance
└── murmurhash.ts   # MurmurHash3 — deterministic rollout hashing
```

---

## Notes & Design Decisions

- **Two DB queries per evaluation** — one for the flag, one for overrides. Add caching at `createFlagClient` level if needed.
- **Deterministic rollouts** — MurmurHash3 ensures consistent results for the same user/team.
- **Stateless engine** — `FlagEngine.evaluate()` is pure; unit-testable without DB.
- **`teamId` vs `userId`** — `teamId` is used for percentage rollouts if both are present.
- **Inactive flags** — `isEnabled` → false, `getLimit` → 0, `getVariant` → `"null"`.
- **Plan numeric values** — negative numbers like `-1` are returned literally; conventionally can indicate "unlimited".
- **No admin UI** — this is an evaluation layer; manage flags via DB or your tooling.
