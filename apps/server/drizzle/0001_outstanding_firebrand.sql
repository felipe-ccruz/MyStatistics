ALTER TABLE "activities" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
-- Ajuste manual: o cast para o enum novo quebraria com os valores antigos. Com a coluna em text,
-- descarta 'alimentacao' (dado de dev) e mapeia estudo → study, academia → exercise antes do cast.
DELETE FROM "activities" WHERE "category" = 'alimentacao';--> statement-breakpoint
UPDATE "activities" SET "category" = 'study' WHERE "category" = 'estudo';--> statement-breakpoint
UPDATE "activities" SET "category" = 'exercise' WHERE "category" = 'academia';--> statement-breakpoint
DROP TYPE "public"."activity_category";--> statement-breakpoint
CREATE TYPE "public"."activity_category" AS ENUM('study', 'exercise');--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "category" SET DATA TYPE "public"."activity_category" USING "category"::"public"."activity_category";
