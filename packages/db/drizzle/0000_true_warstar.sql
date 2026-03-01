CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'read_only' NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "todo" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carbonites" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"sl" text,
	"sg" text,
	"state" text,
	"office" text,
	"pod" text,
	"salary" integer DEFAULT 0,
	"type" text DEFAULT 'FT',
	"seniority" integer DEFAULT 5,
	"location" text,
	"hours" integer,
	"is_partner" boolean DEFAULT false,
	"entity" text,
	"reports_to" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" text PRIMARY KEY NOT NULL,
	"biz" text NOT NULL,
	"tan" text,
	"office_id" text,
	"state" text,
	"phone" text,
	"address" text,
	"email" text,
	"sl" json DEFAULT '[]'::json,
	"partners" json DEFAULT '[]'::json,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pod_budgets" (
	"state" text NOT NULL,
	"office" text NOT NULL,
	"pod_name" text NOT NULL,
	"budget" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pod_budgets_state_office_pod_name_pk" PRIMARY KEY("state","office","pod_name")
);
--> statement-breakpoint
CREATE TABLE "hiring_needs" (
	"id" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"sl" text,
	"sg" text,
	"state" text,
	"office" text,
	"location" text,
	"positions" integer DEFAULT 1,
	"type" text,
	"priority" text,
	"status" text DEFAULT 'open',
	"salary_min" integer,
	"salary_max" integer,
	"target_start" text,
	"approved_by" text,
	"managed_by" text,
	"notes" text,
	"closed_how" text,
	"closed_date" text,
	"closed_name" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "salary_brackets" (
	"id" text PRIMARY KEY NOT NULL,
	"div" text NOT NULL,
	"sl" text NOT NULL,
	"prog" text,
	"role" text NOT NULL,
	"nsw" json,
	"qld" json,
	"sa" json,
	"vic" json,
	"wa" json,
	"bands" json DEFAULT '[]'::json NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wfp_entity_settings" (
	"ent_id" text PRIMARY KEY NOT NULL,
	"billing_multiplier" numeric DEFAULT '3.5',
	"fy" text DEFAULT 'FY25-26',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wfp_revenue" (
	"ent_id" text NOT NULL,
	"fy" text NOT NULL,
	"target" numeric DEFAULT '0',
	"actual" numeric DEFAULT '0',
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "wfp_revenue_ent_id_fy_pk" PRIMARY KEY("ent_id","fy")
);
--> statement-breakpoint
CREATE TABLE "wfp_staff_meta" (
	"cb_id" text PRIMARY KEY NOT NULL,
	"billing_target" numeric,
	"perf_rating" text,
	"promo_flag" text DEFAULT 'no',
	"promo_eta" text,
	"staff_role" text,
	"billing_actual" numeric,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" json NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attrition_risks" (
	"id" text PRIMARY KEY NOT NULL,
	"carbonite_id" text NOT NULL,
	"risk_level" text DEFAULT 'medium' NOT NULL,
	"reason" text,
	"action" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "headcount_targets" (
	"entity_id" text NOT NULL,
	"sl_id" text NOT NULL,
	"fy" text DEFAULT 'FY25-26' NOT NULL,
	"target" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "headcount_targets_entity_id_sl_id_fy_pk" PRIMARY KEY("entity_id","sl_id","fy")
);
--> statement-breakpoint
CREATE TABLE "prior_year_data" (
	"state" text NOT NULL,
	"office" text NOT NULL,
	"pod_name" text NOT NULL,
	"year" text NOT NULL,
	"budget" integer DEFAULT 0,
	"headcount" integer DEFAULT 0,
	CONSTRAINT "prior_year_data_state_office_pod_name_year_pk" PRIMARY KEY("state","office","pod_name","year")
);
--> statement-breakpoint
CREATE TABLE "scenario_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"scenario_id" text NOT NULL,
	"role_title" text NOT NULL,
	"sl" text,
	"salary" integer DEFAULT 0 NOT NULL,
	"count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"fy" text DEFAULT 'FY25-26' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#6366f1',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wfp_entity_settings" ADD CONSTRAINT "wfp_entity_settings_ent_id_entities_id_fk" FOREIGN KEY ("ent_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wfp_revenue" ADD CONSTRAINT "wfp_revenue_ent_id_entities_id_fk" FOREIGN KEY ("ent_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wfp_staff_meta" ADD CONSTRAINT "wfp_staff_meta_cb_id_carbonites_id_fk" FOREIGN KEY ("cb_id") REFERENCES "public"."carbonites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attrition_risks" ADD CONSTRAINT "attrition_risks_carbonite_id_carbonites_id_fk" FOREIGN KEY ("carbonite_id") REFERENCES "public"."carbonites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "headcount_targets" ADD CONSTRAINT "headcount_targets_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_roles" ADD CONSTRAINT "scenario_roles_scenario_id_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;