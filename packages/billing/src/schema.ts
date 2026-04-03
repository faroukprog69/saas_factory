import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "unpaid",
]);

export function subscriptionRelations(
  subscriptionTable: any,
  targetTable: any,
) {
  return relations(subscriptionTable, ({ one }) => ({
    // ربط الاشتراك بالهدف (الفريق مثلاً)
    target: one(targetTable, {
      fields: [subscriptionTable.targetId],
      references: [targetTable.id],
    }),
  }));
}
export function targetRelations(targetTable: any, subscriptionTable: any) {
  return relations(targetTable, ({ one }) => ({
    subscription: one(subscriptionTable, {
      fields: [targetTable.id],
      references: [subscriptionTable.targetId],
    }),
  }));
}

export function subscription(targetTable: any) {
  return pgTable("subscription", {
    id: text("id").primaryKey(),
    targetId: text("target_id")
      .notNull()
      .references(() => targetTable.id, { onDelete: "cascade" })
      .unique(),

    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripeCustomerId: text("stripe_customer_id").unique(),
    stripePriceId: text("stripe_price_id"),

    status: subscriptionStatusEnum("status").notNull(),

    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  });
}

export function getBillingSchema(targetTable: any) {
  const subscriptionTable = subscription(targetTable);
  const webhookEventTable = pgTable("webhook_event", {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    processed: boolean("processed").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });
  const subscriptionRelationsTable = subscriptionRelations(
    subscriptionTable,
    targetTable,
  );
  const targetRelationsTable = targetRelations(targetTable, subscriptionTable);
  return {
    subscription: subscriptionTable,
    webhookEvent: webhookEventTable,
    subscriptionRelations: subscriptionRelationsTable,
    targetRelations: targetRelationsTable,
  };
}
