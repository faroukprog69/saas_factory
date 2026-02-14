import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws"; // تأكد إنك منصب مكتبة ws

export function createDb<T extends Record<string, unknown>>(
  connectionString: string,
  schema: T,
) {
  neonConfig.webSocketConstructor = ws;

  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  return db;
}
