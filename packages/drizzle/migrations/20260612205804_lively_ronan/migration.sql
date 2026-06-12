CREATE TABLE "station_sectors" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "station_sectors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"station_id" integer NOT NULL,
	"azimuth" integer NOT NULL,
	CONSTRAINT "station_sectors_station_azimuth_unique" UNIQUE("station_id","azimuth"),
	CONSTRAINT "station_sectors_azimuth_range" CHECK ("azimuth" BETWEEN 0 AND 359)
);
--> statement-breakpoint
ALTER TABLE "cells" ADD COLUMN "sector_id" integer;--> statement-breakpoint
CREATE INDEX "station_sectors_station_id_idx" ON "station_sectors" ("station_id");--> statement-breakpoint
ALTER TABLE "cells" ADD CONSTRAINT "cells_sector_id_station_sectors_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "station_sectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "station_sectors" ADD CONSTRAINT "station_sectors_station_id_stations_id_fkey" FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;