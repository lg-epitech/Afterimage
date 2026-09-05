"use client";

import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  LoaderCircle,
  Search,
  Star,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { clsx } from "clsx";
import { genreNames, tmdbMovieUrl } from "@/lib/movie-types";
import type { MovieSearchResult } from "@/lib/movie-types";
import type { MemoryEntry, Reaction } from "@/lib/types";
import { backdropUrl, MoviePoster, posterUrl } from "@/components/movie-poster";

const reactionOptions: Array<{
  value: Reaction;
  label: string;
  Icon: typeof Heart;
}> = [
  { value: "didnt_like", label: "Didn't like", Icon: ThumbsDown },
  { value: "liked", label: "Liked", Icon: ThumbsUp },
  { value: "loved", label: "Loved", Icon: Heart },
];

function localDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseList(
  value: string,
  label: string,
  maxItems: number,
  maxItemLength: number,
) {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length > maxItems) {
    return {
      items: [],
      error: `${label} can hold at most ${maxItems} names, separated by commas.`,
    };
  }

  const tooLong = items.find((item) => item.length > maxItemLength);
  if (tooLong) {
    return {
      items: [],
      error: `Each item in ${label.toLowerCase()} must be ${maxItemLength} characters or fewer.`,
    };
  }

  return { items, error: null };
}

function Rating({ value }: { value: number | null }) {
  if (value === null) return null;
  return (
    <span className="rating" aria-label={`Rated ${value.toFixed(1)} out of 10 on TMDB`}>
      <Star size={11} strokeWidth={0} fill="currentColor" aria-hidden="true" />
      {value.toFixed(1)}
    </span>
  );
}

function FilmMeta({ movie }: { movie: MovieSearchResult }) {
  const year = movie.releaseDate?.slice(0, 4);
  const genres = genreNames(movie.genreIds, 2);
  return (
    <p className="film-meta">
      {year && <span>{year}</span>}
      {genres.map((genre) => (
        <span key={genre}>{genre}</span>
      ))}
      <Rating value={movie.voteAverage} />
    </p>
  );
}

function TopResult({
  movie,
  id,
  active,
  onHover,
  onChoose,
}: {
  movie: MovieSearchResult;
  id: string;
  active: boolean;
  onHover: () => void;
  onChoose: () => void;
}) {
  const backdrop = backdropUrl(movie.backdropPath);
  const poster = posterUrl(movie.posterPath, "w500");
  const art = backdrop ?? poster;

  return (
    <article
      id={id}
      className={clsx("hero", active && "hero--active")}
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
    >
      <div className={clsx("hero__art", !backdrop && poster && "hero__art--poster")}>
        {art ? (
          <Image
            src={art}
            alt=""
            fill
            sizes="(max-width: 720px) 100vw, 560px"
            preload
          />
        ) : (
          <span className="hero__initial" aria-hidden="true">
            {movie.title.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="hero__body">
        <h3 className="hero__title">{movie.title}</h3>
        {movie.originalTitle !== movie.title && (
          <p className="hero__original">{movie.originalTitle}</p>
        )}
        <FilmMeta movie={movie} />
        <p className="hero__overview">
          {movie.overview || "TMDB has no synopsis for this film yet."}
        </p>
        <div className="hero__actions">
          <button className="btn btn--primary" type="button" onClick={onChoose}>
            Add to journal
          </button>
          <a
            className="btn btn--ghost"
            href={tmdbMovieUrl(movie.tmdbId)}
            target="_blank"
            rel="noreferrer"
          >
            Open on TMDB
          </a>
        </div>
      </div>
    </article>
  );
}

function ResultsSkeleton() {
  return (
    <div className="results__skeleton" aria-hidden="true">
      <div className="skeleton skeleton--label" />
      <div className="skeleton skeleton--hero" />
      <div className="skeleton skeleton--label" />
      <div className="skeleton-row">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div className="skeleton skeleton--card" key={item} />
        ))}
      </div>
    </div>
  );
}

export function QuickAdd({
  onCreated,
  onActiveChange,
}: {
  onCreated: (entry: MemoryEntry) => void;
  onActiveChange?: (active: boolean) => void;
}) {
  const listboxId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const latestQueryRef = useRef("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [selected, setSelected] = useState<MovieSearchResult | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [notes, setNotes] = useState("");
  const [watchedOn, setWatchedOn] = useState(localDate());
  const [watchContext, setWatchContext] = useState("home");
  const [locationLabel, setLocationLabel] = useState("");
  const [venueName, setVenueName] = useState("");
  const [platform, setPlatform] = useState("");
  const [companions, setCompanions] = useState("");
  const [tags, setTags] = useState("");
  const [mood, setMood] = useState("");
  const [isRewatch, setIsRewatch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedTitle, setSavedTitle] = useState<string | null>(null);
  const [railEdges, setRailEdges] = useState({ start: true, end: true });

  const trimmedQuery = query.trim();
  const showResults = !selected && trimmedQuery.length >= 2;
  const active = showResults || selected !== null;

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  const measureRail = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setRailEdges({
      start: rail.scrollLeft <= 12,
      end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 12,
    });
  }, []);

  useEffect(() => {
    measureRail();
    window.addEventListener("resize", measureRail);
    return () => window.removeEventListener("resize", measureRail);
  }, [measureRail, results]);

  useEffect(() => {
    if (selected || trimmedQuery.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);

      try {
        const response = await fetch(
          `/api/movies/search?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal },
        );
        const body = (await response.json()) as {
          results?: MovieSearchResult[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(body.error || "Film search is unavailable right now.");
        }

        if (controller.signal.aborted || latestQueryRef.current !== trimmedQuery) return;

        setResults(body.results ?? []);
        setActiveIndex(0);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (latestQueryRef.current !== trimmedQuery) return;
        setResults([]);
        setSearchError(error instanceof Error ? error.message : "Film search failed.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 280);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmedQuery, selected, searchAttempt]);

  function clearEntryFields() {
    setReaction(null);
    setNotes("");
    setWatchedOn(localDate());
    setWatchContext("home");
    setLocationLabel("");
    setVenueName("");
    setPlatform("");
    setCompanions("");
    setTags("");
    setMood("");
    setIsRewatch(false);
    setSaveError(null);
  }

  function changeQuery(value: string) {
    const trimmed = value.trim();

    if (selected) clearEntryFields();

    latestQueryRef.current = trimmed;
    setQuery(value);
    setSelected(null);
    setResults([]);
    setActiveIndex(0);
    setSearchError(null);
    setSearching(trimmed.length >= 2);
    setSavedTitle(null);
  }

  function chooseMovie(movie: MovieSearchResult) {
    latestQueryRef.current = "";
    setSelected(movie);
    setQuery(movie.title);
    setResults([]);
    setSearchError(null);
    setSaveError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSearchKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (query) {
        event.preventDefault();
        resetComposer();
      }
      return;
    }

    if (!showResults || !results.length) return;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      chooseMovie(results[activeIndex]);
    }
  }

  function resetComposer(preserveSavedTitle = false) {
    latestQueryRef.current = "";
    setSelected(null);
    setQuery("");
    setResults([]);
    setActiveIndex(0);
    setSearchError(null);
    setSearching(false);
    clearEntryFields();
    if (!preserveSavedTitle) setSavedTitle(null);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  }

  function scrollRail(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(rail.clientWidth - 120, 200), behavior: "smooth" });
  }

  async function saveMemory() {
    if (!selected || !reaction || saving) return;

    const companionList = parseList(companions, "Watched with", 20, 100);
    const tagList = parseList(tags, "Tags", 30, 50);
    const listError = companionList.error || tagList.error;
    if (listError) {
      setSaveError(listError);
      return;
    }

    setSaving(true);
    setSaveError(null);

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const localNoon = new Date(`${watchedOn}T12:00:00`);
    const utcOffsetMinutes = -localNoon.getTimezoneOffset();

    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: selected.tmdbId,
          reaction,
          notes: notes.trim(),
          watchedOn,
          watchedTimezone: timezone,
          utcOffsetMinutes,
          watchContext,
          locationLabel: locationLabel.trim() || null,
          venueName: venueName.trim() || null,
          platform: platform.trim() || null,
          mood: mood.trim() || null,
          companions: companionList.items,
          tags: tagList.items,
          isRewatch,
        }),
      });

      const body = (await response.json()) as {
        entry?: MemoryEntry;
        error?: string;
        issues?: Array<{ path: string; message: string }>;
      };
      if (!response.ok || !body.entry) {
        const issueMessage = body.issues
          ?.map((issue) => `${issue.path || "Entry"}: ${issue.message}`)
          .join("; ");
        throw new Error(issueMessage || body.error || "The entry could not be saved.");
      }

      setSavedTitle(selected.title);
      onCreated(body.entry);
      resetComposer(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The entry could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const topResult = results[0];
  const moreResults = results.slice(1);
  const optionId = (movie: MovieSearchResult) => `${listboxId}-${movie.tmdbId}`;

  return (
    <section className="add" aria-labelledby="add-title">
      <h1 id="add-title" className="sr-only">
        Add a film to your journal
      </h1>

      <div className={clsx("searchbar", active && "searchbar--active")}>
        <Search className="searchbar__icon" size={26} strokeWidth={2} aria-hidden="true" />
        <input
          ref={searchInputRef}
          className="searchbar__input"
          value={query}
          onChange={(event) => changeQuery(event.target.value)}
          onKeyDown={handleSearchKeys}
          placeholder="Search a film you watched"
          aria-label="Search a film you watched"
          role="combobox"
          aria-expanded={showResults}
          aria-controls={showResults ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            showResults && results[activeIndex] ? optionId(results[activeIndex]) : undefined
          }
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
        />
        {searching ? (
          <LoaderCircle className="searchbar__spinner spin" size={22} aria-label="Searching" />
        ) : query ? (
          <button
            className="searchbar__clear"
            type="button"
            onClick={() => resetComposer()}
            aria-label={selected ? "Clear the film and start over" : "Clear search"}
          >
            <X size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {showResults && (
        <div
          className="results"
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          aria-busy={searching}
        >
          {searching && !results.length && !searchError ? (
            <ResultsSkeleton />
          ) : topResult ? (
            <>
              <h2 className="results__label">Top result</h2>
              <TopResult
                movie={topResult}
                id={optionId(topResult)}
                active={activeIndex === 0}
                onHover={() => setActiveIndex(0)}
                onChoose={() => chooseMovie(topResult)}
              />

              {moreResults.length > 0 && (
                <>
                  <h2 className="results__label">More results</h2>
                  <div className="rail">
                    <div className="rail__track" ref={railRef} onScroll={measureRail}>
                      {moreResults.map((movie, offset) => {
                        const index = offset + 1;
                        return (
                          <button
                            key={movie.tmdbId}
                            id={optionId(movie)}
                            className={clsx("card", index === activeIndex && "card--active")}
                            type="button"
                            role="option"
                            aria-selected={index === activeIndex}
                            tabIndex={-1}
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => chooseMovie(movie)}
                          >
                            <MoviePoster
                              path={movie.posterPath}
                              title={movie.title}
                              className="card__poster"
                              size="w342"
                              sizes="(max-width: 520px) 132px, 168px"
                            />
                            {movie.voteAverage !== null && (
                              <span className="card__rating">
                                <Rating value={movie.voteAverage} />
                              </span>
                            )}
                            <span className="card__text">
                              <strong>{movie.title}</strong>
                              <small>{movie.releaseDate?.slice(0, 4) || "Year unknown"}</small>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      className="rail__arrow rail__arrow--prev"
                      type="button"
                      aria-label="Scroll results left"
                      hidden={railEdges.start}
                      onClick={() => scrollRail(-1)}
                    >
                      <ChevronLeft size={20} aria-hidden="true" />
                    </button>
                    <button
                      className="rail__arrow rail__arrow--next"
                      type="button"
                      aria-label="Scroll results right"
                      hidden={railEdges.end}
                      onClick={() => scrollRail(1)}
                    >
                      <ChevronRight size={20} aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </>
          ) : searchError ? (
            <div className="results__message results__message--error" role="alert">
              <p>{searchError}</p>
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => setSearchAttempt((attempt) => attempt + 1)}
              >
                Try again
              </button>
            </div>
          ) : !searching ? (
            <div className="results__message" role="status">
              <p>
                Nothing found for “{trimmedQuery}”. Check the spelling or try the
                original title.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {selected && (
        <div className="compose">
          <div className="compose__film">
            <MoviePoster
              path={selected.posterPath}
              title={selected.title}
              className="compose__poster"
              size="w342"
              sizes="(max-width: 720px) 96px, 200px"
              preload
            />
            <div className="compose__film-text">
              <h2 className="compose__title">{selected.title}</h2>
              {selected.originalTitle !== selected.title && (
                <p className="compose__original">{selected.originalTitle}</p>
              )}
              <FilmMeta movie={selected} />
              <p className="compose__overview">
                {selected.overview || "TMDB has no synopsis for this film yet."}
              </p>
              <button className="link-button" type="button" onClick={() => resetComposer()}>
                Choose a different film
              </button>
            </div>
          </div>

          <form
            className="compose__form"
            onSubmit={(event) => {
              event.preventDefault();
              void saveMemory();
            }}
          >
            <fieldset className="field">
              <legend className="field__label">How did it leave you?</legend>
              <div className="segmented segmented--reaction">
                {reactionOptions.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    className={clsx(
                      "segmented__option",
                      `segmented__option--${value}`,
                      reaction === value && "segmented__option--on",
                    )}
                    type="button"
                    aria-pressed={reaction === value}
                    onClick={() => setReaction(value)}
                  >
                    <Icon size={15} strokeWidth={2} aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="field field--note">
              <span className="field__label">What stayed with you?</span>
              <textarea
                className="field__input field__input--note"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="A scene, a line, the conversation on the way home."
                rows={5}
                maxLength={5000}
              />
              <small className="field__count">{notes.length} / 5000</small>
            </label>

            <div className="field field--date">
              <label>
                <span className="field__label">Watched on</span>
                <input
                  className="field__input"
                  type="date"
                  value={watchedOn}
                  max={localDate()}
                  onChange={(event) => setWatchedOn(event.target.value)}
                  required
                />
              </label>
              <div className="date-quick" aria-label="Date shortcuts">
                <button
                  type="button"
                  className={clsx(watchedOn === localDate() && "date-quick--on")}
                  onClick={() => setWatchedOn(localDate())}
                >
                  Today
                </button>
                <button
                  type="button"
                  className={clsx(watchedOn === localDate(-1) && "date-quick--on")}
                  onClick={() => setWatchedOn(localDate(-1))}
                >
                  Yesterday
                </button>
              </div>
            </div>

            <details className="more">
              <summary>
                <span>Where, who, and how</span>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <div className="more__grid">
                <label className="field">
                  <span className="field__label">Setting</span>
                  <select
                    className="field__input"
                    value={watchContext}
                    onChange={(event) => setWatchContext(event.target.value)}
                  >
                    <option value="home">At home</option>
                    <option value="cinema">At the cinema</option>
                    <option value="festival">At a festival</option>
                    <option value="travel">While travelling</option>
                    <option value="other">Somewhere else</option>
                  </select>
                </label>
                <label className="field">
                  <span className="field__label">Place</span>
                  <input
                    className="field__input"
                    value={locationLabel}
                    onChange={(event) => setLocationLabel(event.target.value)}
                    placeholder="Montreal"
                    maxLength={160}
                  />
                </label>
                <label className="field">
                  <span className="field__label">Venue</span>
                  <input
                    className="field__input"
                    value={venueName}
                    onChange={(event) => setVenueName(event.target.value)}
                    placeholder="Cinéma du Parc"
                    maxLength={160}
                  />
                </label>
                <label className="field">
                  <span className="field__label">Platform</span>
                  <input
                    className="field__input"
                    value={platform}
                    onChange={(event) => setPlatform(event.target.value)}
                    placeholder="MUBI, Blu-ray, a friend's projector"
                    maxLength={100}
                  />
                </label>
                <label className="field">
                  <span className="field__label">Watched with</span>
                  <input
                    className="field__input"
                    value={companions}
                    onChange={(event) => setCompanions(event.target.value)}
                    placeholder="Names, separated by commas"
                    maxLength={500}
                  />
                </label>
                <label className="field">
                  <span className="field__label">Mood</span>
                  <input
                    className="field__input"
                    value={mood}
                    onChange={(event) => setMood(event.target.value)}
                    placeholder="Restless, hopeful, tired"
                    maxLength={100}
                  />
                </label>
                <label className="field more__wide">
                  <span className="field__label">Tags</span>
                  <input
                    className="field__input"
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    placeholder="late night, comfort film, separated by commas"
                    maxLength={500}
                  />
                </label>
                <label className="switch more__wide">
                  <input
                    type="checkbox"
                    checked={isRewatch}
                    onChange={(event) => setIsRewatch(event.target.checked)}
                  />
                  <span className="switch__track" aria-hidden="true" />
                  <span className="switch__text">
                    <strong>This was a rewatch</strong>
                    <small>Each viewing is its own entry.</small>
                  </span>
                </label>
              </div>
            </details>

            {saveError && (
              <p className="form-error" role="alert">
                {saveError}
              </p>
            )}

            <div className="compose__actions">
              <button
                className="btn btn--primary btn--large"
                type="submit"
                disabled={!reaction || !watchedOn || saving}
              >
                {saving ? (
                  <>
                    <LoaderCircle className="spin" size={18} aria-hidden="true" /> Saving
                  </>
                ) : (
                  "Save to journal"
                )}
              </button>
              {!reaction && <span className="form-hint">Pick a reaction first.</span>}
            </div>
          </form>
        </div>
      )}

      {savedTitle && !active && (
        <div className="toast" role="status">
          <Check size={16} strokeWidth={2.4} aria-hidden="true" />
          <span>Saved {savedTitle} to your journal.</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setSavedTitle(null)}
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
