"use server";
import { createAudit } from "@faroukprog69/audit";
import { db } from "./db";

export const { logAudit } = createAudit({ db });
