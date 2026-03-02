import { AppError } from "./base";

export class AuthorizationError extends AppError {
  constructor(
    message = "You are not authorized to perform this action",
    details?: any,
  ) {
    super({ code: "FORBIDDEN", message, status: 403, details });
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, any>) {
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
