-- ALTER TYPE "public"."listing_end_reason" ADD VALUE 'cancelled';--> statement-breakpoint
-- ALTER TABLE "listings" ADD COLUMN "latitude" numeric(10, 7);--> statement-breakpoint
-- ALTER TABLE "listings" ADD COLUMN "longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_verified" boolean DEFAULT false;
CREATE TYPE "public"."interaction_type" AS ENUM('view', 'bid');--> statement-breakpoint
CREATE TABLE "listing_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"interaction_type" "interaction_type" NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listing_interactions" ADD CONSTRAINT "listing_interactions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_interactions" ADD CONSTRAINT "listing_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_code_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_expires_at" timestamp;

