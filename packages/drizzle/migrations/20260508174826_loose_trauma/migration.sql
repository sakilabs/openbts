ALTER TABLE "auth"."users" ADD COLUMN "bio" varchar(500);--> statement-breakpoint
ALTER TABLE "auth"."users" ADD COLUMN "contact_info" jsonb;--> statement-breakpoint
ALTER TABLE "auth"."users" ADD COLUMN "profile_visibility" text DEFAULT 'private' NOT NULL;