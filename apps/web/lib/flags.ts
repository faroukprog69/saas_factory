// apps/web/lib/flags.ts
import { createFlagClient, FlagClient } from "@faroukprog69/flags";
import { db } from "./db";

export const flags: FlagClient = createFlagClient({ db });
