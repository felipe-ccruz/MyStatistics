CREATE TABLE "entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"value" double precision NOT NULL,
	"date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_metric_id_metrics_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."metrics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entries_metric_id_date_idx" ON "entries" USING btree ("metric_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "metrics_user_id_lower_name_idx" ON "metrics" USING btree ("user_id",lower("name"));