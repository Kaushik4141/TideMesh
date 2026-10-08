ALTER TABLE "flood_predictions" ALTER COLUMN "probability" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "flood_predictions" ADD COLUMN "is_deterministic" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "flood_predictions" ADD COLUMN "flood_geometry" geometry(Geometry, 4326);--> statement-breakpoint
ALTER TABLE "flood_predictions" ADD COLUMN "source" text DEFAULT 'ml';--> statement-breakpoint
ALTER TABLE "flood_predictions" ADD COLUMN "metrics" jsonb;