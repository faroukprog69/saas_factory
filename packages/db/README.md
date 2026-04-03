# @faroukprog69/db

Thin, typed Drizzle ORM client factory for Neon serverless Postgres — zero boilerplate, schema-aware from the start.

---

## Why This Exists

Setting up Drizzle with Neon serverless requires the same boilerplate in every service: configuring the WebSocket constructor, creating a pool, and wiring the schema. This package centralizes that setup into a single factory function so every app in the monorepo gets a consistent, type-safe DB client in one line.

Use it when:

- You're building a service in the monorepo that needs a Neon Postgres connection
- You want full Drizzle type inference tied to your schema from the start

---

## Installation

```bash
pnpm add @faroukprog69/db drizzle-orm
```

> `drizzle-orm` is a peer dependency — install it explicitly in your app.

---

## Quick Start

```typescript
import { createDb } from "@faroukprog69/db";
import * as schema from "./schema"; // your Drizzle schema

const db = createDb(process.env.DATABASE_URL!, schema);

// Fully typed query
const users = await db.query.users.findMany({
  where: (u, { eq }) => eq(u.active, true),
});
```

That's it. `db` is a fully typed Drizzle client scoped to your schema.

---

## Core Concepts

**`createDb(connectionString, schema)`**  
The single export. Internally it:

1. Sets the Neon WebSocket constructor (`ws`) for serverless environments
2. Creates a `Pool` via `@neondatabase/serverless`
3. Returns a `drizzle(pool, { schema })` instance

The return type is fully inferred from your schema — no manual typing needed.

---

## API Overview

### `createDb<T>(connectionString: string, schema: T): DrizzleClient<T>`

| Param              | Type                      | Description                                               |
| ------------------ | ------------------------- | --------------------------------------------------------- |
| `connectionString` | `string`                  | Neon Postgres connection string (`postgresql://...`)      |
| `schema`           | `Record<string, unknown>` | Your Drizzle schema object (all tables exported together) |

**Returns:** A Drizzle ORM client instance with full schema type inference.

```typescript
import { createDb } from "@faroukprog69/db";
import * as schema from "./db/schema";

export const db = createDb(process.env.DATABASE_URL!, schema);
export type DB = typeof db;
```

---

## Example Use Case

**Setting up a shared DB client for a `teams` service:**

```typescript
// apps/teams-service/src/db/index.ts
import { createDb } from "@faroukprog69/db";
import * as schema from "./schema";

export const db = createDb(process.env.DATABASE_URL!, schema);

// apps/teams-service/src/db/schema.ts
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// apps/teams-service/src/services/teams.service.ts
import { db } from "../db";
import { teams } from "../db/schema";
import { eq } from "drizzle-orm";

export async function getTeam(id: string) {
  return db.query.teams.findFirst({
    where: eq(teams.id, id),
  });
}
```

---

## Folder Structure

```
src/
├── index.ts       # Re-exports everything
├── client.ts      # createDb factory (core logic)
└── types.ts       # Shared type imports from @faroukprog69/types
```

---

## Notes

- **WebSocket is pre-configured.** The `ws` package is bundled — no extra setup needed for Node.js / serverless environments.
- **Stateless factory.** Each `createDb` call creates a new pool. Call it once per service at module level, not per request.
- **Monorepo-first.** Published to GitHub Packages under `@faroukprog69`. Requires `.npmrc` auth to install in other workspaces.
- **Drizzle Kit scripts** (`db:generate`, `db:push`, `db:studio`) are available — add a `drizzle.config.ts` at the package root to use them.

```ts
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```
