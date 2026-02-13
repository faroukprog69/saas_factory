# @faroukprog69/audit

Automated audit logging system for tracking user and system actions.

## Features

- **Inferred Types:** Fully typed using Drizzle models.
- **Validation:** Built-in validation for audit parameters.
- **Extensible:** Support for custom metadata and actor types.

## Usage

```typescript
import { createAudit } from "@faroukprog69/audit";
import { db } from "./db";

const { logAudit } = createAudit({ db });

await logAudit({
  actorType: "user",
  actorId: "user-123",
  action: "team.create",
  entityType: "team",
  entityId: "team-456",
  metadata: { name: "Engineering" },
});
```

# Schema

```typescript
import { auditSchema } from "@faroukprog69/audit/schema";
```
