import { AppError } from "@faroukprog69/errors";
import { AuditInsert } from "./types";
import { ServiceResult } from "@faroukprog69/types";

export function validateAuditParams(params: AuditInsert): ServiceResult<null> {
  if (!params.actorType) {
    return {
      ok: false,
      error: new AppError({
        code: "VALIDATION_ERROR",
        message: "actorType required",
      }),
    };
  }
  if (!params.action) {
    return {
      ok: false,
      error: new AppError({
        code: "VALIDATION_ERROR",
        message: "action required",
      }),
    };
  }
  if (!params.entityType) {
    return {
      ok: false,
      error: new AppError({
        code: "VALIDATION_ERROR",
        message: "entityType required",
      }),
    };
  }
  // مثال: entityId مطلوب لمعظم actions عدا CREATE
  if (!params.entityId && !params.action.endsWith(".create")) {
    return {
      ok: false,
      error: new AppError({
        code: "VALIDATION_ERROR",
        message: "entityId required",
      }),
    };
  }

  return { ok: true, data: null };
}
