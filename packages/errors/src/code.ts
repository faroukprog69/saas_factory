export const ErrorCodes = {
  // Security & Auth
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  VALIDATION_ERROR: "VALIDATION_ERROR",

  // Validation & Logic
  BAD_REQUEST: "BAD_REQUEST",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INVALID_ACTION: "INVALID_ACTION",
  EXPIRED: "EXPIRED",

  // Billing & Limits
  PLAN_LIMIT_REACHED: "PLAN_LIMIT_REACHED",
  PAYMENT_REQUIRED: "PAYMENT_REQUIRED",

  // Server
  INTERNAL_ERROR: "INTERNAL_ERROR",
  WEBHOOK_ERROR: "WEBHOOK_ERROR",
  INVALID_SUBSCRIPTION: "INVALID_SUBSCRIPTION",
} as const;

export type ErrorDetails = Record<string, unknown>;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
