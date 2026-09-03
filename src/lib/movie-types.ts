export type MovieSearchResult = {
  tmdbId: number;
  title: string;
  originalTitle: string;
  overview: string;
  releaseDate: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  originalLanguage: string;
  genreIds: number[];
  popularity: number;
};

export type MovieSearchResponse = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: MovieSearchResult[];
};

export type MovieDetails = {
  tmdbId: number;
  imdbId: string | null;
  title: string;
  originalTitle: string;
  overview: string;
  releaseDate: string | null;
  runtime: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  originalLanguage: string;
  genres: string[];
  directors: string[];
  cast: string[];
  countries: string[];
  providerFetchedAt: string;
};

export type TmdbImageSize =
  | "w185"
  | "w342"
  | "w500"
  | "w780"
  | "w1280"
  | "original";

/** Build a public TMDB image URL from a normalized poster or backdrop path. */
export function getTmdbImageUrl(
  path: string | null,
  size: TmdbImageSize = "w500",
): string | null {
  if (!path || !path.startsWith("/") || /[\\?#]/u.test(path)) {
    return null;
  }

  return `https://image.tmdb.org/t/p/${size}${path}`;
}
