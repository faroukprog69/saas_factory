// packages/security/src/context.ts

export interface AuthContext {
  user: { id: string; role: string };
  team?: { id: string; roleInTeam: string; plan: string };
  flags: Record<string, boolean | number>;
  metadata?: Record<string, any>;
}

export interface Decision {
  allowed: boolean;
  reason?: string;
  policyName?: string;
  final?: boolean; // allow short-circuit
}

export type ResourceName = string;
export type Operation = "create" | "read" | "update" | "delete" | "manage";
export type Action = `${ResourceName}:${Operation}` | (string & {});

/**
 * Helper to create a full AuthContext for tests / defaults
 */
export function createAuthContext(partial: Partial<AuthContext>): AuthContext {
  return {
    user: { id: "user_1", role: "user", ...partial.user },
    team: partial.team,
    flags: partial.flags || {},
    metadata: partial.metadata || {},
  };
}
