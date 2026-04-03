# @faroukprog69/auth

Drop-in Better Auth setup for Next.js + Drizzle — server config, client factory, and Postgres schema in one package.

---

## Why This Exists

Every service in the monorepo needs the same auth wiring: Better Auth + Drizzle adapter + Next.js cookies + admin plugin. This package ships that configuration once, with the Drizzle schema for all auth tables included, so each app just calls `createAuth()` and moves on.

Use it when:

- You're adding auth to a Next.js app in the monorepo
- You want the standard `user / session / account / verification` schema pre-built
- You need optional RBAC via the Better Auth admin plugin

---

## Installation

```bash
pnpm add @faroukprog69/auth better-auth drizzle-orm
```

> `better-auth` and `drizzle-orm` are peer dependencies — install them explicitly.

---

## Quick Start

**1. Create the auth instance (server)**

```typescript
// lib/auth.ts
import { createAuth } from "@faroukprog69/auth";
import { authSchema } from "@faroukprog69/auth/schema";
import { db } from "./db"; // your @faroukprog69/db instance

export const auth = createAuth(db, authSchema, {
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: { enabled: true },
});

export type Auth = typeof auth;
```

**2. Mount the API route (Next.js App Router)**

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

**3. Use the client**

```typescript
// lib/auth-client.ts
import { authClient } from "@faroukprog69/auth/client";

export const client = authClient(process.env.NEXT_PUBLIC_APP_URL!);

// In a component
const { data: session } = await client.useSession();
```

---

## Core Concepts

**`createAuth`** — factory that wires Better Auth with the Drizzle adapter, `nextCookies()`, and the admin plugin. Accepts your db instance and auth schema directly.

**`authSchema`** — pre-built Drizzle schema for all four Better Auth tables (`user`, `session`, `account`, `verification`) with proper indexes and relations. Spread it into your main schema object.

**`authClient`** — thin wrapper around `createAuthClient` from `better-auth/react`. Takes a base URL and returns a typed client for use in React components.

**Admin plugin** — included by default. Pass `ac` and `roles` to enable full RBAC.

---

## API Overview

### `createAuth(db, authSchema, options?, admin?)`

| Param        | Type                         | Description                                     |
| ------------ | ---------------------------- | ----------------------------------------------- |
| `db`         | `DrizzleClient`              | Instance from `@faroukprog69/db`                |
| `authSchema` | `Record<string, any>`        | Import from `@faroukprog69/auth/schema`         |
| `options`    | `Partial<BetterAuthOptions>` | Any Better Auth config (email, OAuth, plugins…) |
| `admin`      | `{ ac, roles }`              | Optional — enables RBAC via the admin plugin    |

**Returns:** A `betterAuth` instance. Export its type as `Auth` for use across the app.

---

### `authClient(baseURL: string)`

```typescript
import { authClient } from "@faroukprog69/auth/client";

const client = authClient("https://myapp.com");
await client.signIn.email({ email, password });
```

---

### `authSchema`

```typescript
import { authSchema } from "@faroukprog69/auth/schema";
// Spread into your full schema if needed
const fullSchema = { ...authSchema, ...appSchema };
```

Includes: `user`, `session`, `account`, `verification` tables + Drizzle relations.

---

## Example Use Case

**Auth with RBAC (admin roles)**

```typescript
// lib/auth.ts
import { createAuth } from "@faroukprog69/auth";
import { authSchema } from "@faroukprog69/auth/schema";
import { createAccessControl } from "better-auth/access";
import { db } from "./db";

const ac = createAccessControl({
  resources: {
    project: ["create", "read", "update", "delete"],
  },
});

const roles = {
  admin: ac.newRole({ project: ["create", "read", "update", "delete"] }),
  member: ac.newRole({ project: ["read"] }),
};

export const auth = createAuth(
  db,
  authSchema,
  {
    secret: process.env.BETTER_AUTH_SECRET!,
    emailAndPassword: { enabled: true },
  },
  { ac, roles },
);
```

---

## Folder Structure

```
src/
├── index.ts      # Re-exports server.ts
├── server.ts     # createAuth factory + Auth type
├── client.ts     # authClient factory (React)
└── schema.ts     # Drizzle auth schema (tables + relations)
```

Three separate export paths:

- `@faroukprog69/auth` → server
- `@faroukprog69/auth/client` → React client
- `@faroukprog69/auth/schema` → Drizzle schema

---

## Notes

- **`nextCookies()` is always included.** Session cookies work out of the box in Next.js server components and middleware.
- **Admin plugin is always registered.** Even without passing `admin`, the plugin is active with default settings. Pass `{ ac, roles }` to enable RBAC.
- **Schema is standalone.** You can merge `authSchema` with your app schema and pass the combined object to `@faroukprog69/db`'s `createDb`.
- **Client is not a singleton.** Call `authClient(baseURL)` once at module level and re-export — don't call it per render.

---
