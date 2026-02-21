CREATE TABLE "feature_flags" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'boolean' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"rules" jsonb,
	"default_value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "flag_overrides" (
	"id" text PRIMARY KEY NOT NULL,
	"flag_key" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flag_overrides" ADD CONSTRAINT "flag_overrides_flag_key_feature_flags_key_fk" FOREIGN KEY ("flag_key") REFERENCES "public"."feature_flags"("key") ON DELETE cascade ON UPDATE no action;