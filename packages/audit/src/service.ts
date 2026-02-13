import { ServiceResult } from "./types";
import { validateAuditParams } from "./helpers";
import { LogAuditParams } from "./types";
import { AuditSelect } from "./types";
import { auditLog } from "./schema";
import type { PgDatabase } from "drizzle-orm/pg-core";

export async function logAudit(
  params: LogAuditParams,
  db: PgDatabase<any, any, any>,
): Promise<ServiceResult<AuditSelect>> {
  const validation = validateAuditParams(params);
  if (!validation.ok) return validation;

  try {
    const result = await db
      .insert(auditLog)
      .values({
        id: crypto.randomUUID(),
        actorId: params.actorId ?? null,
        actorType: params.actorType,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        action: params.action,
        targetId: params.targetId ?? null,
        targetType: params.targetType ?? null,
        metadata: params.metadata ?? null,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      })
      .returning();

    const log = result[0];
    if (!log) {
      return {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create audit log",
        },
      };
    }

    return { ok: true, data: log };
  } catch (err: any) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Unknown error",
      },
    };
  }
}
