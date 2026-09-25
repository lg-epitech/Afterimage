import { and, desc, eq, or, sql, type SQL } from "drizzle-orm";

import { getDb } from "@/db";
import {
  journalEntries,
  movies,
  profiles,
  type JournalEntry,
  type Movie,
} from "@/db/schema";
import type { MovieDetails } from "@/lib/movie-types";
import type {
  MemoryEntry,
  MovieSnapshot,
  StatsSummary,
} from "@/lib/types";
import type { CreateEntryInput, EntriesQuery } from "@/lib/validation";

function toMemoryEntry(entry: JournalEntry, movie: Movie): MemoryEntry {
  const snapshot = entry.movieSnapshot;

  return {
    id: entry.id,
    reaction: entry.reaction,
    notes: entry.notes,
    watchedOn: entry.watchedOn,
    watchedTimezone: entry.watchedTimezone,
    utcOffsetMinutes: entry.utcOffsetMinutes,
    watchContext: entry.watchContext,
    locationLabel: entry.locationLabel,
    venueName: entry.venueName,
    platform: entry.platform,
    mood: entry.mood,
    companions: entry.companions,
    tags: entry.tags,
    isRewatch: entry.isRewatch,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    movie: {
      id: movie.id,
      tmdbId: snapshot.tmdbId,
      imdbId: snapshot.imdbId,
      title: snapshot.title,
      originalTitle: snapshot.originalTitle,
      overview: snapshot.overview,
      releaseDate: snapshot.releaseDate,
      runtimeMinutes: snapshot.runtimeMinutes,
      posterPath: snapshot.posterPath,
      backdropPath: snapshot.backdropPath,
      originalLanguage: snapshot.originalLanguage,
      genres: snapshot.genres,
      directors: snapshot.directors,
      cast: snapshot.cast,
      countries: snapshot.countries,
      providerFetchedAt: snapshot.capturedAt,
    },
  };
}

function toMovieSnapshot(details: MovieDetails): MovieSnapshot {
  return {
    schemaVersion: 1,
    provider: "tmdb",
    capturedAt: details.providerFetchedAt,
    tmdbId: details.tmdbId,
    imdbId: details.imdbId,
    title: details.title,
    originalTitle: details.originalTitle,
    overview: details.overview,
    releaseDate: details.releaseDate,
    runtimeMinutes: details.runtime,
    posterPath: details.posterPath,
    backdropPath: details.backdropPath,
    originalLanguage: details.originalLanguage,
    genres: details.genres,
    directors: details.directors,
    cast: details.cast,
    countries: details.countries,
  };
}

export async function createMemoryEntry(
  userId: string,
  input: CreateEntryInput,
  details: MovieDetails,
): Promise<MemoryEntry> {
  const db = getDb();
  const now = new Date();
  const providerFetchedAt = new Date(details.providerFetchedAt);

  if (Number.isNaN(providerFetchedAt.getTime())) {
    throw new Error("Movie provider returned an invalid fetch timestamp");
  }

  return db.transaction(async (tx) => {
    await tx
      .insert(profiles)
      .values({
        clerkUserId: userId,
        timezone: input.watchedTimezone,
      })
      .onConflictDoUpdate({
        target: profiles.clerkUserId,
        set: {
          timezone: input.watchedTimezone,
          updatedAt: now,
        },
      });

    const [movie] = await tx
      .insert(movies)
      .values({
        tmdbId: details.tmdbId,
        imdbId: details.imdbId,
        title: details.title,
        originalTitle: details.originalTitle,
        overview: details.overview,
        releaseDate: details.releaseDate,
        runtimeMinutes: details.runtime,
        posterPath: details.posterPath,
        backdropPath: details.backdropPath,
        originalLanguage: details.originalLanguage,
        genres: details.genres,
        directors: details.directors,
        cast: details.cast,
        countries: details.countries,
        providerFetchedAt,
      })
      .onConflictDoUpdate({
        target: movies.tmdbId,
        set: {
          imdbId: details.imdbId,
          title: details.title,
          originalTitle: details.originalTitle,
          overview: details.overview,
          releaseDate: details.releaseDate,
          runtimeMinutes: details.runtime,
          posterPath: details.posterPath,
          backdropPath: details.backdropPath,
          originalLanguage: details.originalLanguage,
          genres: details.genres,
          directors: details.directors,
          cast: details.cast,
          countries: details.countries,
          providerFetchedAt,
          updatedAt: now,
        },
      })
      .returning();

    if (!movie) throw new Error("Movie upsert did not return a row");

    const [entry] = await tx
      .insert(journalEntries)
      .values({
        userId,
        movieId: movie.id,
        reaction: input.reaction,
        notes: input.notes,
        watchedOn: input.watchedOn,
        watchedTimezone: input.watchedTimezone,
        utcOffsetMinutes: input.utcOffsetMinutes,
        watchContext: input.watchContext,
        locationLabel: input.locationLabel,
        venueName: input.venueName,
        platform: input.platform,
        mood: input.mood,
        companions: input.companions,
        tags: input.tags,
        isRewatch: input.isRewatch,
        movieSnapshot: toMovieSnapshot(details),
      })
      .returning();

    if (!entry) throw new Error("Entry insert did not return a row");

    return toMemoryEntry(entry, movie);
  });
}

export async function listMemoryEntries(
  userId: string,
  input: EntriesQuery,
): Promise<{
  entries: MemoryEntry[];
  hasMore: boolean;
  nextOffset: number | null;
}> {
  const db = getDb();
  const conditions: SQL[] = [eq(journalEntries.userId, userId)];

  if (input.reaction) {
    conditions.push(eq(journalEntries.reaction, input.reaction));
  }

  if (input.q) {
    const pattern = `%${input.q}%`;
    conditions.push(
      or(
        sql<boolean>`${journalEntries.movieSnapshot}->>'title' ilike ${pattern}`,
        sql<boolean>`${journalEntries.movieSnapshot}->>'originalTitle' ilike ${pattern}`,
        sql<boolean>`${journalEntries.movieSnapshot}->>'overview' ilike ${pattern}`,
        sql<boolean>`${journalEntries.notes} ilike ${pattern}`,
        sql<boolean>`${journalEntries.locationLabel} ilike ${pattern}`,
        sql<boolean>`${journalEntries.venueName} ilike ${pattern}`,
        sql<boolean>`${journalEntries.platform} ilike ${pattern}`,
        sql<boolean>`${journalEntries.mood} ilike ${pattern}`,
        sql<boolean>`exists (
          select 1
          from jsonb_array_elements_text(${journalEntries.movieSnapshot}->'genres') as item(value)
          where item.value ilike ${pattern}
        )`,
        sql<boolean>`exists (
          select 1
          from jsonb_array_elements_text(${journalEntries.movieSnapshot}->'directors') as item(value)
          where item.value ilike ${pattern}
        )`,
        sql<boolean>`exists (
          select 1
          from jsonb_array_elements_text(${journalEntries.movieSnapshot}->'cast') as item(value)
          where item.value ilike ${pattern}
        )`,
        sql<boolean>`array_to_string(${journalEntries.companions}, ' ') ilike ${pattern}`,
        sql<boolean>`array_to_string(${journalEntries.tags}, ' ') ilike ${pattern}`,
      )!,
    );
  }

  const rows = await db
    .select({ entry: journalEntries, movie: movies })
    .from(journalEntries)
    .innerJoin(movies, eq(journalEntries.movieId, movies.id))
    .where(and(...conditions))
    .orderBy(
      desc(journalEntries.watchedOn),
      desc(journalEntries.createdAt),
      desc(journalEntries.id),
    )
    .limit(input.limit + 1)
    .offset(input.offset);

  const hasMore = rows.length > input.limit;
  const entries = rows
    .slice(0, input.limit)
    .map(({ entry, movie }) => toMemoryEntry(entry, movie));

  return {
    entries,
    hasMore,
    nextOffset: hasMore ? input.offset + entries.length : null,
  };
}

export async function getMemoryStats(userId: string): Promise<StatsSummary> {
  const db = getDb();
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      loved: sql<number>`count(*) filter (where ${journalEntries.reaction} = 'loved')::int`,
      rewatches: sql<number>`count(*) filter (where ${journalEntries.isRewatch})::int`,
      totalMinutes: sql<number>`coalesce(sum(
        nullif(${journalEntries.movieSnapshot}->>'runtimeMinutes', '')::int
      ), 0)::int`,
    })
    .from(journalEntries)
    .innerJoin(movies, eq(journalEntries.movieId, movies.id))
    .where(eq(journalEntries.userId, userId));

  return {
    total: totals?.total ?? 0,
    loved: totals?.loved ?? 0,
    rewatches: totals?.rewatches ?? 0,
    totalMinutes: totals?.totalMinutes ?? 0,
  };
}

export async function deleteMemoryEntry(userId: string, entryId: string) {
  const db = getDb();
  const [deleted] = await db
    .delete(journalEntries)
    .where(
      and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)),
    )
    .returning({ id: journalEntries.id });

  return deleted !== undefined;
}
