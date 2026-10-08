ALTER TABLE "environmental_observations" ALTER COLUMN "source" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "environmental_observations" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "environmental_observations" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "environmental_observations" ADD COLUMN "location" geometry(Point, 4326);--> statement-breakpoint
ALTER TABLE "environmental_observations" ADD COLUMN "elevation" double precision;--> statement-breakpoint
ALTER TABLE "environmental_observations" ADD COLUMN "precipitation" double precision;--> statement-breakpoint
ALTER TABLE "environmental_observations" ADD COLUMN "temperature" double precision;--> statement-breakpoint
ALTER TABLE "environmental_observations" ADD COLUMN "surface_pressure" double precision;--> statement-breakpoint
ALTER TABLE "environmental_observations" ADD COLUMN "wind_speed" double precision;--> statement-breakpoint
ALTER TABLE "environmental_observations" ADD COLUMN "source_timestamp" text;--> statement-breakpoint
ALTER TABLE "environmental_observations" ADD COLUMN "data_quality" text DEFAULT 'RAW' NOT NULL;--> statement-breakpoint
CREATE INDEX "env_obs_source_idx" ON "environmental_observations" USING btree ("source");--> statement-breakpoint
CREATE INDEX "env_obs_location_gist_idx" ON "environmental_observations" USING gist ("location");--> statement-breakpoint
CREATE UNIQUE INDEX "env_obs_source_time_loc_idx" ON "environmental_observations" USING btree ("source","timestamp","latitude","longitude");