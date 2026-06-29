CREATE SCHEMA "statistics";
--> statement-breakpoint
CREATE TABLE "statistics"."analyzer_usage" (
	"date" date PRIMARY KEY,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "statistics"."contribution_snapshots" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "statistics"."contribution_snapshots_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"snapshot_date" timestamp with time zone NOT NULL CONSTRAINT "contribution_snapshots_date_unique" UNIQUE,
	"total_stations" integer DEFAULT 0 NOT NULL,
	"total_sectors" integer DEFAULT 0 NOT NULL,
	"total_extra_ids" integer DEFAULT 0 NOT NULL,
	"total_cells" integer DEFAULT 0 NOT NULL,
	"total_cells_with_pci" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stats_snapshots" SET SCHEMA "statistics";
--> statement-breakpoint
CREATE INDEX "contribution_snapshots_date_idx" ON "statistics"."contribution_snapshots" ("snapshot_date");--> statement-breakpoint
CREATE INDEX "uke_stations_station_operator_id_idx" ON "uke"."uke_stations" ("station_id","operator_id");