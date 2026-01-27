ALTER TABLE "uke_permits" DROP CONSTRAINT "uke_permits_operator_id_operators_id_fk";
--> statement-breakpoint
ALTER TABLE "networks_ids" ADD COLUMN "networks_name" varchar(50);--> statement-breakpoint
ALTER TABLE "networks_ids" ADD COLUMN "mno_name" varchar(50);--> statement-breakpoint
ALTER TABLE "uke_permits" ADD CONSTRAINT "uke_permits_operator_id_uke_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."uke_operators"("id") ON DELETE set null ON UPDATE cascade;