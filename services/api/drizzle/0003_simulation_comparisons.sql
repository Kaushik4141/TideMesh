CREATE TABLE "simulation_comparisons" (
	"id" text PRIMARY KEY NOT NULL,
	"baseline_run_id" text NOT NULL,
	"scenario_run_id" text NOT NULL,
	"scenario_prediction_id" uuid,
	"inputs" jsonb NOT NULL,
	"artifact_references" jsonb NOT NULL,
	"result_summary" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "simulation_comparisons" ADD CONSTRAINT "simulation_comparisons_scenario_prediction_id_flood_predictions_id_fk" FOREIGN KEY ("scenario_prediction_id") REFERENCES "public"."flood_predictions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comparisons_baseline_run_idx" ON "simulation_comparisons" USING btree ("baseline_run_id");