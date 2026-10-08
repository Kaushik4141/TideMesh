ALTER TABLE "environmental_observations" ADD COLUMN "temperature_c" double precision;--> statement-breakpoint
ALTER TABLE "environmental_observations" ADD COLUMN "surface_pressure_hpa" double precision;--> statement-breakpoint
ALTER TABLE "environmental_observations" ADD COLUMN "wind_speed_kmh" double precision;--> statement-breakpoint
ALTER TABLE "environmental_observations" ADD COLUMN "elevation_m" double precision;--> statement-breakpoint
ALTER TABLE "environmental_observations" ADD COLUMN "location" geometry(Point, 4326);--> statement-breakpoint
CREATE INDEX "env_obs_source_idx" ON "environmental_observations" USING btree ("source");--> statement-breakpoint
CREATE INDEX "env_obs_location_gist_idx" ON "environmental_observations" USING gist ("location");--> statement-breakpoint
CREATE UNIQUE INDEX "env_obs_timestamp_source_uidx" ON "environmental_observations" USING btree ("timestamp","source");