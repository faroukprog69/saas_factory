import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

export const featureFlags = pgTable("feature_flags", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  description: text("description"),
  type: text("type", { enum: ["boolean", "numeric", "variant"] })
    .notNull()
    .default("boolean"),
  isActive: boolean("is_active").default(true).notNull(),
  rules: jsonb("rules").$type<{
    plans?: Record<string, any>;
    roles?: string[];
    percentage?: number;
    users?: string[];
  }>(),
  defaultValue: text("default_value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flagOverrides = pgTable("flag_overrides", {
  id: text("id").primaryKey(),
  flagKey: text("flag_key")
    .notNull()
    .references(() => featureFlags.key, { onDelete: "cascade" }),

  targetType: text("target_type", { enum: ["user", "team"] }).notNull(),
  targetId: text("target_id").notNull(),

  value: text("value").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const featureFlagsRelations = relations(featureFlags, ({ many }) => ({
  overrides: many(flagOverrides),
}));

export const flagOverridesRelations = relations(flagOverrides, ({ one }) => ({
  flag: one(featureFlags, {
    fields: [flagOverrides.flagKey],
    references: [featureFlags.key],
  }),
}));

export const flagsSchema = {
  featureFlags,
  flagOverrides,
  featureFlagsRelations,
  flagOverridesRelations,
};
