CREATE TYPE "public"."user_role" AS ENUM('admin', 'practice_manager', 'service_line_lead', 'state_manager', 'read_only');--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'read_only'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";