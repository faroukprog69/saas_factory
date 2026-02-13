# @faroukprog69/db

The core database engine for the SaaS factory, powered by **Drizzle ORM** and **Neon**.

## Features

- **Type-safe** database instance factory.
- Optimized for **Serverless** environments (Neon HTTP).
- Support for custom schemas.

## Usage

```typescript
import { createDb } from "@faroukprog69/db";
import * as schema from "./your-schema";

const db = createDb(process.env.DATABASE_URL!, schema);
```

## Drizzle config

this config is used to generate migrations and types for the database.
drizzle-kit is a tool that generates migrations and types for the database.
`drizzle.config.ts` is the config file for drizzle-kit.

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```
