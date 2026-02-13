// apps/web/lib/schema.ts
import * as auth from "@faroukprog69/auth/schema";
import * as audit from "@faroukprog69/audit/schema";

export * from "@faroukprog69/audit/schema";
export * from "@faroukprog69/auth/schema";

export const schema = {
  ...audit,
  ...auth,
};
