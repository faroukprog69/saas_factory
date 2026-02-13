import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

export function createDb<T extends Record<string, unknown>>(
  connectionString: string,
  schema: T,
) {
  const client = neon(connectionString);
  const db = drizzle(client, { schema });

  return db;
}
