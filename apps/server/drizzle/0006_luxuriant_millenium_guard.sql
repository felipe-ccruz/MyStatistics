CREATE TYPE "public"."profile_item_kind" AS ENUM('progress', 'activity_category', 'metric');--> statement-breakpoint
CREATE TABLE "profile_items" (
	"user_id" text NOT NULL,
	"kind" "profile_item_kind" NOT NULL,
	"ref" varchar(40) NOT NULL,
	"visible" boolean NOT NULL,
	CONSTRAINT "profile_items_user_id_kind_ref_pk" PRIMARY KEY("user_id","kind","ref")
);
--> statement-breakpoint
ALTER TABLE "profile_items" ADD CONSTRAINT "profile_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;