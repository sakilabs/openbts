ALTER TABLE "uke_radiolines" ADD COLUMN "physical_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "uke_radiolines" DROP CONSTRAINT "uke_radiolines_natural_key";--> statement-breakpoint
ALTER TABLE "uke_radiolines" ADD CONSTRAINT "uke_radiolines_natural_key" UNIQUE("permit_number","physical_key");--> statement-breakpoint
CREATE INDEX "uke_radiolines_physical_key_idx" ON "uke_radiolines" ("physical_key");
