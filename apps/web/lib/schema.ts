// apps/web/lib/schema.ts
import { authSchema } from "@faroukprog69/auth/schema";
import { auditSchema } from "@faroukprog69/audit/schema";

export * from "@faroukprog69/audit/schema";
export * from "@faroukprog69/auth/schema";

export const schema = {
  ...auditSchema,
  ...authSchema,
};
