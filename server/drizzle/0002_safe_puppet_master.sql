ALTER TYPE "public"."listing_end_reason" ADD VALUE 'cancelled';
ALTER TABLE "listings" ADD COLUMN "latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "longitude" numeric(10, 7);