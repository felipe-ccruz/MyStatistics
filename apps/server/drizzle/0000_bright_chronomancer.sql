CREATE TYPE "public"."activity_category" AS ENUM('estudo', 'alimentacao', 'academia');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" "activity_category" NOT NULL,
	"duration_minutes" integer NOT NULL,
	"date" date NOT NULL
);
