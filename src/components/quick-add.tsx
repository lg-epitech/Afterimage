"use client";

import {
  CalendarDays,
  Check,
  ChevronDown,
  Heart,
  LoaderCircle,
  MapPin,
  RotateCcw,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Users,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { MovieSearchResult } from "@/lib/movie-types";
import type { MemoryEntry, Reaction } from "@/lib/types";
import { MoviePoster } from "@/components/movie-poster";

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
      error: `${label} can contain at most ${maxItems} comma-separated items.`,
    };
  }

  const tooLong = items.find((item) => item.length > maxItemLength);
  if (tooLong) {
    return {
      items: [],
      error: `${label} items must each be ${maxItemLength} characters or fewer.`,
    };
  }

  return { items, error: null };
}

export function QuickAdd({ onCreated }: { onCreated: (entry: MemoryEntry) => void }) {
  const listboxId = useId();
  const composerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const latestQueryRef = useRef("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [selected, setSelected] = useState<MovieSearchResult | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
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

  useEffect(() => {
    function closeSearch(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !composerRef.current?.contains(event.target)
      ) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeSearch);
    return () => document.removeEventListener("pointerdown", closeSearch);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (selected || trimmed.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);

      try {
        const response = await fetch(`/api/movies/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const body = (await response.json()) as {
          results?: MovieSearchResult[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(body.error || "Movie search is unavailable right now.");
        }

        if (controller.signal.aborted || latestQueryRef.current !== trimmed) return;

        setResults(body.results ?? []);
        setActiveIndex(0);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (latestQueryRef.current !== trimmed) return;
        setResults([]);
        setSearchError(error instanceof Error ? error.message : "Movie search failed.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 280);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, selected]);

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
    setSearchOpen(trimmed.length >= 2);
    setSearchError(null);
    setSearching(trimmed.length >= 2);
    setSavedTitle(null);
  }

  function chooseMovie(movie: MovieSearchResult) {
    latestQueryRef.current = "";
    setSelected(movie);
    setQuery(movie.title);
    setResults([]);
    setSearchOpen(false);
    setSearchError(null);
    setSaveError(null);
  }

  function handleSearchKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && searchOpen) {
      event.preventDefault();
      setSearchOpen(false);
      return;
    }

    if (!searchOpen && results.length && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      setSearchOpen(true);
      return;
    }

    if (!searchOpen) return;
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
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
    setSearchOpen(false);
    setSearchError(null);
    setSearching(false);
    clearEntryFields();
    if (!preserveSavedTitle) setSavedTitle(null);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
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
        throw new Error(
          issueMessage || body.error || "Your memory could not be saved.",
        );
      }

      setSavedTitle(selected.title);
      onCreated(body.entry);
      resetComposer(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Your memory could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const showResults = searchOpen && !selected && query.trim().length >= 2;

  return (
    <section className="quick-add" aria-labelledby="quick-add-title">
      <div className="quick-add__heading">
        <div>
          <span className="section-kicker">Add a memory</span>
          <h1 id="quick-add-title">What did you watch?</h1>
        </div>
        <p>Start with a title. Keep what mattered.</p>
      </div>

      <div
        ref={composerRef}
        className={`composer ${selected ? "composer--expanded" : ""}`}
        onBlur={(event) => {
          if (
            event.relatedTarget instanceof Node &&
            composerRef.current?.contains(event.relatedTarget)
          ) {
            return;
          }
          setSearchOpen(false);
        }}
      >
        <div className="movie-search">
          <Search size={22} strokeWidth={1.75} aria-hidden="true" />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            onKeyDown={handleSearchKeys}
            onFocus={() => {
              if (!selected && query.trim().length >= 2) setSearchOpen(true);
            }}
            placeholder="Search for a film…"
            aria-label="Search for a film"
            role="combobox"
            aria-expanded={showResults}
            aria-controls={showResults ? listboxId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={
              showResults && results[activeIndex]
                ? `${listboxId}-${results[activeIndex].tmdbId}`
                : undefined
            }
            autoComplete="off"
          />
          {searching ? (
            <LoaderCircle className="spin" size={19} aria-label="Searching" />
          ) : query ? (
            <button
              className="icon-button"
              type="button"
              onClick={() => resetComposer()}
              aria-label={selected ? "Clear selected film and entry" : "Clear search"}
            >
              <X size={18} />
            </button>
          ) : (
            <span className="search-hint">Title or original title</span>
          )}
        </div>

        {showResults && (
          <div className="search-popover">
            <div
              id={listboxId}
              role="listbox"
              aria-label="Movie search results"
              aria-busy={searching}
            >
              {results.map((movie, index) => (
                <button
                  id={`${listboxId}-${movie.tmdbId}`}
                  key={movie.tmdbId}
                  className={`movie-result ${index === activeIndex ? "movie-result--active" : ""}`}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={index === activeIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => chooseMovie(movie)}
                >
                  <MoviePoster
                    path={movie.posterPath}
                    title={movie.title}
                    className="movie-result__poster"
                    sizes="48px"
                  />
                  <span className="movie-result__body">
                    <strong>{movie.title}</strong>
                    <small>
                      {movie.releaseDate?.slice(0, 4) || "Release date unknown"}
                      {movie.originalTitle !== movie.title ? ` · ${movie.originalTitle}` : ""}
                    </small>
                    <span>{movie.overview || "No synopsis available yet."}</span>
                  </span>
                  <ChevronDown className="movie-result__arrow" size={18} />
                </button>
              ))}
            </div>
            {searchError ? (
              <div className="search-message search-message--error" role="alert">
                {searchError}
              </div>
            ) : searching && !results.length ? (
              <div className="search-message" role="status">
                Looking through the archive…
              </div>
            ) : !searching ? (
              results.length === 0 ? (
                <div className="search-message" role="status">
                  No films found. Try another title.
                </div>
              ) : null
            ) : null}
          </div>
        )}

        {selected && (
          <div className="memory-form">
            <div className="selected-film">
              <MoviePoster
                path={selected.posterPath}
                title={selected.title}
                className="selected-film__poster"
                sizes="112px"
                preload
              />
              <div className="selected-film__body">
                <span className="selected-film__label">
                  <Check size={14} /> Selected film
                </span>
                <h2>{selected.title}</h2>
                <p>
                  {selected.releaseDate?.slice(0, 4) || "Year unknown"}
                  {selected.originalTitle !== selected.title
                    ? ` · ${selected.originalTitle}`
                    : ""}
                </p>
                <p className="selected-film__overview">
                  {selected.overview || "No synopsis available."}
                </p>
                <button className="text-button" type="button" onClick={() => resetComposer()}>
                  Choose another film
                </button>
              </div>
            </div>

            <div className="form-fields">
              <fieldset className="reaction-picker">
                <legend>How did it leave you?</legend>
                <div className="reaction-picker__options">
                  {reactionOptions.map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      className={`reaction-option reaction-option--${value} ${
                        reaction === value ? "reaction-option--selected" : ""
                      }`}
                      type="button"
                      aria-pressed={reaction === value}
                      onClick={() => setReaction(value)}
                    >
                      <Icon size={18} strokeWidth={1.8} />
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="field field--memory">
                <span>What stayed with you?</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="A scene, a feeling, the conversation after…"
                  rows={4}
                  maxLength={5000}
                />
                <small>{notes.length}/5000</small>
              </label>

              <div className="date-row">
                <label className="field field--date">
                  <span>
                    <CalendarDays size={15} /> Watched on
                  </span>
                  <input
                    type="date"
                    value={watchedOn}
                    max={localDate()}
                    onChange={(event) => setWatchedOn(event.target.value)}
                    required
                  />
                </label>
                <div className="date-shortcuts" aria-label="Date shortcuts">
                  <button type="button" onClick={() => setWatchedOn(localDate())}>
                    Today
                  </button>
                  <button type="button" onClick={() => setWatchedOn(localDate(-1))}>
                    Yesterday
                  </button>
                </div>
              </div>

              <details className="context-panel">
                <summary>
                  <span>
                    <Sparkles size={16} /> Add context
                  </span>
                  <small>people, place, mood</small>
                  <ChevronDown size={17} />
                </summary>
                <div className="context-grid">
                  <label className="field">
                    <span>Setting</span>
                    <select
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
                    <span>
                      <MapPin size={14} /> Place
                    </span>
                    <input
                      value={locationLabel}
                      onChange={(event) => setLocationLabel(event.target.value)}
                      placeholder="Montreal, living room…"
                      maxLength={160}
                    />
                  </label>
                  <label className="field">
                    <span>Venue</span>
                    <input
                      value={venueName}
                      onChange={(event) => setVenueName(event.target.value)}
                      placeholder="Cinema du Parc…"
                      maxLength={160}
                    />
                  </label>
                  <label className="field">
                    <span>Platform</span>
                    <input
                      value={platform}
                      onChange={(event) => setPlatform(event.target.value)}
                      placeholder="MUBI, Blu-ray…"
                      maxLength={100}
                    />
                  </label>
                  <label className="field">
                    <span>
                      <Users size={14} /> Watched with
                    </span>
                    <input
                      value={companions}
                      onChange={(event) => setCompanions(event.target.value)}
                      placeholder="Names, separated by commas"
                      maxLength={500}
                    />
                  </label>
                  <label className="field">
                    <span>Mood</span>
                    <input
                      value={mood}
                      onChange={(event) => setMood(event.target.value)}
                      placeholder="Restless, hopeful…"
                      maxLength={100}
                    />
                  </label>
                  <label className="field context-grid__wide">
                    <span>Tags</span>
                    <input
                      value={tags}
                      onChange={(event) => setTags(event.target.value)}
                      placeholder="late night, comfort film, summer — separated by commas"
                      maxLength={500}
                    />
                  </label>
                  <label className="check-field context-grid__wide">
                    <input
                      type="checkbox"
                      checked={isRewatch}
                      onChange={(event) => setIsRewatch(event.target.checked)}
                    />
                    <span className="check-field__box">
                      <RotateCcw size={15} />
                    </span>
                    <span>
                      <strong>This was a rewatch</strong>
                      <small>Each viewing becomes its own memory.</small>
                    </span>
                  </label>
                </div>
              </details>

              {saveError && (
                <p className="form-error" role="alert">
                  {saveError}
                </p>
              )}

              <button
                className="button button--primary save-memory"
                type="button"
                disabled={!reaction || !watchedOn || saving}
                onClick={saveMemory}
              >
                {saving ? (
                  <>
                    <LoaderCircle className="spin" size={18} /> Keeping it…
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Keep this memory
                  </>
                )}
              </button>
              {!reaction && <p className="form-nudge">Choose a reaction to continue.</p>}
            </div>
          </div>
        )}
      </div>

      {savedTitle && !selected && (
        <div className="saved-toast" role="status">
          <Check size={16} /> {savedTitle} is now part of your afterimage.
        </div>
      )}
    </section>
  );
}
