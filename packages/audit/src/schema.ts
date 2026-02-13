import {
  pgTable,
  text,
  jsonb,
  timestamp,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

export const actorTypeEnum = pgEnum("actor_type", ["user", "system", "api"]);

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id"),
    actorType: actorTypeEnum("actor_type").notNull(),

    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),

    action: text("action").notNull(),

    targetId: text("target_id"),
    targetType: text("target_type"),

    metadata: jsonb("metadata").notNull().default({}),

    ip: text("ip"),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    auditEntityIndex: index("audit_entity_idx").on(
      table.entityType,
      table.entityId,
    ),
    auditActionIndex: index("audit_action_idx").on(table.action),
    auditActorIndex: index("audit_actor_idx").on(table.actorId),
  }),
);
export const auditSchema = {
  actorTypeEnum,
  auditLog,
} as const;

export type AuditSchema = typeof auditSchema;
