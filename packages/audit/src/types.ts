import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { actorTypeEnum, auditLog } from "./schema";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError };

export type ServiceError = {
  code:
    | "VALIDATION_ERROR"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "CONFLICT"
    | "INVALID_ACTION"
    | "EXPIRED"
    | "INTERNAL_ERROR";
  message: string;
};

export type AuditActorType = (typeof actorTypeEnum.enumValues)[number];

// Actions
export type AuditAction =
  | "team.create"
  | "team.update"
  | "team.delete"
  | "member.add"
  | "member.update"
  | "member.remove"
  | "invite.create"
  | "invite.accept"
  | "invite.revoke"
  | string;

export const AuditActors: AuditActorType[] = ["user", "system", "api"];

export type AuditEntityType = string;
export type AuditTargetType = string;

export interface LogAuditParams {
  actorId?: string;
  actorType: AuditActorType;
  entityType: AuditEntityType;
  entityId?: string;
  action: AuditAction;
  targetId?: string;
  targetType?: AuditTargetType;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

export type AuditSelect = InferSelectModel<typeof auditLog>;
export type AuditInsert = InferInsertModel<typeof auditLog>;

/* =====================================================
   ENUM TYPES (DB enums → TS unions)
===================================================== */
