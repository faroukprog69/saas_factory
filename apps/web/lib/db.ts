import { createDb } from "@faroukprog69/db";
import { schema } from "./schema";

export const db = createDb(process.env.DATABASE_URL!, schema);
