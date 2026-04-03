import { Base } from "@faroukprog69/errors";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: Base.AppError };
