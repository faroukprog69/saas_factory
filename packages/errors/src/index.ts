export * from "./code";
export * from "./base";
export * from "./templates";

import { AppError } from "./base";

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
