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
}

export type ResourceName = string;
export type Operation = "create" | "read" | "update" | "delete" | "manage";
export type Action = `${ResourceName}:${Operation}` | (string & {});
