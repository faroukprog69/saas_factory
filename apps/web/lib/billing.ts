import { BillingService, createBilling } from "@faroukprog69/billing";
import { db } from "./db";
import { team } from "./schema";

export const billingService: BillingService = createBilling({
  db: db,
  targetTable: team, // هنا ربطنا الاشتراكات بالفريق
  apiKey: process.env.STRIPE_SECRET_KEY!,
});
