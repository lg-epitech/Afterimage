"use client";

import { ChevronDown, Heart, ThumbsDown, ThumbsUp } from "lucide-react";
import { useId, useState } from "react";
import { clsx } from "clsx";
import type { MemoryEntry, Reaction } from "@/lib/types";
import { MoviePoster } from "@/components/movie-poster";

export const reactionMeta = {
  didnt_like: { label: "Didn't like", Icon: ThumbsDown },
  liked: { label: "Liked", Icon: ThumbsUp },
  loved: { label: "Loved", Icon: Heart },
} satisfies Record<Reaction, { label: string; Icon: typeof Heart }>;

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
});

const fullDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timestampFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function parseWatchedOn(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function readableDate(date: string, withYear = true) {
  const parsed = parseWatchedOn(date);
  if (!parsed) return date;
  return (withYear ? fullDateFormatter : dayFormatter).format(parsed);
}

function readableTimestamp(timestamp: string) {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return timestamp;
  return timestampFormatter.format(parsed);
}

export function joinNames(names: string[]) {
  if (names.length <= 1) return names.join("");
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

const settingLabels: Record<string, string> = {
  home: "At home",
  cinema: "At the cinema",
  festival: "At a festival",
  travel: "While travelling",
  other: "Somewhere else",
};

export function settingLabel(value: string | null) {
  if (!value) return null;
  return settingLabels[value] ?? value;
}

/**
 * Turns the stored context fields into one readable sentence, for example
 * "Watched 2 September at Cinéma du Parc with Nadia".
 */
export function describeViewing(entry: MemoryEntry, options?: { withYear?: boolean }) {
  const parts: string[] = [];
  parts.push(entry.isRewatch ? "Rewatched" : "Watched");
  parts.push(readableDate(entry.watchedOn, options?.withYear ?? false));

  const place = entry.locationLabel?.trim() || null;
  const venue = entry.venueName?.trim() || null;

  switch (entry.watchContext) {
    case "home":
      parts.push(place ? `at home in ${place}` : "at home");
      break;
    case "cinema":
      parts.push(venue ? `at ${venue}` : "at the cinema");
      if (place) parts.push(`in ${place}`);
      break;
    case "festival":
      parts.push(venue ? `at ${venue}` : "at a festival");
      if (place) parts.push(`in ${place}`);
      break;
    case "travel":
      parts.push(place ? `in ${place}` : "while travelling");
      if (venue) parts.push(`at ${venue}`);
      break;
    default:
      if (venue) parts.push(`at ${venue}`);
      if (place) parts.push(`in ${place}`);
  }

  if (entry.companions.length) parts.push(`with ${joinNames(entry.companions)}`);
  if (entry.platform) parts.push(`on ${entry.platform}`);

  return parts.join(" ");
}

export function EntryRow({
  entry,
  onDelete,
  readOnly = false,
}: {
  entry: MemoryEntry;
  onDelete?: (id: string) => Promise<void>;
  readOnly?: boolean;
}) {
  const { label, Icon } = reactionMeta[entry.reaction];
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const year = entry.movie.releaseDate?.slice(0, 4);
  const director = entry.movie.directors[0];

  async function remove() {
    if (!onDelete) return;
    if (!window.confirm(`Remove ${entry.movie.title} from your journal?`)) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(entry.id);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "This entry could not be removed.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className={clsx("entry", open && "entry--open")}>
      <MoviePoster
        path={entry.movie.posterPath}
        title={entry.movie.title}
        className="entry__poster"
        size="w185"
        sizes="60px"
      />

      <div className="entry__main">
        <div className="entry__head">
          <h3 className="entry__title">{entry.movie.title}</h3>
          <span className="entry__film">
            {year ?? "Year unknown"}
            {director ? `, ${director}` : ""}
          </span>
        </div>
        <p className={clsx("entry__note", !entry.notes && "entry__note--empty")}>
          {entry.notes || "No note."}
        </p>
        <p className="entry__viewing">{describeViewing(entry)}</p>
      </div>

      <div className="entry__side">
        <span className={`reaction reaction--${entry.reaction}`}>
          <Icon size={13} strokeWidth={2} aria-hidden="true" />
          {label}
        </span>
        {!readOnly && (
          <button
            className="entry__toggle"
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? `Hide details for ${entry.movie.title}` : `Show details for ${entry.movie.title}`}
            onClick={() => setOpen((value) => !value)}
          >
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {!readOnly && open && (
        <div className="entry__details" id={panelId}>
          <p className={clsx("entry__full-note", !entry.notes && "entry__note--empty")}>
            {entry.notes || "No note."}
          </p>

          <dl className="facts">
            <div>
              <dt>Watched on</dt>
              <dd>{readableDate(entry.watchedOn)}</dd>
            </div>
            <div>
              <dt>Viewing</dt>
              <dd>{entry.isRewatch ? "Rewatch" : "First time"}</dd>
            </div>
            {entry.watchContext && (
              <div>
                <dt>Setting</dt>
                <dd>{settingLabel(entry.watchContext)}</dd>
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
                <dt>With</dt>
                <dd>{joinNames(entry.companions)}</dd>
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
            {entry.movie.genres.length > 0 && (
              <div>
                <dt>Genre</dt>
                <dd>{entry.movie.genres.slice(0, 3).join(", ")}</dd>
              </div>
            )}
            {entry.movie.runtimeMinutes ? (
              <div>
                <dt>Runtime</dt>
                <dd>{entry.movie.runtimeMinutes} min</dd>
              </div>
            ) : null}
            <div>
              <dt>Added</dt>
              <dd>{readableTimestamp(entry.createdAt)}</dd>
            </div>
          </dl>

          <div className="entry__actions">
            <button
              className="link-button link-button--danger"
              type="button"
              onClick={remove}
              disabled={deleting}
            >
              {deleting ? "Removing" : "Remove from journal"}
            </button>
            {deleteError && (
              <span className="form-error" role="alert">
                {deleteError}
              </span>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
