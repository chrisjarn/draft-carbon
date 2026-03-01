CREATE TYPE "public"."staff_role_tag" AS ENUM('doer', 'reviewer', 'bd');--> statement-breakpoint
ALTER TABLE "wfp_staff_meta" ADD COLUMN "role_tag" "staff_role_tag";