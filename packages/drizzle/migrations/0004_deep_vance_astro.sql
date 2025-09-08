ALTER TABLE "bands" DROP CONSTRAINT "bands_rat_value_unique";--> statement-breakpoint
ALTER TABLE "bands" ADD CONSTRAINT "bands_rat_value_unique" UNIQUE NULLS NOT DISTINCT("rat","value","duplex");