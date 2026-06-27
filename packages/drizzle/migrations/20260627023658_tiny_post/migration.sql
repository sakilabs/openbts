CREATE SCHEMA "uke";
--> statement-breakpoint
CREATE TABLE "uke"."uke_stations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "uke"."uke_stations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"station_id" varchar(16) NOT NULL,
	"operator_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uke_stations_station_operator_location_unique" UNIQUE("station_id","operator_id","location_id"),
	CONSTRAINT "uke_stations_station_id_16_length" CHECK ("station_id" ~ '(^.{1,16}$)')
);
--> statement-breakpoint
ALTER TABLE "radiolines_manufacturers" SET SCHEMA "uke";
--> statement-breakpoint
ALTER TABLE "radiolines_antenna_types" SET SCHEMA "uke";
--> statement-breakpoint
ALTER TABLE "radiolines_transmitter_types" SET SCHEMA "uke";
--> statement-breakpoint
ALTER TABLE "uke_import_metadata" SET SCHEMA "uke";
--> statement-breakpoint
ALTER TABLE "uke_locations" SET SCHEMA "uke";
--> statement-breakpoint
ALTER TABLE "uke_operators" SET SCHEMA "uke";
--> statement-breakpoint
ALTER TABLE "uke_permit_sectors" SET SCHEMA "uke";
--> statement-breakpoint
ALTER TABLE "uke_permits" SET SCHEMA "uke";
--> statement-breakpoint
ALTER TABLE "uke_radiolines" SET SCHEMA "uke";
--> statement-breakpoint
ALTER TABLE "uke"."uke_permits" DROP CONSTRAINT "uke_permits_operator_id_operators_id_fkey";--> statement-breakpoint
ALTER TABLE "uke"."uke_permits" DROP CONSTRAINT "uke_permits_location_id_uke_locations_id_fkey";--> statement-breakpoint
INSERT INTO "uke"."uke_stations" ("station_id", "operator_id", "location_id", "updatedAt", "createdAt")
SELECT
	"station_id",
	"operator_id",
	"location_id",
	MAX("updatedAt") AS "updatedAt",
	MIN("createdAt") AS "createdAt"
FROM "uke"."uke_permits"
GROUP BY "station_id", "operator_id", "location_id";
--> statement-breakpoint
DROP INDEX "uke"."uke_permits_station_id_idx";--> statement-breakpoint
DROP INDEX "uke"."uke_permits_location_id_idx";--> statement-breakpoint
DROP INDEX "uke"."uke_permits_operator_id_idx";--> statement-breakpoint
DROP INDEX "uke"."uke_permits_station_id_trgm_idx";--> statement-breakpoint
DROP INDEX "uke"."uke_permits_operator_band_idx";--> statement-breakpoint
DROP INDEX "uke"."uke_permits_operator_location_idx";--> statement-breakpoint
DROP INDEX "uke"."uke_permits_location_id_id_idx";--> statement-breakpoint
DROP INDEX "uke"."uke_permits_location_created_at_idx";--> statement-breakpoint
DROP INDEX "uke"."uke_permits_created_at_location_idx";--> statement-breakpoint
DROP INDEX "uke"."uke_permits_location_operator_band_idx";--> statement-breakpoint
DROP INDEX "uke"."uke_permits_location_operator_band_id_idx";--> statement-breakpoint
DROP INDEX "uke"."uke_permits_location_band_idx";--> statement-breakpoint
DROP INDEX "uke"."uke_permits_operator_band_location_idx";--> statement-breakpoint
ALTER TABLE "uke"."uke_permits" ADD COLUMN "uke_station_id" integer;--> statement-breakpoint
UPDATE "uke"."uke_permits" p
SET "uke_station_id" = s."id"
FROM "uke"."uke_stations" s
WHERE p."station_id" = s."station_id"
	AND p."operator_id" = s."operator_id"
	AND p."location_id" = s."location_id";
--> statement-breakpoint
ALTER TABLE "uke"."uke_permits" ALTER COLUMN "uke_station_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "uke"."uke_permits" DROP CONSTRAINT "uke_permits_unique_permit";--> statement-breakpoint
ALTER TABLE "uke"."uke_locations" DROP COLUMN "point";--> statement-breakpoint
ALTER TABLE "uke"."uke_locations" ADD COLUMN "point" geometry(point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("uke"."uke_locations"."longitude", "uke"."uke_locations"."latitude"), 4326)) STORED;--> statement-breakpoint
ALTER TABLE "uke"."uke_permits" DROP COLUMN "station_id";--> statement-breakpoint
ALTER TABLE "uke"."uke_permits" DROP COLUMN "operator_id";--> statement-breakpoint
ALTER TABLE "uke"."uke_permits" DROP COLUMN "location_id";--> statement-breakpoint
ALTER TABLE "uke"."uke_permits" ADD CONSTRAINT "uke_permits_unique_permit" UNIQUE("uke_station_id","band_id","decision_number","decision_type","expiry_date");--> statement-breakpoint
CREATE INDEX "uke_permits_uke_station_id_idx" ON "uke"."uke_permits" ("uke_station_id");--> statement-breakpoint
CREATE INDEX "uke_permits_uke_station_band_id_idx" ON "uke"."uke_permits" ("uke_station_id","band_id","id");--> statement-breakpoint
CREATE INDEX "uke_permits_uke_station_id_id_idx" ON "uke"."uke_permits" ("uke_station_id","id");--> statement-breakpoint
CREATE INDEX "uke_permits_uke_station_created_at_idx" ON "uke"."uke_permits" ("uke_station_id","createdAt");--> statement-breakpoint
CREATE INDEX "uke_permits_created_at_uke_station_idx" ON "uke"."uke_permits" ("createdAt","uke_station_id");--> statement-breakpoint
CREATE INDEX "uke_permits_updated_at_uke_station_idx" ON "uke"."uke_permits" ("updatedAt","uke_station_id");--> statement-breakpoint
CREATE INDEX "uke_stations_station_id_idx" ON "uke"."uke_stations" ("station_id");--> statement-breakpoint
CREATE INDEX "uke_stations_station_id_trgm_idx" ON "uke"."uke_stations" USING gin (("station_id") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "uke_stations_operator_id_idx" ON "uke"."uke_stations" ("operator_id");--> statement-breakpoint
CREATE INDEX "uke_stations_location_id_idx" ON "uke"."uke_stations" ("location_id");--> statement-breakpoint
CREATE INDEX "uke_stations_location_operator_id_idx" ON "uke"."uke_stations" ("location_id","operator_id","id");--> statement-breakpoint
CREATE INDEX "uke_stations_updated_at_idx" ON "uke"."uke_stations" ("updatedAt");--> statement-breakpoint
CREATE INDEX "uke_stations_created_at_idx" ON "uke"."uke_stations" ("createdAt");--> statement-breakpoint
CREATE INDEX "uke_locations_point_gist" ON "uke"."uke_locations" USING gist ("point");--> statement-breakpoint
ALTER TABLE "uke"."uke_permits" ADD CONSTRAINT "uke_permits_uke_station_id_uke_stations_id_fkey" FOREIGN KEY ("uke_station_id") REFERENCES "uke"."uke_stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "uke"."uke_stations" ADD CONSTRAINT "uke_stations_operator_id_operators_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "uke"."uke_stations" ADD CONSTRAINT "uke_stations_location_id_uke_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "uke"."uke_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
