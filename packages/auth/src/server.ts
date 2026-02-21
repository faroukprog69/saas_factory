import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import type { BetterAuthOptions } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";

export function createAuth(
  db: Parameters<typeof drizzleAdapter>[0],
  authSchema: Record<string, any>,
  options?: Partial<BetterAuthOptions>,
  admin?: {
    ac: any;
    roles: Record<string, any>;
  },
) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
    }),
    plugins: [
      ...(options?.plugins || []),
      admin
        ? adminPlugin({
            ac: admin.ac,
            roles: admin.roles,
          })
        : adminPlugin(),
      nextCookies(),
    ],
    ...options,
  });
}

export type Auth = ReturnType<typeof betterAuth>;
