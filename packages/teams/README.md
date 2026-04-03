# @faroukprog69/teams

Full team management service for SaaS apps — handles team CRUD, member roles, and email invites with built-in permission enforcement and audit logging.

---

## Why This Exists

Every multi-tenant SaaS needs the same team primitives: create a team, invite members by email, manage roles, enforce who can do what. This package ships all of that as a single typed service factory that plugs into your existing Drizzle DB instance and audit logger — no coupling to a specific HTTP framework or auth system.

Use it when:

- You need teams with role-based access control (`owner → admin → member → viewer`)
- You want invite-by-email with token expiry and revocation
- You need all actions audit-logged consistently

---

## Installation

```bash
pnpm add @faroukprog69/teams drizzle-orm
```

---

## Quick Start

```typescript
// lib/teams.ts
import { createTeams } from "@faroukprog69/teams";
import { getTeamsSchema } from "@faroukprog69/teams/schema";
import { db } from "./db"; // your @faroukprog69/db instance
import { user } from "./auth-schema"; // your Better Auth user table

export const teams = createTeams(user, {
  db,
  logAudit: async (params) => {
    // plug in your audit logger or a no-op
    console.log("[audit]", params);
  },
});

// Merge teams schema into your full DB schema
export const teamsSchema = teamsService.schema;
```

```typescript
// Usage anywhere in your app
const result = await teams.createTeamForUser(userId, "Acme Corp");

if (result.ok) {
  console.log(result.data.slug); // "acme-corp-x7k2"
} else {
  console.error(result.error.code); // "VALIDATION_ERROR" | "INTERNAL_ERROR" | ...
}
```

---

## Core Concepts

**`createTeams(userSchema, deps)`** — the main factory. Takes your user table and dependencies, returns a fully bound `TeamsService` object. All internal schema wiring happens here — you never import individual service functions directly.

**Schema is dynamic** — `getTeamsSchema(user)` generates the `team`, `teamMember`, and `teamInvite` Drizzle tables at runtime, referencing your user table's primary key. This keeps the package decoupled from your auth setup.

**Role hierarchy** — four roles with enforced power levels:

```
owner (3) > admin (2) > member (1) > viewer (0)
```

An actor can only assign or modify roles strictly below their own level — except the primary owner, who has unrestricted control.

**`ServiceResult<T>`** — every method returns `{ ok: true, data: T } | { ok: false, error: AppError }`. No throws, no uncaught promises.

**Audit log** — every mutating action calls `logAudit` with a structured payload. You supply the implementation.

---

## API Overview

All methods are on the object returned by `createTeams()`.

### Team

| Method                                       | Description                                                                                        |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `createTeamForUser(userId, name)`            | Creates a team and makes the user the owner. Auto-generates a unique slug with retry on collision. |
| `updateTeam(teamId, currentUserId, updates)` | Updates team fields. Owner-only. `id`, `ownerId`, `slug`, timestamps are immutable.                |
| `deleteTeam(currentUserId, teamId)`          | Hard deletes team and all members. Primary owner only.                                             |

### Members

| Method                                            | Description                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `addMember(teamId, userId, currentUserId, role)`  | Directly adds a user. Checks for pending invites to avoid conflicts.            |
| `changeRole(teamId, userId, currentUserId, role)` | Changes a member's role. Cannot self-modify. Role hierarchy enforced.           |
| `removeMember(teamId, userId, currentUserId)`     | Removes a member. Cannot remove yourself, the primary owner, or the last owner. |

### Invites

| Method                                             | Description                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| `createInvite(teamId, currentUserId, email, role)` | Creates a 24-hour invite token for an email. Prevents duplicate invites. |
| `acceptInvite(token, userId)`                      | Validates token (not expired, not used/revoked) and adds user as member. |
| `revokeInvite(teamId, currentUserId, inviteId)`    | Cancels a pending invite. Admin/owner only.                              |

### Schema

```typescript
teams.schema; // { team, teamMember, teamInvite, teamRelations, ... }
```

Spread into your full Drizzle schema for migrations and `db.query.*` relational support.

---

## Example Use Case

**Full invite flow: send → accept**

```typescript
// 1. Owner invites a user by email
const invite = await teams.createInvite(
  teamId,
  ownerUserId,
  "dev@example.com",
  "member",
);
// invite.data.token → send this via email

// 2. User clicks the link, your handler calls:
const result = await teams.acceptInvite(token, newUserId);

if (result.ok) {
  // result.data = new teamMember row
  redirect(`/teams/${teamId}/dashboard`);
}
```

**Role change with permission enforcement**

```typescript
const result = await teams.changeRole(
  teamId,
  targetUserId,
  adminUserId,
  "viewer",
);

if (!result.ok) {
  // result.error.code === "INVALID_ACTION" → tried to assign equal/higher role
  // result.error.code === "UNAUTHORIZED"   → not an admin/owner
}
```

---

## Folder Structure

```
src/
├── index.ts          # createTeams factory + TeamsService type
├── schema.ts         # getTeamsSchema() — dynamic Drizzle table definitions
├── permissions.ts    # Permissions object — all role enforcement logic
├── helpers.ts        # getMembershipWithTeam(), generateTeamSlug(), slugify()
├── types.ts          # TeamRole, TeamStatus, DBInstance
└── services/
    ├── team.ts       # createTeamForUser, updateTeam, deleteTeam
    ├── member.ts     # addMember, changeRole, removeMember
    └── invite.ts     # createInvite, acceptInvite, revokeInvite
```

Two export paths:

- `@faroukprog69/teams` → service factory + permissions + types
- `@faroukprog69/teams/schema` → Drizzle schema for migrations

---

## Notes

- **All mutations run inside transactions.** If any step fails (e.g. audit log), the whole operation rolls back.
- **Schema is injected, not imported.** `getTeamsSchema(user)` requires your user table at runtime. This means you must run migrations after calling it — never hardcode the output.
- **`Permissions` is exported.** Use it directly if you need permission checks outside the service (e.g. in middleware or UI guards).
- **Slug collision is handled.** `createTeamForUser` retries up to 5 times on unique constraint violations (`pg error 23505`) before failing.
- **Invites expire in 24 hours** and are single-use. Accepting or revoking sets `acceptedAt`/`revokedAt` — the token cannot be reused.
