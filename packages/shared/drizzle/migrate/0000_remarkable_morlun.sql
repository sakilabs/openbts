CREATE TABLE IF NOT EXISTS "bands" (
	"id" serial PRIMARY KEY NOT NULL,
	"value" integer,
	"name" varchar(50) NOT NULL,
	"frequency" varchar(50),
	"duplex" varchar(5),
	CONSTRAINT "bands_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cells" (
	"id" serial PRIMARY KEY NOT NULL,
	"station_id" integer NOT NULL,
	"standard" varchar(20) NOT NULL,
	"band_id" integer NOT NULL,
	"config" jsonb NOT NULL,
	"sector" integer NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"date_created" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"region_id" integer NOT NULL,
	"city" varchar(100) NOT NULL,
	"address" text NOT NULL,
	"longitude" numeric(9, 6) NOT NULL,
	"latitude" numeric(8, 6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "operators" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"parent_id" integer,
	"mnc_code" integer NOT NULL,
	CONSTRAINT "operators_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	CONSTRAINT "regions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stations" (
	"id" serial PRIMARY KEY NOT NULL,
	"station_id" varchar(9) NOT NULL,
	"bts_id" integer,
	"location_id" integer,
	"operator_id" integer,
	"lac" integer,
	"rnc" varchar(50),
	"enbi" integer,
	"is_common_bch" boolean DEFAULT false,
	"is_cdma" boolean DEFAULT false,
	"is_umts" boolean DEFAULT false,
	"is_gsm" boolean DEFAULT false,
	"is_lte" boolean DEFAULT false,
	"is_5g" boolean DEFAULT false,
	"is_outdoor" boolean DEFAULT true,
	"installation_type" varchar(100),
	"notes" text,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"date_created" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cells" ADD CONSTRAINT "cells_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cells" ADD CONSTRAINT "cells_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "locations" ADD CONSTRAINT "locations_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "operators" ADD CONSTRAINT "operators_parent_id_operators_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."operators"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stations" ADD CONSTRAINT "stations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stations" ADD CONSTRAINT "stations_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
