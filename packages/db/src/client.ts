import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);

export function db({ schema: anotherSchema }: { schema?: typeof schema } = {}) {
  return drizzle({ client: sql, schema: { ...schema, ...anotherSchema } });
}
