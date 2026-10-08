CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint
CREATE TYPE "public"."facility_type" AS ENUM('hospital', 'shelter', 'fire_station', 'police_station', 'school', 'other');--> statement-breakpoint
CREATE TYPE "public"."severity_level" AS ENUM('LOW', 'MODERATE', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('citizen', 'responder', 'municipality', 'admin');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" text NOT NULL,
	"severity" "severity_level" NOT NULL,
	"message" text NOT NULL,
	"recommended_actions" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" text PRIMARY KEY NOT NULL,
	"building_type" text,
	"geometry" geometry(Geometry, 4326) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "critical_facilities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "facility_type" NOT NULL,
	"geometry" geometry(Geometry, 4326) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "environmental_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"rainfall" double precision,
	"tide_level" double precision,
	"storm_surge" double precision,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flood_impacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prediction_id" uuid NOT NULL,
	"affected_population" integer,
	"affected_buildings_count" integer,
	"affected_roads_count" integer,
	"critical_facilities_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flood_predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text,
	"zone_id" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"probability" double precision NOT NULL,
	"severity" "severity_level" NOT NULL,
	"onset_time" timestamp with time zone,
	"peak_time" timestamp with time zone,
	"depth_min" double precision,
	"depth_max" double precision,
	"model_version" text DEFAULT 'flood-xgb-v1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "response_priorities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" text NOT NULL,
	"score" double precision NOT NULL,
	"rank" integer NOT NULL,
	"severity" "severity_level" NOT NULL,
	"reason" text,
	"recommended_actions" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roads" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"road_type" text,
	"geometry" geometry(Geometry, 4326) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'citizen' NOT NULL,
	"location" geometry(Point, 4326),
	"notification_preferences" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"geometry" geometry(Geometry, 4326) NOT NULL,
	"elevation" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flood_impacts" ADD CONSTRAINT "flood_impacts_prediction_id_flood_predictions_id_fk" FOREIGN KEY ("prediction_id") REFERENCES "public"."flood_predictions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flood_predictions" ADD CONSTRAINT "flood_predictions_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_priorities" ADD CONSTRAINT "response_priorities_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alerts_zone_id_idx" ON "alerts" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "alerts_severity_idx" ON "alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "buildings_geom_gist_idx" ON "buildings" USING gist ("geometry");--> statement-breakpoint
CREATE INDEX "critical_facilities_geom_gist_idx" ON "critical_facilities" USING gist ("geometry");--> statement-breakpoint
CREATE INDEX "critical_facilities_type_idx" ON "critical_facilities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "env_obs_timestamp_idx" ON "environmental_observations" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "impacts_prediction_id_idx" ON "flood_impacts" USING btree ("prediction_id");--> statement-breakpoint
CREATE INDEX "predictions_zone_id_idx" ON "flood_predictions" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "predictions_timestamp_idx" ON "flood_predictions" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "predictions_severity_idx" ON "flood_predictions" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "priorities_zone_id_idx" ON "response_priorities" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "priorities_rank_idx" ON "response_priorities" USING btree ("rank");--> statement-breakpoint
CREATE INDEX "roads_geom_gist_idx" ON "roads" USING gist ("geometry");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "zones_geom_gist_idx" ON "zones" USING gist ("geometry");