CREATE INDEX "stations_published_location_idx" ON "stations" ("location_id","id") WHERE "status" = 'published';--> statement-breakpoint
CREATE INDEX "stations_published_location_operator_idx" ON "stations" ("location_id","operator_id","id") WHERE "status" = 'published';--> statement-breakpoint
CREATE INDEX "uke_permits_location_id_id_idx" ON "uke_permits" ("location_id","id");--> statement-breakpoint
CREATE INDEX "uke_permits_location_created_at_idx" ON "uke_permits" ("location_id","createdAt");--> statement-breakpoint
CREATE INDEX "uke_permits_created_at_location_idx" ON "uke_permits" ("createdAt","location_id");--> statement-breakpoint
CREATE INDEX "uke_permits_location_operator_band_id_idx" ON "uke_permits" ("location_id","operator_id","band_id","id");