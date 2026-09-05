import { SignInButton } from "@clerk/nextjs";
import { Search } from "lucide-react";
import type { MemoryEntry } from "@/lib/types";
import { EntryRow } from "@/components/entry-row";

function sample(
  id: string,
  movie: Pick<MemoryEntry["movie"], "tmdbId" | "title" | "releaseDate" | "posterPath" | "directors">,
  entry: Partial<Omit<MemoryEntry, "movie" | "id">>,
): MemoryEntry {
  return {
    id,
    reaction: "liked",
    notes: "",
    watchedOn: "2026-08-01",
    watchedTimezone: "UTC",
    utcOffsetMinutes: 0,
    watchContext: "home",
    locationLabel: null,
    venueName: null,
    platform: null,
    mood: null,
    companions: [],
    tags: [],
    isRewatch: false,
    createdAt: "2026-08-01T21:00:00.000Z",
    updatedAt: "2026-08-01T21:00:00.000Z",
    ...entry,
    movie: {
      id: `movie-${movie.tmdbId}`,
      imdbId: null,
      originalTitle: movie.title,
      overview: "",
      runtimeMinutes: null,
      backdropPath: null,
      originalLanguage: "en",
      genres: [],
      cast: [],
      countries: [],
      providerFetchedAt: "2026-08-01T21:00:00.000Z",
      ...movie,
    },
  };
}

const sampleEntries: MemoryEntry[] = [
  sample(
    "sample-1",
    {
      tmdbId: 153,
      title: "Lost in Translation",
      releaseDate: "2003-08-31",
      posterPath: "/3jCLmYDIIiSMPujbwygNpqdpM8N.jpg",
      directors: ["Sofia Coppola"],
    },
    {
      reaction: "loved",
      notes:
        "The karaoke scene got me again. We paused it twice to talk about Tokyo, and then just let the credits run.",
      watchedOn: "2026-08-22",
      companions: ["Nadia"],
      isRewatch: true,
    },
  ),
  sample(
    "sample-2",
    {
      tmdbId: 376867,
      title: "Moonlight",
      releaseDate: "2016-10-21",
      posterPath: "/qLnfEmPrDjJfPyyddLJPkXmshkp.jpg",
      directors: ["Barry Jenkins"],
    },
    {
      reaction: "loved",
      notes: "The diner scene. Nobody in the room said anything for a full minute after.",
      watchedOn: "2026-07-14",
      watchContext: "cinema",
      venueName: "Cinéma du Parc",
      companions: ["Tom", "Léa"],
    },
  ),
  sample(
    "sample-3",
    {
      tmdbId: 843,
      title: "In the Mood for Love",
      releaseDate: "2000-09-29",
      posterPath: "/iYypPT4bhqXfq1b6EnmxvRt6b2Y.jpg",
      directors: ["Wong Kar-wai"],
    },
    {
      reaction: "liked",
      notes: "Rainy Sunday. Not sure I got all of it, but I keep thinking about the corridor.",
      watchedOn: "2026-06-08",
      platform: "MUBI",
    },
  ),
];

export function SignedOutLanding() {
  return (
    <section className="landing">
      <div className="landing__intro">
        <h1 className="landing__title">
          A journal for the films that stay with you.
        </h1>
        <p className="landing__lede">
          Search what you watched, say how it left you, and keep the note, the
          people, and the place. Only you can see it.
        </p>

        <SignInButton mode="modal" forceRedirectUrl="/">
          <button className="searchbar searchbar--landing" type="button">
            <Search className="searchbar__icon" size={26} strokeWidth={2} aria-hidden="true" />
            <span className="searchbar__placeholder">Search a film you watched</span>
          </button>
        </SignInButton>

        <p className="landing__hint">
          You&apos;ll be asked to sign in first. It takes a few seconds.
        </p>
      </div>

      <div className="landing__sample" aria-label="Example journal entries">
        <h2 className="landing__sample-title">What an entry looks like</h2>
        <div className="entry-list">
          {sampleEntries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} readOnly />
          ))}
        </div>
      </div>
    </section>
  );
}
