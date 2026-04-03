import { ErrorCode } from "./code";

export type ErrorDetails = Record<string, unknown>;

function isValidStatus(status: number) {
  return status >= 100 && status <= 599;
}

export interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  status?: number;
  details?: ErrorDetails;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: ErrorDetails;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = "AppError";

    this.code = options.code;
    this.status =
      options.status && isValidStatus(options.status) ? options.status : 500;

    this.details = options.details;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    const isProd = process.env.NODE_ENV === "production";

    return {
      error: {
        code: this.code,
        message: this.message,
        ...(isProd ? {} : { details: this.details }),
      },
    };
  }

  static fromUnknown(err: unknown): AppError {
    if (err instanceof AppError) return err;

    if (err instanceof Error) {
      return new AppError({
        code: "INTERNAL_ERROR",
        message: err.message,
      });
    }

    return new AppError({
      code: "INTERNAL_ERROR",
      message: "Unknown error",
      details: { value: err },
    });
  }
}
