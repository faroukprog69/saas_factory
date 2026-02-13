import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import type { BetterAuthOptions } from "better-auth";

export function createAuth(
  db: Parameters<typeof drizzleAdapter>[0],
  authSchema: Record<string, any>,
  options?: Partial<BetterAuthOptions>,
) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
    }),
    plugins: [nextCookies(), ...(options?.plugins || [])],
    ...options,
  });
}

export type Auth = ReturnType<typeof betterAuth>;
