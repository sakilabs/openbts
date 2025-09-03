ALTER TABLE "operators" ALTER COLUMN "mnc" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "gsm_cells" ADD COLUMN "e_gsm" boolean DEFAULT false;