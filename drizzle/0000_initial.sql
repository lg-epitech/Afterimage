CREATE EXTENSION IF NOT EXISTS "pg_trgm";--> statement-breakpoint
CREATE TYPE "public"."reaction" AS ENUM('didnt_like', 'liked', 'loved');--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"movie_id" uuid NOT NULL,
	"reaction" "reaction" NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"watched_on" date NOT NULL,
	"watched_timezone" text NOT NULL,
	"utc_offset_minutes" smallint NOT NULL,
	"watch_context" text,
	"location_label" text,
	"venue_name" text,
	"platform" text,
	"mood" text,
	"companions" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"is_rewatch" boolean DEFAULT false NOT NULL,
	"movie_snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journal_entries_utc_offset_range" CHECK ("journal_entries"."utc_offset_minutes" between -840 and 840),
	CONSTRAINT "journal_entries_timezone_not_empty" CHECK (char_length("journal_entries"."watched_timezone") > 0),
	CONSTRAINT "journal_entries_notes_length" CHECK (char_length("journal_entries"."notes") <= 20000)
);
--> statement-breakpoint
CREATE TABLE "movies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tmdb_id" integer NOT NULL,
	"imdb_id" text,
	"title" text NOT NULL,
	"original_title" text NOT NULL,
	"overview" text DEFAULT '' NOT NULL,
	"release_date" date,
	"runtime_minutes" integer,
	"poster_path" text,
	"backdrop_path" text,
	"original_language" text NOT NULL,
	"genres" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"directors" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"cast" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"countries" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"provider_fetched_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movies_tmdb_id_positive" CHECK ("movies"."tmdb_id" > 0),
	CONSTRAINT "movies_runtime_non_negative" CHECK ("movies"."runtime_minutes" is null or "movies"."runtime_minutes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"clerk_user_id" text PRIMARY KEY NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_timezone_not_empty" CHECK (char_length("profiles"."timezone") > 0)
);
--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_profiles_clerk_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "journal_entries_user_watched_idx" ON "journal_entries" USING btree ("user_id","watched_on" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "journal_entries_user_created_idx" ON "journal_entries" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "journal_entries_user_movie_idx" ON "journal_entries" USING btree ("user_id","movie_id","watched_on");--> statement-breakpoint
CREATE INDEX "journal_entries_user_reaction_idx" ON "journal_entries" USING btree ("user_id","reaction","watched_on" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "journal_entries_notes_trgm_idx" ON "journal_entries" USING gin ("notes" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "journal_entries_tags_idx" ON "journal_entries" USING gin ("tags");--> statement-breakpoint
CREATE UNIQUE INDEX "movies_tmdb_id_unique" ON "movies" USING btree ("tmdb_id");--> statement-breakpoint
CREATE INDEX "movies_title_trgm_idx" ON "movies" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "movies_original_title_trgm_idx" ON "movies" USING gin ("original_title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "movies_genres_idx" ON "movies" USING gin ("genres");
