CREATE TYPE "public"."promo_flag" AS ENUM('yes', 'maybe', 'no');--> statement-breakpoint
ALTER TABLE "wfp_staff_meta" ALTER COLUMN "promo_flag" SET DEFAULT 'no'::"public"."promo_flag";--> statement-breakpoint
ALTER TABLE "wfp_staff_meta" ALTER COLUMN "promo_flag" SET DATA TYPE "public"."promo_flag" USING "promo_flag"::"public"."promo_flag";