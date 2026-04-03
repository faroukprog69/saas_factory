# @faroukprog69/errors

Consistent, typed error handling for APIs and services — predictable JSON responses, shared error codes, and zero runtime dependencies.

---

## Why This Exists

Unstructured errors (`throw new Error("something broke")`) don’t scale in production SaaS.

This library gives you:

- A **single `AppError` class** with `code`, `status`, `message`, and `details`
- A **fixed set of error codes** across auth, validation, billing, and server logic
- **Pre-built error templates** for common cases (auth, validation, limits, not found)
- A consistent `.toJSON()` shape for API responses
- A safe way to handle unknown errors (`AppError.fromUnknown`)

Use it in API routes, services, background jobs, and anywhere you need predictable error handling.

---

## Installation

```bash
pnpm add @faroukprog69/errors
# or
npm install @faroukprog69/errors
```

---

## Quick Start

```ts
import { AppError, isAppError } from "@faroukprog69/errors";

// Throw a typed error
throw new AppError({
  code: "NOT_FOUND",
  message: "Team not found",
  status: 404,
  details: { teamId: "abc123" },
});

// Handle it
try {
  await getTeam(id);
} catch (err) {
  if (isAppError(err)) {
    return res.status(err.status).json(err.toJSON());
  }

  // fallback
  throw err;
}
```

---

## Core Concepts

### `AppError`

Base error class. All errors extend this.

Carries:

- `code` → stable error identifier
- `message` → human-readable message
- `status` → HTTP status (defaults to `500`)
- `details` → optional structured metadata

---

### `ErrorCodes`

A constant map of all valid error codes.

```ts
import { ErrorCodes } from "@faroukprog69/errors";

ErrorCodes.NOT_FOUND;
```

Use these instead of raw strings.

---

### `ErrorCode`

TypeScript union of all valid error codes.

Useful for typing APIs and internal logic.

---

### `isAppError(error, code?)`

Type guard for safe error handling.

```ts
if (isAppError(err)) {
  // err is AppError
}

if (isAppError(err, "NOT_FOUND")) {
  // narrowed by code
}
```

---

### `AppError.fromUnknown(err)`

Convert unknown errors into safe `AppError` instances.

```ts
try {
  ...
} catch (err) {
  throw AppError.fromUnknown(err);
}
```

---

## API Overview

### `AppError`

```ts
new AppError({
  code: "CONFLICT",
  message: "Email already in use",
  status: 409,
  details: { field: "email" },
});
```

| Field     | Type                      | Required | Default |
| --------- | ------------------------- | -------- | ------- |
| `code`    | `ErrorCode`               | ✅       | —       |
| `message` | `string`                  | ✅       | —       |
| `status`  | `number`                  | ❌       | `500`   |
| `details` | `Record<string, unknown>` | ❌       | —       |

---

### `.toJSON()`

Returns a consistent API-safe error shape:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Email already in use",
    "details": { "field": "email" }
  }
}
```

> In production (`NODE_ENV=production`), `details` is omitted to avoid leaking internal data.

---

## Error Codes

| Code                   | Category   |
| ---------------------- | ---------- |
| `UNAUTHORIZED`         | Auth       |
| `FORBIDDEN`            | Auth       |
| `VALIDATION_ERROR`     | Validation |
| `BAD_REQUEST`          | Validation |
| `NOT_FOUND`            | Logic      |
| `CONFLICT`             | Logic      |
| `INVALID_ACTION`       | Logic      |
| `EXPIRED`              | Logic      |
| `PLAN_LIMIT_REACHED`   | Billing    |
| `PAYMENT_REQUIRED`     | Billing    |
| `INTERNAL_ERROR`       | Server     |
| `WEBHOOK_ERROR`        | Server     |
| `INVALID_SUBSCRIPTION` | Server     |

---

## Templates

Pre-built error classes for common cases. Prefer these over raw `AppError`.

---

### `UnauthorizedError` → `401 UNAUTHORIZED`

```ts
import { UnauthorizedError } from "@faroukprog69/errors";

throw new UnauthorizedError();
throw new UnauthorizedError("You must be logged in");
```

---

### `AuthorizationError` → `403 FORBIDDEN`

```ts
import { AuthorizationError } from "@faroukprog69/errors";

throw new AuthorizationError();
throw new AuthorizationError("Only admins can perform this action");
```

---

### `ValidationError` → `400 BAD_REQUEST`

```ts
import { ValidationError } from "@faroukprog69/errors";

throw new ValidationError({
  email: "Invalid format",
  name: "Required",
});
```

> Uses `BAD_REQUEST` for HTTP alignment.

---

### `NotFoundError` → `404 NOT_FOUND`

```ts
import { NotFoundError } from "@faroukprog69/errors";

throw new NotFoundError();
throw new NotFoundError("Workspace not found");
```

---

### `PlanLimitError` → `403 PLAN_LIMIT_REACHED`

```ts
import { PlanLimitError } from "@faroukprog69/errors";

throw new PlanLimitError(
  "Your plan allows up to 3 workspaces. Upgrade to add more.",
);
```

---

## Example Use Case

**Billing-gated feature in a service layer:**

```ts
import {
  NotFoundError,
  AuthorizationError,
  PlanLimitError,
  isAppError,
} from "@faroukprog69/errors";

async function createWorkspace(userId: string, orgId: string) {
  const org = await db.org.findUnique({ where: { id: orgId } });
  if (!org) throw new NotFoundError("Org not found");

  const isMember = await db.membership.exists({ userId, orgId });
  if (!isMember) throw new AuthorizationError();

  const count = await db.workspace.count({ where: { orgId } });
  if (count >= org.plan.maxWorkspaces) {
    throw new PlanLimitError(
      `Your plan allows up to ${org.plan.maxWorkspaces} workspaces.`,
    );
  }

  return db.workspace.create({ data: { orgId, createdBy: userId } });
}

// API handler
try {
  const workspace = await createWorkspace(userId, orgId);
  res.status(201).json(workspace);
} catch (err) {
  if (isAppError(err)) {
    return res.status(err.status).json(err.toJSON());
  }

  throw err;
}
```

---

## Folder Structure

```
src/
├── index.ts       # exports + isAppError()
├── code.ts        # ErrorCodes + ErrorCode
├── base.ts        # AppError
└── templates.ts   # Built-in error templates
```

---

## Design Notes

- **No runtime dependencies**
- **`status` defaults to `500`** if invalid or omitted
- **Safe serialization**: hides `details` in production
- **Consistent error envelope**: `{ error: { code, message, details } }`
- **Templates are thin wrappers** — extend `AppError` to create your own
- Works in **Node.js, Bun, serverless, and edge runtimes**

---

## Philosophy

- Errors are part of your API contract
- Codes are for machines, messages are for humans
- Consistency > cleverness
- Fail explicitly, not implicitly
