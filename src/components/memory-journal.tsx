"use client";

import {
  CalendarDays,
  ChevronDown,
  Film,
  Heart,
  MapPin,
  RotateCcw,
  Search,
  Tag,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { EntriesResponse, MemoryEntry, Reaction } from "@/lib/types";
import { MoviePoster } from "@/components/movie-poster";

const reactionMeta = {
  didnt_like: { label: "Didn't like", Icon: ThumbsDown },
  liked: { label: "Liked", Icon: ThumbsUp },
  loved: { label: "Loved", Icon: Heart },
} satisfies Record<Reaction, { label: string; Icon: typeof Heart }>;

const JOURNAL_PAGE_SIZE = 24;

function readableDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function readableTimestamp(timestamp: string) {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return timestamp;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function contextLabel(value: string | null) {
  if (!value) return null;
  const labels: Record<string, string> = {
    home: "At home",
    cinema: "At the cinema",
    festival: "At a festival",
    travel: "While travelling",
    other: "Somewhere else",
  };
  return labels[value] ?? value;
}

function MemoryCard({
  entry,
  onDelete,
}: {
  entry: MemoryEntry;
  onDelete: (id: string) => Promise<void>;
}) {
  const { label, Icon } = reactionMeta[entry.reaction];
  const deleteErrorId = useId();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const context = [
    contextLabel(entry.watchContext),
    entry.locationLabel,
    entry.venueName,
    entry.platform,
  ].filter(Boolean);

  async function remove() {
    if (!window.confirm(`Remove your memory of ${entry.movie.title}?`)) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(entry.id);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "This memory could not be removed.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="memory-card">
      <MoviePoster
        path={entry.movie.posterPath}
        title={entry.movie.title}
        className="memory-card__poster"
        sizes="(max-width: 520px) 86px, (max-width: 920px) 126px, 142px"
      />
      <div className="memory-card__content">
        <div className="memory-card__topline">
          <span className={`reaction-badge reaction-badge--${entry.reaction}`}>
            <Icon size={14} strokeWidth={1.9} /> {label}
          </span>
          {entry.isRewatch && (
            <span className="rewatch-badge">
              <RotateCcw size={12} /> Rewatch
            </span>
          )}
          <button
            className="memory-card__delete"
            type="button"
            onClick={remove}
            disabled={deleting}
            aria-label={
              deleting
                ? `Deleting memory of ${entry.movie.title}`
                : `Delete memory of ${entry.movie.title}`
            }
            aria-describedby={deleteError ? deleteErrorId : undefined}
          >
            <Trash2 size={15} />
          </button>
        </div>

        <div>
          <h3>{entry.movie.title}</h3>
          <p className="memory-card__film-meta">
            {entry.movie.releaseDate?.slice(0, 4) || "Year unknown"}
            {entry.movie.directors[0] ? ` · ${entry.movie.directors[0]}` : ""}
          </p>
        </div>

        <p className={`memory-card__note ${entry.notes ? "" : "memory-card__note--empty"}`}>
          {entry.notes || "No note — just the trace it left behind."}
        </p>

        <div className="memory-card__details">
          <span>
            <CalendarDays size={13} /> {readableDate(entry.watchedOn)}
          </span>
          {context.length > 0 && (
            <span>
              <MapPin size={13} /> {context.join(" · ")}
            </span>
          )}
          {entry.companions.length > 0 && (
            <span>
              <Users size={13} /> {entry.companions.join(", ")}
            </span>
          )}
        </div>

        {entry.tags.length > 0 && (
          <div className="memory-card__tags">
            <Tag size={12} aria-hidden="true" />
            {entry.tags.slice(0, 4).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        )}
        {deleteError && (
          <p className="memory-card__error" id={deleteErrorId} role="alert">
            <span>{deleteError}</span>
            <button type="button" onClick={remove} disabled={deleting}>
              Try again
            </button>
          </p>
        )}
      </div>

      <details className="memory-card__disclosure">
        <summary aria-label={`Read full memory for ${entry.movie.title}`}>
          <span>Read full memory</span>
          <ChevronDown size={15} aria-hidden="true" />
        </summary>
        <div className="memory-card__full">
          <div className="memory-card__full-note">
            <h4>What stayed with you</h4>
            <p className={entry.notes ? "" : "memory-card__note--empty"}>
              {entry.notes || "No note — just the trace it left behind."}
            </p>
          </div>

          <dl className="memory-card__context">
            <div>
              <dt>Watched on</dt>
              <dd>{readableDate(entry.watchedOn)}</dd>
            </div>
            <div>
              <dt>Viewing</dt>
              <dd>{entry.isRewatch ? "Rewatch" : "First watch"}</dd>
            </div>
            {entry.watchContext && (
              <div>
                <dt>Setting</dt>
                <dd>{contextLabel(entry.watchContext)}</dd>
              </div>
            )}
            {entry.locationLabel && (
              <div>
                <dt>Place</dt>
                <dd>{entry.locationLabel}</dd>
              </div>
            )}
            {entry.venueName && (
              <div>
                <dt>Venue</dt>
                <dd>{entry.venueName}</dd>
              </div>
            )}
            {entry.platform && (
              <div>
                <dt>Platform</dt>
                <dd>{entry.platform}</dd>
              </div>
            )}
            {entry.companions.length > 0 && (
              <div>
                <dt>Watched with</dt>
                <dd>{entry.companions.join(", ")}</dd>
              </div>
            )}
            {entry.mood && (
              <div>
                <dt>Mood</dt>
                <dd>{entry.mood}</dd>
              </div>
            )}
            {entry.tags.length > 0 && (
              <div>
                <dt>Tags</dt>
                <dd>{entry.tags.join(", ")}</dd>
              </div>
            )}
            <div>
              <dt>Timezone</dt>
              <dd>{entry.watchedTimezone}</dd>
            </div>
            <div>
              <dt>Added</dt>
              <dd>{readableTimestamp(entry.createdAt)}</dd>
            </div>
          </dl>
        </div>
      </details>
    </article>
  );
}

export function MemoryJournal({
  entries,
  loading,
  error,
  total,
  hasMore,
  loadingMore,
  onLoadMore,
  onDelete,
}: {
  entries: MemoryEntry[];
  loading: boolean;
  error: string | null;
  total?: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const filterVersion = useRef(0);
  const [query, setQuery] = useState("");
  const [reaction, setReaction] = useState<Reaction | "all">("all");
  const [remoteEntries, setRemoteEntries] = useState<MemoryEntry[] | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteLoadingMore, setRemoteLoadingMore] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [remoteHasMore, setRemoteHasMore] = useState(false);
  const [remoteNextOffset, setRemoteNextOffset] = useState<number | null>(null);
  const filtersActive = query.trim().length > 0 || reaction !== "all";
  const visibleEntries = filtersActive ? (remoteEntries ?? []) : entries;
  const visibleLoading = loading || (filtersActive && remoteLoading);
  const visibleHasMore = filtersActive ? remoteHasMore : hasMore;
  const visibleLoadingMore = filtersActive ? remoteLoadingMore : loadingMore;

  useEffect(() => {
    if (!filtersActive) return;

    const version = filterVersion.current;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const params = new URLSearchParams({ limit: String(JOURNAL_PAGE_SIZE) });
      if (query.trim()) params.set("q", query.trim());
      if (reaction !== "all") params.set("reaction", reaction);

      try {
        const response = await fetch(`/api/entries?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = (await response.json()) as Partial<EntriesResponse> & {
          error?: string;
        };
        if (!response.ok) throw new Error(body.error || "Search is unavailable.");
        if (filterVersion.current !== version) return;
        setRemoteEntries(body.entries ?? []);
        setRemoteHasMore(body.hasMore ?? false);
        setRemoteNextOffset(body.nextOffset ?? null);
        setRemoteError(null);
      } catch (searchError) {
        if (searchError instanceof DOMException && searchError.name === "AbortError") return;
        setRemoteEntries([]);
        setRemoteHasMore(false);
        setRemoteNextOffset(null);
        setRemoteError(
          searchError instanceof Error ? searchError.message : "Search is unavailable.",
        );
      } finally {
        if (!controller.signal.aborted) setRemoteLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [filtersActive, query, reaction]);

  function changeQuery(value: string) {
    filterVersion.current += 1;
    setQuery(value);
    setRemoteEntries(null);
    setRemoteError(null);
    setRemoteHasMore(false);
    setRemoteNextOffset(null);
    setRemoteLoadingMore(false);
    setRemoteLoading(value.trim().length > 0 || reaction !== "all");
  }

  function changeReaction(value: Reaction | "all") {
    filterVersion.current += 1;
    setReaction(value);
    setRemoteEntries(null);
    setRemoteError(null);
    setRemoteHasMore(false);
    setRemoteNextOffset(null);
    setRemoteLoadingMore(false);
    setRemoteLoading(query.trim().length > 0 || value !== "all");
  }

  function clearFilters() {
    filterVersion.current += 1;
    setQuery("");
    setReaction("all");
    setRemoteEntries(null);
    setRemoteError(null);
    setRemoteHasMore(false);
    setRemoteNextOffset(null);
    setRemoteLoadingMore(false);
    setRemoteLoading(false);
  }

  async function deleteVisibleEntry(id: string) {
    await onDelete(id);
    setRemoteEntries((current) => current?.filter((entry) => entry.id !== id) ?? null);
    setRemoteNextOffset((current) =>
      current === null ? null : Math.max(0, current - 1),
    );
  }

  async function loadMoreVisibleEntries() {
    if (visibleLoadingMore || !visibleHasMore) return;

    if (!filtersActive) {
      try {
        await onLoadMore();
      } catch {
        // The parent journal request owns and displays this error.
      }
      return;
    }

    if (remoteNextOffset === null) return;
    const version = filterVersion.current;
    const params = new URLSearchParams({
      limit: String(JOURNAL_PAGE_SIZE),
      offset: String(remoteNextOffset),
    });
    if (query.trim()) params.set("q", query.trim());
    if (reaction !== "all") params.set("reaction", reaction);

    setRemoteLoadingMore(true);
    setRemoteError(null);
    try {
      const response = await fetch(`/api/entries?${params}`, { cache: "no-store" });
      const body = (await response.json()) as Partial<EntriesResponse> & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error || "More memories could not be loaded.");
      }
      if (filterVersion.current !== version) return;

      setRemoteEntries((current) => {
        const present = current ?? [];
        const seen = new Set(present.map((entry) => entry.id));
        return [
          ...present,
          ...(body.entries ?? []).filter((entry) => !seen.has(entry.id)),
        ];
      });
      setRemoteHasMore(body.hasMore ?? false);
      setRemoteNextOffset(body.nextOffset ?? null);
    } catch (loadError) {
      if (filterVersion.current !== version) return;
      setRemoteError(
        loadError instanceof Error
          ? loadError.message
          : "More memories could not be loaded.",
      );
    } finally {
      if (filterVersion.current === version) setRemoteLoadingMore(false);
    }
  }

  return (
    <section
      className="journal"
      id="journal"
      aria-labelledby="journal-title"
      aria-busy={visibleLoading}
    >
      <div className="section-heading journal__heading">
        <div>
          <span className="section-kicker">Your journal</span>
          <h2 id="journal-title">Your afterimages</h2>
        </div>
        <p>
          {(total ?? entries.length)
            ? `${total ?? entries.length} memories, still flickering`
            : "A home for what lingers"}
        </p>
      </div>

      <div className="journal-tools">
        <label className="journal-search">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            placeholder="Search titles, notes, people, places, tags…"
            aria-label="Search your memories"
          />
          {query && (
            <button type="button" onClick={() => changeQuery("")} aria-label="Clear memory search">
              <X size={15} />
            </button>
          )}
        </label>
        <div className="reaction-filters" role="group" aria-label="Filter by reaction">
          <button
            type="button"
            className={reaction === "all" ? "active" : ""}
            onClick={() => changeReaction("all")}
            aria-pressed={reaction === "all"}
          >
            All
          </button>
          {Object.entries(reactionMeta).map(([value, meta]) => (
            <button
              key={value}
              type="button"
              className={reaction === value ? "active" : ""}
              onClick={() => changeReaction(value as Reaction)}
              aria-label={`Show ${meta.label.toLowerCase()} films`}
              aria-pressed={reaction === value}
            >
              <meta.Icon size={14} />
              <span>{meta.label}</span>
            </button>
          ))}
        </div>
      </div>

      {(error || remoteError) && (
        <div className="inline-alert" role="alert">
          {remoteError || error}
        </div>
      )}

      {visibleLoading ? (
        <div className="memory-grid" role="status" aria-live="polite">
          <span className="sr-only">Loading memories…</span>
          {[0, 1, 2, 3].map((item) => (
            <div className="memory-skeleton" key={item} aria-hidden="true" />
          ))}
        </div>
      ) : visibleEntries.length ? (
        <>
          <div className="memory-grid">
            {visibleEntries.map((entry) => (
              <MemoryCard key={entry.id} entry={entry} onDelete={deleteVisibleEntry} />
            ))}
          </div>
          {visibleHasMore ? (
            <div className="journal-pagination">
              <button
                className="button button--quiet"
                type="button"
                disabled={visibleLoadingMore}
                onClick={() => void loadMoreVisibleEntries()}
              >
                {visibleLoadingMore ? "Developing more…" : "Load more memories"}
              </button>
            </div>
          ) : null}
        </>
      ) : filtersActive ? (
        <div className="empty-state empty-state--search">
          <Search size={25} />
          <h3>No memories match that search.</h3>
          <p>Try a title, a line from your note, a person, place, genre, or tag.</p>
          <button
            className="text-button"
            type="button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-state__icon">
            <Film size={26} />
          </span>
          <h3>Your first memory starts with a title.</h3>
          <p>Search above for something you&apos;ve watched, then keep the part that stayed.</p>
        </div>
      )}
    </section>
  );
}
