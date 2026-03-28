-- ALTER TYPE "public"."listing_end_reason" ADD VALUE 'cancelled';--> statement-breakpoint
-- ALTER TABLE "listings" ADD COLUMN "latitude" numeric(10, 7);--> statement-breakpoint
-- ALTER TABLE "listings" ADD COLUMN "longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_verified" boolean DEFAULT false;