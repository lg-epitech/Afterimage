"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import type { EntriesResponse, MemoryEntry, Reaction } from "@/lib/types";
import { EntryRow, parseWatchedOn, reactionMeta } from "@/components/entry-row";

const JOURNAL_PAGE_SIZE = 24;

const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
});

function groupByMonth(entries: MemoryEntry[]) {
  const groups: Array<{ key: string; label: string; entries: MemoryEntry[] }> = [];
  for (const entry of entries) {
    const key = entry.watchedOn.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.entries.push(entry);
      continue;
    }
    const parsed = parseWatchedOn(entry.watchedOn);
    groups.push({
      key,
      label: parsed ? monthFormatter.format(parsed) : key,
      entries: [entry],
    });
  }
  return groups;
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
  const visibleLoading = loading || (filtersActive && remoteLoading);
  const visibleHasMore = filtersActive ? remoteHasMore : hasMore;
  const visibleLoadingMore = filtersActive ? remoteLoadingMore : loadingMore;
  const groups = useMemo(
    () => groupByMonth(filtersActive ? (remoteEntries ?? []) : entries),
    [filtersActive, remoteEntries, entries],
  );
  const count = total ?? entries.length;

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

  function resetRemote(nextLoading: boolean) {
    filterVersion.current += 1;
    setRemoteEntries(null);
    setRemoteError(null);
    setRemoteHasMore(false);
    setRemoteNextOffset(null);
    setRemoteLoadingMore(false);
    setRemoteLoading(nextLoading);
  }

  function changeQuery(value: string) {
    setQuery(value);
    resetRemote(value.trim().length > 0 || reaction !== "all");
  }

  function changeReaction(value: Reaction | "all") {
    setReaction(value);
    resetRemote(query.trim().length > 0 || value !== "all");
  }

  function clearFilters() {
    setQuery("");
    setReaction("all");
    resetRemote(false);
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
        throw new Error(body.error || "More entries could not be loaded.");
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
        loadError instanceof Error ? loadError.message : "More entries could not be loaded.",
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
      <div className="section-head">
        <h2 id="journal-title">Journal</h2>
        {count > 0 && (
          <p className="section-head__aside">
            {count === 1 ? "1 film" : `${count} films`}
          </p>
        )}
      </div>

      <div className="journal__tools">
        <label className="filter-field">
          <Search size={16} strokeWidth={2} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            placeholder="Find a title, note, person, or place"
            aria-label="Find in your journal"
          />
          {query && (
            <button type="button" onClick={() => changeQuery("")} aria-label="Clear">
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </label>
        <div className="segmented" role="group" aria-label="Filter by reaction">
          <button
            type="button"
            className={clsx("segmented__option", reaction === "all" && "segmented__option--on")}
            onClick={() => changeReaction("all")}
            aria-pressed={reaction === "all"}
          >
            All
          </button>
          {Object.entries(reactionMeta).map(([value, meta]) => (
            <button
              key={value}
              type="button"
              className={clsx(
                "segmented__option",
                reaction === value && "segmented__option--on",
              )}
              onClick={() => changeReaction(value as Reaction)}
              aria-pressed={reaction === value}
            >
              <meta.Icon size={14} strokeWidth={2} aria-hidden="true" />
              <span>{meta.label}</span>
            </button>
          ))}
        </div>
      </div>

      {(error || remoteError) && (
        <div className="notice notice--error" role="alert">
          {remoteError || error}
        </div>
      )}

      {visibleLoading ? (
        <div className="entry-list" role="status" aria-live="polite">
          <span className="sr-only">Loading your journal</span>
          {[0, 1, 2].map((item) => (
            <div className="skeleton skeleton--entry" key={item} aria-hidden="true" />
          ))}
        </div>
      ) : groups.length ? (
        <>
          {groups.map((group) => (
            <div className="journal__month" key={group.key}>
              <h3 className="journal__month-label">{group.label}</h3>
              <div className="entry-list">
                {group.entries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} onDelete={deleteVisibleEntry} />
                ))}
              </div>
            </div>
          ))}
          {visibleHasMore ? (
            <div className="journal__more">
              <button
                className="btn btn--ghost"
                type="button"
                disabled={visibleLoadingMore}
                onClick={() => void loadMoreVisibleEntries()}
              >
                {visibleLoadingMore ? "Loading" : "Show older entries"}
              </button>
            </div>
          ) : null}
        </>
      ) : filtersActive ? (
        <div className="empty">
          <h3>No entries match.</h3>
          <p>Try a title, a word from a note, a person, a place, or a tag.</p>
          <button className="link-button" type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="empty">
          <h3>Your journal is empty.</h3>
          <p>Search a film above to write the first entry.</p>
        </div>
      )}
    </section>
  );
}
