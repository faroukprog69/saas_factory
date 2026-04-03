# @faroukprog69/audit

Structured audit logging service for SaaS apps — records who did what, to which entity, with IP masking and permission-gated reads.

---

## Why This Exists

Every production SaaS needs a tamper-evident trail of user and system actions. This package provides a typed `logAudit()` function backed by a Postgres table, with built-in validation, `ServiceResult` error handling, and a utility layer for formatting and access control — so every service in the monorepo logs consistently.

Use it when:

- You need to track team, member, invite, or any domain action
- You want structured logs queryable by actor, entity, or action
- You need to gate audit log reads by user identity or admin status

---

## Installation

```bash
pnpm add @faroukprog69/audit drizzle-orm
```

---

## Quick Start

```typescript
// lib/audit.ts
import { createAudit } from "@faroukprog69/audit";
import { db } from "./db"; // your @faroukprog69/db instance

export const audit = createAudit({ db });

// Log an action anywhere in your app
const result = await audit.logAudit({
  actorId: "user_123",
  actorType: "user",
  entityType: "team",
  entityId: "team_456",
  action: "team.update",
  metadata: { name: "New Name" },
});

if (!result.ok) {
  console.error(result.error.code);
}
```

---

## Core Concepts

**`createAudit({ db })`** — factory that binds your DB instance and returns a `{ logAudit }` object. Call once at module level, reuse everywhere.

**`AuditInsert`** — the shape of every log entry. Inferred directly from the Drizzle schema — no manual type maintenance.

**Validation** — `actorType`, `action`, and `entityType` are always required. `entityId` is required for all actions except those ending in `.create`.

**`ServiceResult<T>`** — `logAudit` never throws. It returns `{ ok: true, data }` or `{ ok: false, error: AppError }`.

**Actor types** — `"user" | "system" | "api"` enforced at the DB level via a Postgres enum.

---

## API Overview

### `createAudit(deps)`

```typescript
const audit = createAudit({ db });
```

Returns `{ logAudit }` bound to your DB instance.

---

### `audit.logAudit(params: AuditInsert)`

Inserts a row into `audit_log`. Returns `ServiceResult<AuditSelect>`.

```typescript
await audit.logAudit({
  actorId: "user_abc",
  actorType: "user", // "user" | "system" | "api"
  entityType: "invite",
  entityId: "invite_xyz",
  action: "invite.revoke",
  targetId: "user_def", // optional — the affected user
  metadata: { reason: "expired" },
  ip: "192.168.1.1", // optional
  userAgent: "Mozilla/5.0", // optional
});
```

**Built-in `AuditAction` suggestions** (open union — any string is valid):

```typescript
type AuditAction =
  | "team.create"
  | "team.update"
  | "team.delete"
  | "member.add"
  | "member.update"
  | "member.remove"
  | "invite.create"
  | "invite.accept"
  | "invite.revoke"
  | string; // extend freely
```

---

### `canViewAudit(userId, isAdmin, log)`

Permission check for reading a single log entry.

```typescript
import { canViewAudit } from "@faroukprog69/audit";

if (!canViewAudit(currentUserId, currentUser.isAdmin, log)) {
  throw new Error("Forbidden");
}
```

Admins see everything. Regular users can only see logs where they are the actor or target.

---

### `formatAuditLog(log)`

Formats a log for API responses — masks the IP and converts `createdAt` to ISO string.

```typescript
import { formatAuditLog } from "@faroukprog69/audit";

const safe = formatAuditLog(log);
// safe.ip → "192.168.1.xxx"
// safe.createdAt → "2024-01-15T10:30:00.000Z"
```

---

### `maskIp(ip)`

Standalone IP masking utility.

```typescript
import { maskIp } from "@faroukprog69/audit";

maskIp("192.168.1.42"); // → "192.168.1.xxx"
maskIp(null); // → null
```

---

## Example Use Case

**Logging across services and gating reads in an API route**

```typescript
// In your teams service
import { createAudit } from "@faroukprog69/audit";
import { db } from "@/lib/db";

const audit = createAudit({ db });

await audit.logAudit({
  actorId: session.userId,
  actorType: "user",
  entityType: "team",
  entityId: team.id,
  action: "team.delete",
  metadata: { teamName: team.name },
});

// In your audit API route
import { canViewAudit, formatAuditLog } from "@faroukprog69/audit";

const logs = await db.query.auditLog.findMany({
  where: eq(auditLog.entityId, teamId),
});

const visible = logs
  .filter((log) => canViewAudit(session.userId, session.isAdmin, log))
  .map(formatAuditLog);

return Response.json(visible);
```

---

## Folder Structure

```
src/
├── index.ts       # createAudit factory — main entry point
├── service.ts     # logAudit() implementation
├── schema.ts      # auditLog table + actorTypeEnum + auditSchema
├── types.ts       # AuditInsert, AuditSelect, AuditAction, AuditActorType
├── helpers.ts     # validateAuditParams()
├── permissions.ts # canViewAudit()
└── utils.ts       # formatAuditLog(), maskIp()
```

Two export paths:

- `@faroukprog69/audit` → factory, types, utils, permissions
- `@faroukprog69/audit/schema` → Drizzle schema for migrations

---

## Notes

- **Schema is static.** Unlike `@faroukprog69/teams`, the audit schema doesn't depend on your user table — import `auditSchema` and spread it directly into your full schema.
- **`entityId` validation has a `.create` exception.** If your action naming convention changes, update `validateAuditParams` accordingly.
- **Logs are append-only by design.** There is no update or delete method — this is intentional for audit integrity.
- **Pass `audit.logAudit` directly as `logAudit` to `createTeams`.** The signatures are compatible.

```typescript
const audit = createAudit({ db });
const teams = createTeams(userSchema, { db, logAudit: audit.logAudit });
```

---

## Improvements will be added in the future

**1. `entityId` validation rule is fragile**
The check `!params.action.endsWith(".create")` relies on a naming convention that isn't enforced anywhere. Consider an explicit `requiresEntityId` flag or a whitelist of exempt actions.

**2. No query helpers**
The package logs well but provides no typed helpers to query logs (e.g. `getLogsByEntity`, `getLogsByActor`). Consumers currently write raw Drizzle queries against the schema.

**3. IP masking is lossy for IPv6**
`maskIp` splits on `.` — it will not mask IPv6 addresses correctly. Consider a regex-based approach that handles both formats.

**4. `metadata` is untyped `jsonb`**
`metadata` accepts any object. A generic on `AuditInsert` or a discriminated union per `action` would make logs more queryable and self-documenting.
