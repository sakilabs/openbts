CREATE SCHEMA "submissions";
--> statement-breakpoint
CREATE TYPE "public"."duplex" AS ENUM('FDD', 'TDD');--> statement-breakpoint
CREATE TYPE "public"."station_status" AS ENUM('published', 'inactive', 'pending');--> statement-breakpoint
CREATE TYPE "public"."uke_permission_type" AS ENUM('zmP', 'P');--> statement-breakpoint
CREATE TYPE "public"."rat" AS ENUM('GSM', 'UMTS', 'LTE', 'NR');--> statement-breakpoint
CREATE TYPE "public"."api_token_tier" AS ENUM('basic', 'pro', 'unlimited');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'moderator', 'admin');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."submission_type" AS ENUM('new', 'update');--> statement-breakpoint
CREATE TABLE "bands" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bands_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"value" integer,
	"rat" "rat" NOT NULL,
	"name" varchar(15) NOT NULL,
	"duplex" "duplex",
	CONSTRAINT "bands_rat_value_unique" UNIQUE("rat","value"),
	CONSTRAINT "bands_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "cells" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cells_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"station_id" integer NOT NULL,
	"band_id" integer NOT NULL,
	"rat" "rat" NOT NULL,
	"notes" text,
	"is_confirmed" boolean DEFAULT false,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gsm_cells" (
	"cell_id" integer PRIMARY KEY NOT NULL,
	"lac" integer NOT NULL,
	"cid" integer NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gsm_cells_lac_cid_unique" UNIQUE("lac","cid")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "locations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"region_id" integer NOT NULL,
	"city" varchar(100),
	"address" text,
	"longitude" double precision NOT NULL,
	"latitude" double precision NOT NULL,
	"point" geometry(point) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("locations"."longitude", "locations"."latitude"), 4326)) STORED NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "locations_lonlat_unique" UNIQUE("longitude","latitude"),
	CONSTRAINT "locations_latitude_range" CHECK ("locations"."latitude" BETWEEN -90 AND 90),
	CONSTRAINT "locations_longitude_range" CHECK ("locations"."longitude" BETWEEN -180 AND 180)
);
--> statement-breakpoint
CREATE TABLE "lte_cells" (
	"cell_id" integer PRIMARY KEY NOT NULL,
	"tac" integer,
	"enbid" integer NOT NULL,
	"clid" integer NOT NULL,
	"ecid" integer GENERATED ALWAYS AS (("lte_cells"."enbid" * 256) + "lte_cells"."clid") STORED NOT NULL,
	"supports_nb_iot" boolean DEFAULT false,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lte_cells_ecid_unique" UNIQUE("ecid"),
	CONSTRAINT "lte_cells_enbid_clid_unique" UNIQUE("enbid","clid"),
	CONSTRAINT "clid_check" CHECK ("lte_cells"."clid" BETWEEN 0 AND 255)
);
--> statement-breakpoint
CREATE TABLE "nr_cells" (
	"cell_id" integer PRIMARY KEY NOT NULL,
	"nrtac" integer,
	"gnbid" integer,
	"clid" integer NOT NULL,
	"nci" integer,
	"supports_nr_redcap" boolean DEFAULT false,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nr_cells_nci_unique" UNIQUE("nci"),
	CONSTRAINT "nr_cells_gnbid_clid_unique" UNIQUE("gnbid","clid")
);
--> statement-breakpoint
CREATE TABLE "operators" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "operators_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"full_name" varchar(250) NOT NULL,
	"parent_id" integer,
	"mnc" integer NOT NULL,
	"is_isp" boolean DEFAULT true,
	CONSTRAINT "operators_name_unique" UNIQUE("name"),
	CONSTRAINT "operators_mnc_unique" UNIQUE("mnc")
);
--> statement-breakpoint
CREATE TABLE "radiolines_antenna_types" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "radiolines_antenna_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"manufacturer_id" integer,
	CONSTRAINT "radiolines_antenna_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "radiolines_manufacturers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "radiolines_manufacturers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	CONSTRAINT "radiolines_manufacturers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "radiolines_transmitter_types" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "radiolines_transmitter_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"manufacturer_id" integer,
	CONSTRAINT "radiolines_transmitter_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "regions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	CONSTRAINT "regions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "stations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"station_id" varchar(16) NOT NULL,
	"location_id" integer,
	"operator_id" integer,
	"notes" text,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"is_confirmed" boolean DEFAULT false,
	"status" "station_status" DEFAULT 'pending' NOT NULL,
	CONSTRAINT "stations_station_id_operator_unique" UNIQUE("station_id","operator_id"),
	CONSTRAINT "stations_station_id_16_length" CHECK ("stations"."station_id" ~ '(^.{1,16}$)')
);
--> statement-breakpoint
CREATE TABLE "stations_permits" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stations_permits_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"permit_id" integer,
	"station_id" integer,
	CONSTRAINT "stations_permits_pair_unique" UNIQUE("station_id","permit_id")
);
--> statement-breakpoint
CREATE TABLE "uke_locations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "uke_locations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"region_id" integer NOT NULL,
	"city" varchar(100),
	"address" text,
	"longitude" double precision NOT NULL,
	"latitude" double precision NOT NULL,
	"point" geometry(point) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint("uke_locations"."longitude", "uke_locations"."latitude"), 4326)) STORED NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uke_locations_longitude_unique" UNIQUE("longitude"),
	CONSTRAINT "uke_locations_latitude_unique" UNIQUE("latitude"),
	CONSTRAINT "uke_locations_latitude_range" CHECK ("uke_locations"."latitude" BETWEEN -90 AND 90),
	CONSTRAINT "uke_locations_longitude_range" CHECK ("uke_locations"."longitude" BETWEEN -180 AND 180)
);
--> statement-breakpoint
CREATE TABLE "uke_permits" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "uke_permits_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"station_id" varchar(16) NOT NULL,
	"operator_id" integer NOT NULL,
	"location_id" integer NOT NULL,
	"decision_number" varchar(100) NOT NULL,
	"decision_type" "uke_permission_type" NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"band_id" integer NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uke_radiolines" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "uke_radiolines_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tx_longitude" double precision NOT NULL,
	"tx_latitude" double precision NOT NULL,
	"tx_height" integer NOT NULL,
	"rx_longitude" double precision NOT NULL,
	"rx_latitude" double precision NOT NULL,
	"rx_height" integer NOT NULL,
	"freq" integer NOT NULL,
	"ch_num" integer,
	"plan_symbol" varchar(50),
	"ch_width" integer,
	"polarization" varchar(10),
	"modulation_type" varchar(50),
	"bandwidth" varchar(100),
	"tx_eirp" integer,
	"tx_antenna_attenuation" integer,
	"tx_transmitter_type_id" integer,
	"tx_antenna_type_id" integer,
	"tx_antenna_gain" integer,
	"tx_antenna_height" integer,
	"rx_antenna_type_id" integer,
	"rx_antenna_gain" integer,
	"rx_antenna_height" integer,
	"rx_noise_figure" integer,
	"rx_atpc_attenuation" integer,
	"operator_id" integer,
	"permit_number" varchar(100) NOT NULL,
	"decision_type" "uke_permission_type" NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uke_radiolines_tx_height_nonneg" CHECK ("uke_radiolines"."tx_height" >= 0),
	CONSTRAINT "uke_radiolines_rx_height_nonneg" CHECK ("uke_radiolines"."rx_height" >= 0)
);
--> statement-breakpoint
CREATE TABLE "umts_cells" (
	"cell_id" integer PRIMARY KEY NOT NULL,
	"lac" integer,
	"carrier" integer,
	"rnc" integer NOT NULL,
	"cid" integer NOT NULL,
	"cid_long" integer GENERATED ALWAYS AS (("umts_cells"."rnc" * 65536) + "umts_cells"."cid") STORED NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "umts_cells_cid_long_unique" UNIQUE("cid_long"),
	CONSTRAINT "umts_cells_rnc_cid_unique" UNIQUE("rnc","cid")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_type" text NOT NULL,
	"provider_id" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expiresAt" timestamp with time zone,
	"id_token" text,
	"scope" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "api_keys_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"expiresAt" timestamp with time zone,
	"metadata" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"permissions" text,
	"remaining" integer,
	"refill_amount" integer,
	"refill_interval" integer,
	"lastRefillAt" timestamp with time zone,
	"rate_limit_enabled" boolean DEFAULT false,
	"rate_limit_time_window" integer,
	"rate_limit_max" integer,
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "attachments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attachments_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "attachments_size_nonneg" CHECK ("attachments"."size" >= 0),
	CONSTRAINT "attachments_mime_format" CHECK ("attachments"."mime_type" ~ '^[\w.+-]+/[\w.+-]+')
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"action" varchar(100) NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" integer,
	"old_values" jsonb,
	"new_values" jsonb,
	"metadata" jsonb,
	"source" varchar(50),
	"ip_address" varchar(60),
	"user_agent" text,
	"invoked_by" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "station_comments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "station_comments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"station_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"attachments" jsonb,
	"content" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "station_comments_content_len" CHECK (char_length("station_comments"."content") BETWEEN 1 AND 10000)
);
--> statement-breakpoint
CREATE TABLE "user_lists" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_lists_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uuid" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false,
	"created_by" uuid NOT NULL,
	"stations" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_lists_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "user_lists_creator_name_unique" UNIQUE("created_by","name"),
	CONSTRAINT "user_lists_stations_is_array" CHECK (jsonb_typeof("user_lists"."stations") = 'array')
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"username" varchar(100),
	"email" varchar(100) NOT NULL,
	"password" varchar(255),
	"image" text,
	"name" text,
	"role" text DEFAULT 'user' NOT NULL,
	"last_login" timestamp with time zone,
	"emailVerified" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"isAnonymous" boolean DEFAULT false,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "submissions"."proposed_cells" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "submissions"."proposed_cells_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"submission_id" integer,
	"target_cell_id" integer,
	"station_id" integer,
	"band_id" integer,
	"rat" "rat" NOT NULL,
	"notes" text,
	"is_confirmed" boolean DEFAULT false,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposed_cells_unique" UNIQUE("submission_id","station_id","band_id","rat")
);
--> statement-breakpoint
CREATE TABLE "submissions"."proposed_gsm_cells" (
	"proposed_cell_id" integer PRIMARY KEY NOT NULL,
	"lac" integer NOT NULL,
	"cid" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions"."proposed_lte_cells" (
	"proposed_cell_id" integer PRIMARY KEY NOT NULL,
	"tac" integer,
	"enbid" integer NOT NULL,
	"clid" integer NOT NULL,
	CONSTRAINT "clid_check" CHECK ("submissions"."proposed_lte_cells"."clid" BETWEEN 0 AND 255)
);
--> statement-breakpoint
CREATE TABLE "submissions"."proposed_locations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "submissions"."proposed_locations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"submission_id" integer,
	"region_id" integer NOT NULL,
	"city" varchar(100),
	"address" text,
	"longitude" double precision NOT NULL,
	"latitude" double precision NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions"."proposed_nr_cells" (
	"proposed_cell_id" integer PRIMARY KEY NOT NULL,
	"nrtac" integer,
	"gnbid" integer,
	"clid" integer NOT NULL,
	"nci" integer,
	CONSTRAINT "proposed_nr_cells_nci_unique" UNIQUE("nci")
);
--> statement-breakpoint
CREATE TABLE "submissions"."proposed_stations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "submissions"."proposed_stations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"submission_id" integer,
	"target_station_id" integer,
	"station_id" varchar(16) NOT NULL,
	"location_id" integer,
	"operator_id" integer,
	"notes" text,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"is_confirmed" boolean DEFAULT false,
	"status" "station_status" DEFAULT 'pending' NOT NULL,
	CONSTRAINT "proposed_stations_submission_station_unique" UNIQUE("submission_id","station_id")
);
--> statement-breakpoint
CREATE TABLE "submissions"."proposed_umts_cells" (
	"proposed_cell_id" integer PRIMARY KEY NOT NULL,
	"lac" integer,
	"carrier" integer,
	"rnc" integer NOT NULL,
	"cid" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions"."submissions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "submissions"."submissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"station_id" integer,
	"submitter_id" uuid NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"type" "submission_type" DEFAULT 'new' NOT NULL,
	"reviewer_id" uuid,
	"review_notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "cells" ADD CONSTRAINT "cells_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "cells" ADD CONSTRAINT "cells_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "gsm_cells" ADD CONSTRAINT "gsm_cells_cell_id_cells_id_fk" FOREIGN KEY ("cell_id") REFERENCES "public"."cells"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "lte_cells" ADD CONSTRAINT "lte_cells_cell_id_cells_id_fk" FOREIGN KEY ("cell_id") REFERENCES "public"."cells"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "nr_cells" ADD CONSTRAINT "nr_cells_cell_id_cells_id_fk" FOREIGN KEY ("cell_id") REFERENCES "public"."cells"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "operators" ADD CONSTRAINT "operators_parent_id_operators_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "radiolines_antenna_types" ADD CONSTRAINT "radiolines_antenna_types_manufacturer_id_radiolines_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."radiolines_manufacturers"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "radiolines_transmitter_types" ADD CONSTRAINT "radiolines_transmitter_types_manufacturer_id_radiolines_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."radiolines_manufacturers"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stations" ADD CONSTRAINT "stations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stations" ADD CONSTRAINT "stations_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stations_permits" ADD CONSTRAINT "stations_permits_permit_id_uke_permits_id_fk" FOREIGN KEY ("permit_id") REFERENCES "public"."uke_permits"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stations_permits" ADD CONSTRAINT "stations_permits_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "uke_locations" ADD CONSTRAINT "uke_locations_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "uke_permits" ADD CONSTRAINT "uke_permits_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "uke_permits" ADD CONSTRAINT "uke_permits_location_id_uke_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."uke_locations"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "uke_permits" ADD CONSTRAINT "uke_permits_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "uke_radiolines" ADD CONSTRAINT "uke_radiolines_tx_transmitter_type_id_radiolines_transmitter_types_id_fk" FOREIGN KEY ("tx_transmitter_type_id") REFERENCES "public"."radiolines_transmitter_types"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "uke_radiolines" ADD CONSTRAINT "uke_radiolines_tx_antenna_type_id_radiolines_antenna_types_id_fk" FOREIGN KEY ("tx_antenna_type_id") REFERENCES "public"."radiolines_antenna_types"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "uke_radiolines" ADD CONSTRAINT "uke_radiolines_rx_antenna_type_id_radiolines_antenna_types_id_fk" FOREIGN KEY ("rx_antenna_type_id") REFERENCES "public"."radiolines_antenna_types"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "uke_radiolines" ADD CONSTRAINT "uke_radiolines_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "umts_cells" ADD CONSTRAINT "umts_cells_cell_id_cells_id_fk" FOREIGN KEY ("cell_id") REFERENCES "public"."cells"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_invoked_by_users_id_fk" FOREIGN KEY ("invoked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "station_comments" ADD CONSTRAINT "station_comments_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "station_comments" ADD CONSTRAINT "station_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_lists" ADD CONSTRAINT "user_lists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_cells" ADD CONSTRAINT "proposed_cells_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "submissions"."submissions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_cells" ADD CONSTRAINT "proposed_cells_target_cell_id_cells_id_fk" FOREIGN KEY ("target_cell_id") REFERENCES "public"."cells"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_cells" ADD CONSTRAINT "proposed_cells_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_cells" ADD CONSTRAINT "proposed_cells_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_gsm_cells" ADD CONSTRAINT "proposed_gsm_cells_proposed_cell_id_proposed_cells_id_fk" FOREIGN KEY ("proposed_cell_id") REFERENCES "submissions"."proposed_cells"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_lte_cells" ADD CONSTRAINT "proposed_lte_cells_proposed_cell_id_proposed_cells_id_fk" FOREIGN KEY ("proposed_cell_id") REFERENCES "submissions"."proposed_cells"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_locations" ADD CONSTRAINT "proposed_locations_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "submissions"."submissions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_locations" ADD CONSTRAINT "proposed_locations_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_nr_cells" ADD CONSTRAINT "proposed_nr_cells_proposed_cell_id_proposed_cells_id_fk" FOREIGN KEY ("proposed_cell_id") REFERENCES "submissions"."proposed_cells"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_stations" ADD CONSTRAINT "proposed_stations_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "submissions"."submissions"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_stations" ADD CONSTRAINT "proposed_stations_target_station_id_stations_id_fk" FOREIGN KEY ("target_station_id") REFERENCES "public"."stations"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_stations" ADD CONSTRAINT "proposed_stations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_stations" ADD CONSTRAINT "proposed_stations_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submissions"."proposed_umts_cells" ADD CONSTRAINT "proposed_umts_cells_proposed_cell_id_proposed_cells_id_fk" FOREIGN KEY ("proposed_cell_id") REFERENCES "submissions"."proposed_cells"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submissions"."submissions" ADD CONSTRAINT "submissions_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submissions"."submissions" ADD CONSTRAINT "submissions_submitter_id_users_id_fk" FOREIGN KEY ("submitter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "submissions"."submissions" ADD CONSTRAINT "submissions_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "locations_region_id_idx" ON "locations" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "locations_point_gist" ON "locations" USING gist ("point");--> statement-breakpoint
CREATE INDEX "operator_parent_id_idx" ON "operators" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "station_location_id_idx" ON "stations" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "stations_operator_id_idx" ON "stations" USING btree ("operator_id");--> statement-breakpoint
CREATE INDEX "stations_permits_station_id_idx" ON "stations_permits" USING btree ("station_id");--> statement-breakpoint
CREATE INDEX "uke_locations_region_id_idx" ON "uke_locations" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "uke_locations_point_gist" ON "uke_locations" USING gist ("point");--> statement-breakpoint
CREATE INDEX "uke_permits_station_id_idx" ON "uke_permits" USING btree ("station_id");--> statement-breakpoint
CREATE INDEX "uke_permits_location_id_idx" ON "uke_permits" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "uke_radiolines_operator_id_idx" ON "uke_radiolines" USING btree ("operator_id");--> statement-breakpoint
CREATE INDEX "uke_radiolines_permit_number_idx" ON "uke_radiolines" USING btree ("permit_number");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "accounts_provider_account_id_idx" ON "accounts" USING btree ("provider_account_id");--> statement-breakpoint
CREATE INDEX "api_keys_user_id_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "attachment_author_id_idx" ON "attachments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "attachments_created_at_idx" ON "attachments" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "audit_logs_record_id_idx" ON "audit_logs" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "audit_logs_invoked_by_idx" ON "audit_logs" USING btree ("invoked_by");--> statement-breakpoint
CREATE INDEX "audit_logs_table_name_idx" ON "audit_logs" USING btree ("table_name");--> statement-breakpoint
CREATE INDEX "audit_logs_date_created_idx" ON "audit_logs" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "station_comments_station_id_idx" ON "station_comments" USING btree ("station_id");--> statement-breakpoint
CREATE INDEX "station_comments_user_id_idx" ON "station_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "station_comments_station_created_idx" ON "station_comments" USING btree ("station_id","createdAt");--> statement-breakpoint
CREATE INDEX "user_lists_id_idx" ON "user_lists" USING btree ("id");--> statement-breakpoint
CREATE INDEX "user_lists_created_by_idx" ON "user_lists" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "user_lists_stations_gin" ON "user_lists" USING gin ("stations");--> statement-breakpoint
CREATE INDEX "users_id_idx" ON "users" USING btree ("id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "proposed_cells_submission_id_idx" ON "submissions"."proposed_cells" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "station_location_id_idx" ON "submissions"."proposed_stations" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "submission_station_id_idx" ON "submissions"."submissions" USING btree ("station_id");--> statement-breakpoint
CREATE INDEX "submission_submitter_id_idx" ON "submissions"."submissions" USING btree ("submitter_id");--> statement-breakpoint
CREATE INDEX "submission_reviewer_id_idx" ON "submissions"."submissions" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "submission_status_idx" ON "submissions"."submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submission_created_at_idx" ON "submissions"."submissions" USING btree ("createdAt");