# @faroukprog69/teams

A robust, enterprise-ready Team Management library built with **Drizzle ORM** and **PostgreSQL**. This package handles the complexities of multi-tenancy, member roles (RBAC), and invitation workflows.

## Features

- **Dynamic Schema Injection**: Inject your existing User schema to create seamless foreign key relationships.
- **Role-Based Access Control (RBAC)**: Built-in permission logic for `Owner`, `Admin`, `Member`, and `Viewer`.
- **Atomic Transactions**: Powered by PostgreSQL transactions to ensure data integrity (e.g., creating a team and its first member simultaneously).
- **Audit-Ready**: Requires a `logAudit` dependency to track every administrative action.
- **Invitation System**: Secure token-based invites with expiration and revocation logic.
- **Slug Management**: Automatic URL-friendly slug generation with conflict handling.

---

## Installation

```bash
pnpm add @faroukprog69/teams
```

> **Note:** This package requires **WebSockets** support for transactions. Ensure you use `@neondatabase/serverless` with the `Pool` client and `ws` configured.

---

## Database Architecture

The package manages three core tables:

1. **Team**: Stores team metadata (Name, Slug, Plan, Status).
2. **Team Member**: Pivot table linking Users to Teams with specific roles.
3. **Team Invite**: Handles pending invitations and joining tokens.

---

## Usage

### 1. Initialize Teams Service & Schema

The service acts as the factory. By initializing it with your `user` schema and database instance, it generates the corresponding team schemas automatically.

```typescript
import { createTeams } from "@faroukprog69/teams";
import { authSchema } from "@faroukprog69/auth/schema";
import { db } from "./db";
import { logAudit } from "./audit";

// 1. Initialize the service
// Passing your user table ensures foreign key integrity
export const teams = createTeams(authSchema.user, {
  db: db,
  logAudit: logAudit,
});

// 2. Export the generated schema for Drizzle migrations/queries
export const teamsSchema = teams.schema;
```

### 2. Register with Drizzle

To make Drizzle aware of the new tables, combine the generated `teamsSchema` into your main schema object:

```typescript
export const schema = {
  ...authSchema,
  ...teamsSchema,
};
```

---

## API Reference

All service methods return a consistent `ServiceResult<T>` object:
`{ ok: true, data: T }` OR `{ ok: false, error: { code: string, message: string } }`

### Team Management

- `createTeamForUser(userId, name)`: Creates a team and assigns the user as the `owner`.
- `updateTeam(teamId, userId, updates)`: Updates team details (Owner only).
- `deleteTeam(userId, teamId)`: Permanently removes a team and all associated data.

### Membership Management

- `addMember(teamId, userId, currentUserId, role)`: Directly adds a user to a team.
- `changeRole(teamId, userId, currentUserId, role)`: Updates an existing member's role.
- `removeMember(teamId, userId, currentUserId)`: Removes a user from the team.

### Invitation Workflow

- `createInvite(teamId, currentUserId, email, role)`: Generates a secure invite token.
- `acceptInvite(token, userId)`: Validates token and joins the user to the team.
- `revokeInvite(teamId, currentUserId, inviteId)`: Cancels a pending invitation.

---

## Permission Matrix

| Action          | Owner | Admin | Member | Viewer |
| --------------- | ----- | ----- | ------ | ------ |
| Delete Team     | ✅    | ❌    | ❌     | ❌     |
| Invite Members  | ✅    | ✅    | ❌     | ❌     |
| Change Roles    | ✅    | ✅\*  | ❌     | ❌     |
| Update Settings | ✅    | ✅    | ❌     | ❌     |
| View Team Data  | ✅    | ✅    | ✅     | ✅     |

\*_Admins cannot modify Owners or assign roles higher than their own._
