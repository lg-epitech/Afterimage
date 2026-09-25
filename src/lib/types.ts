export const REACTIONS = ["didnt_like", "liked", "loved"] as const;

export type Reaction = (typeof REACTIONS)[number];

export interface MovieSnapshot {
  schemaVersion: 1;
  provider: "tmdb";
  capturedAt: string;
  tmdbId: number;
  imdbId: string | null;
  title: string;
  originalTitle: string;
  overview: string;
  releaseDate: string | null;
  runtimeMinutes: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  originalLanguage: string;
  genres: string[];
  directors: string[];
  cast: string[];
  countries: string[];
}

export interface MemoryMovie {
  id: string;
  tmdbId: number;
  imdbId: string | null;
  title: string;
  originalTitle: string;
  overview: string;
  releaseDate: string | null;
  runtimeMinutes: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  originalLanguage: string;
  genres: string[];
  directors: string[];
  cast: string[];
  countries: string[];
  providerFetchedAt: string;
}

export interface MemoryEntry {
  id: string;
  reaction: Reaction;
  notes: string;
  watchedOn: string;
  watchedTimezone: string;
  utcOffsetMinutes: number;
  watchContext: string | null;
  locationLabel: string | null;
  venueName: string | null;
  platform: string | null;
  mood: string | null;
  companions: string[];
  tags: string[];
  isRewatch: boolean;
  createdAt: string;
  updatedAt: string;
  movie: MemoryMovie;
}

export interface EntriesResponse {
  entries: MemoryEntry[];
  hasMore: boolean;
  nextOffset: number | null;
}

export interface CreateEntryResponse {
  entry: MemoryEntry;
}

export interface StatsSummary {
  total: number;
  loved: number;
  rewatches: number;
  totalMinutes: number;
}
