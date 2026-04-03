import { AppError } from "./base";
import { ErrorDetails } from "./code";

export class AuthorizationError extends AppError {
  constructor(
    message = "You are not authorized to perform this action",
    details?: ErrorDetails,
  ) {
    super({ code: "FORBIDDEN", message, status: 403, details });
  }
}

export class ValidationError extends AppError {
  constructor(details: ErrorDetails) {
    super({
      code: "BAD_REQUEST",
      message: "Validation failed",
      status: 400,
      details,
    });
  }
}

export class PlanLimitError extends AppError {
  constructor(message: string) {
    super({ code: "PLAN_LIMIT_REACHED", message, status: 403 });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", details?: ErrorDetails) {
    super({
      code: "UNAUTHORIZED",
      message,
      status: 401,
      details,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: ErrorDetails) {
    super({
      code: "NOT_FOUND",
      message,
      status: 404,
      details,
    });
  }
}
