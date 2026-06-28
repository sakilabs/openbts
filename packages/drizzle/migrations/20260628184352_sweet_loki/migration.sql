ALTER TYPE "notification_type" ADD VALUE 'station_cells_changed';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'station_photos_added';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'station_comment_approved';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'station_uke_permit_added';--> statement-breakpoint
CREATE TABLE "station_watches" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"user_id" uuid NOT NULL,
	"station_id" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "station_watches_user_station_unique" UNIQUE("user_id","station_id")
);
--> statement-breakpoint
CREATE TABLE "uke"."uke_station_watches" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"user_id" uuid NOT NULL,
	"uke_station_id" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uke_station_watches_user_station_unique" UNIQUE("user_id","uke_station_id")
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "station_id" integer;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "uke_station_id" integer;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "push_queued_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "push_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_lists" ADD COLUMN "notifications_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_user_station_type_unread_unique" ON "notifications" ("user_id","station_id","type") WHERE "readAt" IS NULL AND "station_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_user_uke_station_type_unread_unique" ON "notifications" ("user_id","uke_station_id","type") WHERE "readAt" IS NULL AND "uke_station_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "notifications_station_watch_push_queue_idx" ON "notifications" ("push_queued_at") WHERE "push_queued_at" IS NOT NULL AND "push_sent_at" IS NULL;--> statement-breakpoint
CREATE INDEX "station_watches_user_id_idx" ON "station_watches" ("user_id");--> statement-breakpoint
CREATE INDEX "station_watches_station_id_idx" ON "station_watches" ("station_id");--> statement-breakpoint
CREATE INDEX "uke_station_watches_user_id_idx" ON "uke"."uke_station_watches" ("user_id");--> statement-breakpoint
CREATE INDEX "uke_station_watches_uke_station_id_idx" ON "uke"."uke_station_watches" ("uke_station_id");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_station_id_stations_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_uke_station_id_uke_stations_id_fkey" FOREIGN KEY ("uke_station_id") REFERENCES "uke"."uke_stations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "station_watches" ADD CONSTRAINT "station_watches_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "station_watches" ADD CONSTRAINT "station_watches_station_id_stations_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "uke"."uke_station_watches" ADD CONSTRAINT "uke_station_watches_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "uke"."uke_station_watches" ADD CONSTRAINT "uke_station_watches_uke_station_id_uke_stations_id_fkey" FOREIGN KEY ("uke_station_id") REFERENCES "uke"."uke_stations"("id") ON DELETE CASCADE;