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
  voteAverage: number | null;
  voteCount: number;
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

/** TMDB's fixed list of movie genre IDs. Search results only carry the IDs. */
const MOVIE_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science fiction",
  10770: "TV movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export function genreNames(genreIds: number[], limit = 3): string[] {
  const names: string[] = [];
  for (const id of genreIds) {
    const name = MOVIE_GENRES[id];
    if (name && !names.includes(name)) names.push(name);
    if (names.length >= limit) break;
  }
  return names;
}

export function tmdbMovieUrl(tmdbId: number) {
  return `https://www.themoviedb.org/movie/${tmdbId}`;
}
