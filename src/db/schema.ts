import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { REACTIONS, type MovieSnapshot } from "@/lib/types";

export const reactionEnum = pgEnum("reaction", REACTIONS);

export const profiles = pgTable(
  "profiles",
  {
    clerkUserId: text("clerk_user_id").primaryKey(),
    timezone: text("timezone").notNull().default("UTC"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("profiles_timezone_not_empty", sql`char_length(${table.timezone}) > 0`),
  ],
);

export const movies = pgTable(
  "movies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tmdbId: integer("tmdb_id").notNull(),
    imdbId: text("imdb_id"),
    title: text("title").notNull(),
    originalTitle: text("original_title").notNull(),
    overview: text("overview").notNull().default(""),
    releaseDate: date("release_date", { mode: "string" }),
    runtimeMinutes: integer("runtime_minutes"),
    posterPath: text("poster_path"),
    backdropPath: text("backdrop_path"),
    originalLanguage: text("original_language").notNull(),
    genres: text("genres")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    directors: text("directors")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    cast: text("cast")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    countries: text("countries")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    providerFetchedAt: timestamp("provider_fetched_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("movies_tmdb_id_unique").on(table.tmdbId),
    index("movies_title_trgm_idx").using(
      "gin",
      table.title.asc().op("gin_trgm_ops"),
    ),
    index("movies_original_title_trgm_idx").using(
      "gin",
      table.originalTitle.asc().op("gin_trgm_ops"),
    ),
    index("movies_genres_idx").using("gin", table.genres),
    check("movies_tmdb_id_positive", sql`${table.tmdbId} > 0`),
    check(
      "movies_runtime_non_negative",
      sql`${table.runtimeMinutes} is null or ${table.runtimeMinutes} >= 0`,
    ),
  ],
);

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => profiles.clerkUserId, { onDelete: "cascade" }),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "restrict" }),
    reaction: reactionEnum("reaction").notNull(),
    notes: text("notes").notNull().default(""),
    watchedOn: date("watched_on", { mode: "string" }).notNull(),
    watchedTimezone: text("watched_timezone").notNull(),
    utcOffsetMinutes: smallint("utc_offset_minutes").notNull(),
    watchContext: text("watch_context"),
    locationLabel: text("location_label"),
    venueName: text("venue_name"),
    platform: text("platform"),
    mood: text("mood"),
    companions: text("companions")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    isRewatch: boolean("is_rewatch").notNull().default(false),
    movieSnapshot: jsonb("movie_snapshot").$type<MovieSnapshot>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("journal_entries_user_watched_idx").on(
      table.userId,
      table.watchedOn.desc(),
      table.id.desc(),
    ),
    index("journal_entries_user_created_idx").on(
      table.userId,
      table.createdAt.desc(),
    ),
    index("journal_entries_user_movie_idx").on(
      table.userId,
      table.movieId,
      table.watchedOn,
    ),
    index("journal_entries_user_reaction_idx").on(
      table.userId,
      table.reaction,
      table.watchedOn.desc(),
    ),
    index("journal_entries_notes_trgm_idx").using(
      "gin",
      table.notes.asc().op("gin_trgm_ops"),
    ),
    index("journal_entries_snapshot_title_trgm_idx").using(
      "gin",
      sql`(${table.movieSnapshot}->>'title') gin_trgm_ops`,
    ),
    index("journal_entries_snapshot_original_title_trgm_idx").using(
      "gin",
      sql`(${table.movieSnapshot}->>'originalTitle') gin_trgm_ops`,
    ),
    index("journal_entries_tags_idx").using("gin", table.tags),
    check(
      "journal_entries_utc_offset_range",
      sql`${table.utcOffsetMinutes} between -840 and 840`,
    ),
    check(
      "journal_entries_timezone_not_empty",
      sql`char_length(${table.watchedTimezone}) > 0`,
    ),
    check(
      "journal_entries_notes_length",
      sql`char_length(${table.notes}) <= 20000`,
    ),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type Movie = typeof movies.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
