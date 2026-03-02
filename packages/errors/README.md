# @faroukprog69/errors

A standardized error-handling system for the SaaS Factory. This package ensures that every error across the ecosystem follows a predictable structure, making debugging easier for developers and providing clear feedback to users.

## ✨ Features

- **Standardized Structure**: Every error includes a `code`, `status`, `message`, and `details`.
- **Type-Safe Codes**: Prevents magic strings by using a central `ErrorCodes` registry.
- **Built-in Templates**: Ready-to-use classes for Auth, Validation, and Billing limits.
- **Frontend-Ready**: Simple `.toJSON()` method for consistent API responses.

---

## 🚀 Basic Usage

### Throwing a Built-in Error

Use pre-defined templates for common SaaS scenarios:

```typescript
import { PlanLimitError, AuthorizationError } from "@faroukprog69/errors";

// In a Server Action
if (projectsCount >= 5) {
  throw new PlanLimitError(
    "You have reached the maximum number of projects for the Free plan.",
  );
}

// In a Security Guard
if (!isAllowed) {
  throw new AuthorizationError(
    "You don't have permission to delete this team.",
  );
}
```

### Catching and Formatting

Handle errors globally in your API or Server Actions:

```typescript
import { isAppError } from "@faroukprog69/errors";

try {
  await doSomething();
} catch (err) {
  if (isAppError(err)) {
    return err.toJSON(); // Returns { error: { code, message, details } }
  }

  // Handle unknown errors
  console.error(err);
  return { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } };
}
```

---

## 🛠️ Extending (Custom Errors)

You can create your own specialized errors by extending the `AppError` class:

```typescript
import { AppError } from "@faroukprog69/errors";

export class StorageError extends AppError {
  constructor(message: string, details?: any) {
    super({
      code: "INTERNAL_ERROR",
      message: `[Storage Engine] ${message}`,
      status: 500,
      details,
    });
    this.name = "StorageError";
  }
}
```

---

## 📦 API Reference

### `AppError`

The base class for all operational errors.

- `code`: A string code (e.g., `BAD_REQUEST`).
- `status`: HTTP status code (default: `500`).
- `details`: Optional object for extra context (e.g., validation fields).

### `ErrorCodes`

A frozen object containing all supported system error codes to ensure consistency.
