import { AppError } from "@faroukprog69/errors";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };
