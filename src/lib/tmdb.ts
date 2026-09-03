import type {
  MovieDetails,
  MovieSearchResponse,
  MovieSearchResult,
} from "@/lib/movie-types";

const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_REQUEST_TIMEOUT_MS = 8_000;
const MAX_SEARCH_QUERY_LENGTH = 120;
const MAX_TMDB_PAGE = 500;
const MAX_STORED_CAST_MEMBERS = 12;

type JsonObject = Record<string, unknown>;

export type TmdbErrorCode =
  | "INVALID_REQUEST"
  | "NOT_FOUND"
  | "CONFIGURATION_ERROR"
  | "TIMEOUT"
  | "UPSTREAM_ERROR"
  | "INVALID_RESPONSE";

export class TmdbError extends Error {
  readonly code: TmdbErrorCode;
  readonly statusCode: number;
  readonly publicMessage: string;

  constructor(
    code: TmdbErrorCode,
    statusCode: number,
    message: string,
    publicMessage = message,
  ) {
    super(message);
    this.name = "TmdbError";
    this.code = code;
    this.statusCode = statusCode;
    this.publicMessage = publicMessage;
  }
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
    ? value
    : null;
}

function nonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
    ? value
    : null;
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    return null;
  }

  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return !Number.isNaN(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
    ? value
    : null;
}

function normalizeImagePath(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    /[\\?#]/u.test(value)
  ) {
    return null;
  }

  return value;
}

function uniqueStrings(values: Array<string | null>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (value && !seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }

  return result;
}

function namedObjects(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueStrings(
    value.map((item) => (isObject(item) ? nonEmptyString(item.name) : null)),
  );
}

export function normalizeMovieSearchResult(
  value: unknown,
): MovieSearchResult | null {
  if (!isObject(value) || value.adult !== false) {
    return null;
  }

  const tmdbId = positiveInteger(value.id);
  const title = nonEmptyString(value.title) ?? nonEmptyString(value.original_title);

  if (tmdbId === null || title === null) {
    return null;
  }

  return {
    tmdbId,
    title,
    originalTitle: nonEmptyString(value.original_title) ?? title,
    overview: nonEmptyString(value.overview) ?? "",
    releaseDate: normalizeDate(value.release_date),
    posterPath: normalizeImagePath(value.poster_path),
    backdropPath: normalizeImagePath(value.backdrop_path),
    originalLanguage: nonEmptyString(value.original_language) ?? "und",
    genreIds: Array.isArray(value.genre_ids)
      ? value.genre_ids.flatMap((genreId) => {
          const normalized = positiveInteger(genreId);
          return normalized === null ? [] : [normalized];
        })
      : [],
    popularity: finiteNumber(value.popularity) ?? 0,
  };
}

export function normalizeMovieSearchResponse(
  value: unknown,
): MovieSearchResponse | null {
  if (!isObject(value) || !Array.isArray(value.results)) {
    return null;
  }

  const results = value.results.flatMap((movie) => {
    const normalized = normalizeMovieSearchResult(movie);
    return normalized === null ? [] : [normalized];
  });

  return {
    page: positiveInteger(value.page) ?? 1,
    totalPages: nonNegativeInteger(value.total_pages) ?? 0,
    totalResults: nonNegativeInteger(value.total_results) ?? results.length,
    results,
  };
}

export function normalizeMovieDetails(
  value: unknown,
  providerFetchedAt = new Date().toISOString(),
): MovieDetails | null {
  if (!isObject(value) || value.adult !== false) {
    return null;
  }

  const tmdbId = positiveInteger(value.id);
  const title = nonEmptyString(value.title) ?? nonEmptyString(value.original_title);

  if (tmdbId === null || title === null) {
    return null;
  }

  const credits = isObject(value.credits) ? value.credits : null;
  const externalIds = isObject(value.external_ids) ? value.external_ids : null;
  const crew = credits && Array.isArray(credits.crew) ? credits.crew : [];
  const rawCast = credits && Array.isArray(credits.cast) ? credits.cast : [];
  const cast = rawCast
    .filter(isObject)
    .sort((left, right) => {
      const leftOrder = nonNegativeInteger(left.order) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = nonNegativeInteger(right.order) ?? Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder;
    });

  return {
    tmdbId,
    imdbId:
      nonEmptyString(value.imdb_id) ??
      (externalIds ? nonEmptyString(externalIds.imdb_id) : null),
    title,
    originalTitle: nonEmptyString(value.original_title) ?? title,
    overview: nonEmptyString(value.overview) ?? "",
    releaseDate: normalizeDate(value.release_date),
    runtime: nonNegativeInteger(value.runtime),
    posterPath: normalizeImagePath(value.poster_path),
    backdropPath: normalizeImagePath(value.backdrop_path),
    originalLanguage: nonEmptyString(value.original_language) ?? "und",
    genres: namedObjects(value.genres),
    directors: uniqueStrings(
      crew.map((member) =>
        isObject(member) && member.job === "Director"
          ? nonEmptyString(member.name)
          : null,
      ),
    ),
    cast: uniqueStrings(cast.map((member) => nonEmptyString(member.name))).slice(
      0,
      MAX_STORED_CAST_MEMBERS,
    ),
    countries: namedObjects(value.production_countries),
    providerFetchedAt,
  };
}

function getApiToken(): string {
  const configuredToken = process.env.TMDB_API_TOKEN?.trim();
  const token = configuredToken?.replace(/^Bearer\s+/iu, "");

  if (!token) {
    throw new TmdbError(
      "CONFIGURATION_ERROR",
      503,
      "TMDB_API_TOKEN is not configured.",
      "Movie metadata is not configured yet.",
    );
  }

  return token;
}

async function tmdbFetch(
  path: string,
  searchParams: Record<string, string>,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TMDB_REQUEST_TIMEOUT_MS);
  const url = new URL(`${TMDB_API_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${getApiToken()}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new TmdbError(
          "NOT_FOUND",
          404,
          `TMDB resource ${path} was not found.`,
          "That movie could not be found.",
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw new TmdbError(
          "CONFIGURATION_ERROR",
          503,
          `TMDB rejected the configured token with ${response.status}.`,
          "Movie metadata is not configured correctly.",
        );
      }

      throw new TmdbError(
        "UPSTREAM_ERROR",
        response.status === 429 ? 503 : 502,
        `TMDB request failed with ${response.status}.`,
        response.status === 429
          ? "Movie search is busy. Please try again shortly."
          : "Movie metadata is temporarily unavailable.",
      );
    }

    try {
      return (await response.json()) as unknown;
    } catch {
      throw new TmdbError(
        "INVALID_RESPONSE",
        502,
        "TMDB returned a non-JSON response.",
        "Movie metadata returned an unexpected response.",
      );
    }
  } catch (error) {
    if (error instanceof TmdbError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new TmdbError(
        "TIMEOUT",
        504,
        `TMDB did not respond within ${TMDB_REQUEST_TIMEOUT_MS}ms.`,
        "Movie metadata took too long to respond. Please try again.",
      );
    }

    throw new TmdbError(
      "UPSTREAM_ERROR",
      502,
      error instanceof Error
        ? `TMDB request failed: ${error.message}`
        : "TMDB request failed.",
      "Movie metadata is temporarily unavailable.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeMovieQuery(query: string): string {
  const trimmed = query.trim();
  const normalized = trimmed.replace(/\s+/gu, " ").normalize("NFC");

  if (
    /[\u0000-\u001f\u007f]/u.test(trimmed) ||
    normalized.length < 1 ||
    normalized.length > MAX_SEARCH_QUERY_LENGTH
  ) {
    throw new TmdbError(
      "INVALID_REQUEST",
      400,
      "Movie query must contain 1 to 120 printable characters.",
      "Enter a movie title between 1 and 120 characters.",
    );
  }

  return normalized;
}

export function normalizeMoviePage(page: number): number {
  if (!Number.isSafeInteger(page) || page < 1 || page > MAX_TMDB_PAGE) {
    throw new TmdbError(
      "INVALID_REQUEST",
      400,
      "TMDB page must be an integer between 1 and 500.",
      "The requested search page is invalid.",
    );
  }

  return page;
}

export async function searchMovies(
  query: string,
  page = 1,
): Promise<MovieSearchResponse> {
  const payload = await tmdbFetch("/search/movie", {
    include_adult: "false",
    language: "en-US",
    page: String(normalizeMoviePage(page)),
    query: normalizeMovieQuery(query),
  });
  const normalized = normalizeMovieSearchResponse(payload);

  if (!normalized) {
    throw new TmdbError(
      "INVALID_RESPONSE",
      502,
      "TMDB returned an invalid movie search response.",
      "Movie search returned an unexpected response.",
    );
  }

  return normalized;
}

export async function getMovieDetails(tmdbId: number): Promise<MovieDetails> {
  if (
    !Number.isSafeInteger(tmdbId) ||
    tmdbId < 1 ||
    tmdbId > 2_147_483_647
  ) {
    throw new TmdbError(
      "INVALID_REQUEST",
      400,
      "TMDB movie ID must be a positive 32-bit integer.",
      "The selected movie ID is invalid.",
    );
  }

  const payload = await tmdbFetch(`/movie/${tmdbId}`, {
    append_to_response: "credits,external_ids",
    language: "en-US",
  });

  if (isObject(payload) && payload.adult === true) {
    throw new TmdbError(
      "NOT_FOUND",
      404,
      `TMDB movie ${tmdbId} was excluded because it is adult content.`,
      "That movie could not be found.",
    );
  }

  const normalized = normalizeMovieDetails(payload);

  if (!normalized) {
    throw new TmdbError(
      "INVALID_RESPONSE",
      502,
      `TMDB returned invalid details for movie ${tmdbId}.`,
      "Movie metadata returned an unexpected response.",
    );
  }

  return normalized;
}
