import { describe, expect, it } from "vitest";

import {
  normalizeMovieDetails,
  normalizeMovieSearchResponse,
} from "./tmdb";

describe("TMDB normalization", () => {
  it("normalizes search results and drops adult and malformed records", () => {
    expect(
      normalizeMovieSearchResponse({
        page: 1,
        total_pages: 4,
        total_results: 62,
        results: [
          {
            id: 550,
            title: "Fight Club",
            original_title: "Fight Club",
            overview: "An insomniac meets a soap maker.",
            release_date: "1999-10-15",
            poster_path: "/poster.jpg",
            backdrop_path: "/backdrop.jpg",
            original_language: "en",
            genre_ids: [18, "bad-value"],
            popularity: 45.2,
            adult: false,
          },
          { id: 2, title: "Excluded", adult: true },
          { title: "Missing an id" },
        ],
      }),
    ).toEqual({
      page: 1,
      totalPages: 4,
      totalResults: 62,
      results: [
        {
          tmdbId: 550,
          title: "Fight Club",
          originalTitle: "Fight Club",
          overview: "An insomniac meets a soap maker.",
          releaseDate: "1999-10-15",
          posterPath: "/poster.jpg",
          backdropPath: "/backdrop.jpg",
          originalLanguage: "en",
          genreIds: [18],
          popularity: 45.2,
        },
      ],
    });
  });

  it("extracts a compact, immutable movie metadata snapshot", () => {
    const providerFetchedAt = "2026-09-02T14:30:00.000Z";

    expect(
      normalizeMovieDetails(
        {
          id: 13,
          imdb_id: null,
          title: "Forrest Gump",
          original_title: "Forrest Gump",
          overview: "A life remembered.",
          release_date: "1994-07-06",
          runtime: 142,
          poster_path: "/forrest.jpg",
          backdrop_path: null,
          original_language: "en",
          genres: [{ name: "Comedy" }, { name: "Drama" }],
          production_countries: [{ name: "United States of America" }],
          external_ids: { imdb_id: "tt0109830" },
          credits: {
            crew: [
              { job: "Director", name: "Robert Zemeckis" },
              { job: "Writer", name: "Eric Roth" },
            ],
            cast: [
              { name: "Robin Wright", order: 1 },
              { name: "Tom Hanks", order: 0 },
              { name: "Tom Hanks", order: 0 },
            ],
          },
          adult: false,
        },
        providerFetchedAt,
      ),
    ).toEqual({
      tmdbId: 13,
      imdbId: "tt0109830",
      title: "Forrest Gump",
      originalTitle: "Forrest Gump",
      overview: "A life remembered.",
      releaseDate: "1994-07-06",
      runtime: 142,
      posterPath: "/forrest.jpg",
      backdropPath: null,
      originalLanguage: "en",
      genres: ["Comedy", "Drama"],
      directors: ["Robert Zemeckis"],
      cast: ["Tom Hanks", "Robin Wright"],
      countries: ["United States of America"],
      providerFetchedAt,
    });
  });
});
