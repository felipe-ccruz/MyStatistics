-- Ajuste manual (D4): o SQL gerado fazia ADD COLUMN ... NOT NULL direto, o que quebra com as
-- atividades que já existem. A coluna nasce nula, as linhas antigas vão para o usuário mais antigo
-- (a conta de dev, criada antes de migrar) e só então vira NOT NULL.
ALTER TABLE "activities" ADD COLUMN "user_id" text;--> statement-breakpoint
UPDATE "activities" SET "user_id" = (SELECT "id" FROM "users" ORDER BY "created_at", "id" LIMIT 1) WHERE "user_id" IS NULL;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "activities" WHERE "user_id" IS NULL) THEN
		RAISE EXCEPTION 'activities without an owner: create an account before migrating (POST /api/auth/signup), it will own the existing activities';
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_user_id_date_idx" ON "activities" USING btree ("user_id","date");
