CREATE TYPE "public"."listing_end_reason" AS ENUM('success', 'unmet', 'nobids', 'pending');--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "end_reason" "listing_end_reason";