CREATE TYPE "public"."embedding_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "title" varchar(200) NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "content" text NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "embedding" vector(384);--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "embedding_status" "embedding_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "name" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "color" varchar(7);--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notes_user_id_created_at_idx" ON "notes" USING btree ("user_id","created_at" desc);--> statement-breakpoint
CREATE INDEX "notes_user_id_updated_at_idx" ON "notes" USING btree ("user_id","updated_at" desc);--> statement-breakpoint
CREATE INDEX "notes_embedding_status_idx" ON "notes" USING btree ("embedding_status") WHERE "notes"."embedding_status" != 'completed';--> statement-breakpoint
CREATE INDEX "notes_tags_gin_idx" ON "notes" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "notes_embedding_hnsw_idx" ON "notes" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);--> statement-breakpoint
CREATE INDEX "notes_is_archived_idx" ON "notes" USING btree ("user_id","is_archived") WHERE "notes"."is_archived" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_id_name_unique" ON "tags" USING btree ("user_id","name");--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_color_check" CHECK ("tags"."color" ~ '^#[0-9A-Fa-f]{6}$' OR "tags"."color" IS NULL);--> statement-breakpoint
CREATE OR REPLACE FUNCTION update_updated_at_notes()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER update_updated_at_trigger
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_notes();--> statement-breakpoint
CREATE OR REPLACE FUNCTION reset_embedding_on_content_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content != NEW.content THEN
    NEW.embedding_status = 'pending';
    NEW.embedding = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER reset_embedding_on_content_change_trigger
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION reset_embedding_on_content_change();