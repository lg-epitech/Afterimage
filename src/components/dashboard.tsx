"use client";

import { useCallback, useEffect, useState } from "react";
import type { EntriesResponse, MemoryEntry, StatsSummary } from "@/lib/types";
import { MemoryJournal } from "@/components/memory-journal";
import { QuickAdd } from "@/components/quick-add";
import { StatsRecap } from "@/components/stats-recap";

const JOURNAL_PAGE_SIZE = 24;

function sortJournalEntries(entries: MemoryEntry[]) {
  return [...entries].sort(
    (left, right) =>
      right.watchedOn.localeCompare(left.watchedOn) ||
      right.createdAt.localeCompare(left.createdAt) ||
      right.id.localeCompare(left.id),
  );
}

async function fetchStats() {
  const response = await fetch("/api/stats", { cache: "no-store" });
  const body = (await response.json()) as StatsSummary & { error?: string };
  if (!response.ok) throw new Error(body.error || "Stats are unavailable.");
  return body;
}

export function Dashboard() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const body = await fetchStats();
      setStats(body);
      setStatsError(null);
    } catch (loadError) {
      setStatsError(
        loadError instanceof Error ? loadError.message : "Stats are unavailable.",
      );
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadJournal() {
      try {
        const entriesResponse = await fetch(`/api/entries?limit=${JOURNAL_PAGE_SIZE}`, {
          cache: "no-store",
        });
        const entriesBody = (await entriesResponse.json()) as Partial<EntriesResponse> & {
          error?: string;
        };

        if (!entriesResponse.ok) {
          throw new Error(entriesBody.error || "Your journal could not be loaded.");
        }

        if (active) {
          setEntries(entriesBody.entries ?? []);
          setHasMore(entriesBody.hasMore ?? false);
          setNextOffset(entriesBody.nextOffset ?? null);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Your journal could not be loaded.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    async function loadInitialStats() {
      try {
        const body = await fetchStats();
        if (active) {
          setStats(body);
          setStatsError(null);
        }
      } catch (loadError) {
        if (active) {
          setStatsError(
            loadError instanceof Error ? loadError.message : "Stats are unavailable.",
          );
        }
      } finally {
        if (active) setStatsLoading(false);
      }
    }

    void loadJournal();
    void loadInitialStats();
    return () => {
      active = false;
    };
  }, []);

  function handleCreated(entry: MemoryEntry) {
    setEntries((current) => sortJournalEntries([entry, ...current]));
    void loadStats();
  }

  async function loadMoreEntries() {
    if (nextOffset === null || loadingMore) return;
    setLoadingMore(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/entries?limit=${JOURNAL_PAGE_SIZE}&offset=${nextOffset}`,
        { cache: "no-store" },
      );
      const body = (await response.json()) as Partial<EntriesResponse> & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error || "Older entries could not be loaded.");
      }

      setEntries((current) => {
        const seen = new Set(current.map((entry) => entry.id));
        return sortJournalEntries([
          ...current,
          ...(body.entries ?? []).filter((entry) => !seen.has(entry.id)),
        ]);
      });
      setHasMore(body.hasMore ?? false);
      setNextOffset(body.nextOffset ?? null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Older entries could not be loaded.",
      );
      throw loadError;
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      throw new Error(body.error || "That entry could not be removed.");
    }
    const wasInBasePage = entries.some((entry) => entry.id === id);
    setEntries((current) => current.filter((entry) => entry.id !== id));
    if (wasInBasePage) {
      setNextOffset((current) =>
        current === null ? null : Math.max(0, current - 1),
      );
    }
    void loadStats();
  }

  return (
    <div className="dashboard">
      <QuickAdd onCreated={handleCreated} onActiveChange={setComposing} />
      <div className="dashboard__sections" hidden={composing}>
        <MemoryJournal
          entries={entries}
          loading={loading}
          error={error}
          total={stats?.total}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMoreEntries}
          onDelete={handleDelete}
        />
        {statsError ? (
          <div className="notice notice--error notice--row" role="alert">
            <span>{statsError}</span>
            <button type="button" className="link-button" onClick={() => void loadStats()}>
              Try again
            </button>
          </div>
        ) : null}
        <StatsRecap stats={stats} loading={statsLoading} />
      </div>
    </div>
  );
}
