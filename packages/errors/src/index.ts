export * as Code from "./code";
export * as Base from "./base";
export * as Templates from "./templates";
export {
  ValidationError,
  AuthorizationError,
  PlanLimitError,
  UnauthorizedError,
  NotFoundError,
} from "./templates";
export { AppError } from "./base";

import { AppError } from "./base";
import { ErrorCode } from "./code";

export function isAppError(
  error: unknown,
  code?: ErrorCode,
): error is AppError {
  if (!(error instanceof AppError)) return false;
  return code ? error.code === code : true;
}
