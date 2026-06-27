DROP INDEX "uke"."uke_permits_uke_station_band_idx";--> statement-breakpoint
ALTER TABLE "auth"."users" ADD COLUMN "hunter_listing" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."users" ADD COLUMN "hunter_regions" jsonb DEFAULT '[]';--> statement-breakpoint
CREATE INDEX "uke_permits_uke_station_band_id_idx" ON "uke"."uke_permits" ("uke_station_id","band_id","id");--> statement-breakpoint
CREATE INDEX "uke_permits_updated_at_uke_station_idx" ON "uke"."uke_permits" ("updatedAt","uke_station_id");--> statement-breakpoint
CREATE INDEX "uke_stations_location_operator_id_idx" ON "uke"."uke_stations" ("location_id","operator_id","id");