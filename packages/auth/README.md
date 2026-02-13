# @faroukprog69/auth

A modular authentication package built on top of **Better Auth**.

## Features

- **Unified Schema:** Pre-defined tables for Users, Sessions, and Accounts.
- **Factory Pattern:** Easily initialize auth on the server.
- **Client Factory:** Ready-to-use auth client for Next.js.

## Modules

- `@faroukprog69/auth/schema`: Drizzle schema definitions.
- `@faroukprog69/auth/client`: Auth client factory.
- `@faroukprog69/auth`: Server-side initialization.

## Quick Start

```typescript
import { Auth, createAuth } from "@faroukprog69/auth";
import { authSchema } from "@faroukprog69/auth/schema";
import { db } from "./db";

export const auth = createAuth: Auth (db, authSchema, {
  // Better Auth options
});
```

# Better Auth Client

```typescript
import { authClient as authClient_ } from "@faroukprog69/auth/client";

export const authClient = authClient_(your_api_url);
```
