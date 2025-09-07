CREATE TABLE "networks_ids" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "networks_ids_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"station_id" integer NOT NULL,
	"networks_id" varchar(16) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "networks_ids_networks_id_unique" UNIQUE("station_id","networks_id")
);
--> statement-breakpoint
ALTER TABLE "networks_ids" ADD CONSTRAINT "networks_ids_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "networks_ids_station_idx" ON "networks_ids" USING btree ("station_id");