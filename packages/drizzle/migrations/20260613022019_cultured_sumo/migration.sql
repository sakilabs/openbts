CREATE TABLE "submissions"."proposed_sectors" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "submissions"."proposed_sectors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"submission_id" uuid,
	"target_sector_id" integer,
	"local_id" text NOT NULL,
	"azimuth" integer NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposed_sectors_submission_local_unique" UNIQUE("submission_id","local_id"),
	CONSTRAINT "proposed_sectors_azimuth_range" CHECK ("azimuth" BETWEEN 0 AND 359)
);
--> statement-breakpoint
ALTER TABLE "submissions"."proposed_cells" ADD COLUMN "target_sector_id" integer;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_cells" ADD COLUMN "sector_local_id" text;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_cells" ADD COLUMN "sector_unassigned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "proposed_sectors_submission_id_idx" ON "submissions"."proposed_sectors" ("submission_id");--> statement-breakpoint
ALTER TABLE "submissions"."proposed_cells" ADD CONSTRAINT "proposed_cells_target_sector_id_station_sectors_id_fkey" FOREIGN KEY ("target_sector_id") REFERENCES "station_sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_sectors" ADD CONSTRAINT "proposed_sectors_submission_id_submissions_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"."submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_sectors" ADD CONSTRAINT "proposed_sectors_target_sector_id_station_sectors_id_fkey" FOREIGN KEY ("target_sector_id") REFERENCES "station_sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;