"use client";

import { Clock3, Film, Heart, RotateCcw, Sparkles } from "lucide-react";
import { useMemo } from "react";
import type { StatsSummary } from "@/lib/types";

const monthNames = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const monthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function Rewind({
  stats,
}: {
  stats: StatsSummary | null;
}) {
  const year = stats?.year ?? new Date().getFullYear();
  const monthCounts = useMemo(() => {
    const counts = new Array<number>(12).fill(0);
    for (const item of stats?.monthly ?? []) {
      const [entryYear, entryMonth] = item.month.split("-").map(Number);
      if (entryYear === year && entryMonth >= 1 && entryMonth <= 12) {
        counts[entryMonth - 1] = item.count;
      }
    }
    return counts;
  }, [stats, year]);
  const maxCount = Math.max(...monthCounts, 1);
  const lovedPercent = stats?.total ? Math.round((stats.loved / stats.total) * 100) : 0;
  const hours = stats ? Math.round((stats.totalMinutes / 60) * 10) / 10 : 0;
  const onThisDay = stats?.onThisDay ?? [];

  return (
    <section className="rewind" id="rewind" aria-labelledby="rewind-title">
      <div className="section-heading rewind__heading">
        <div>
          <span className="section-kicker">Rewind</span>
          <h2 id="rewind-title">The shape of your watching</h2>
        </div>
        <span className="rewind__year">{year}</span>
      </div>

      <div className="stat-grid">
        <article className="stat-card stat-card--feature">
          <span className="stat-card__icon">
            <Film size={19} />
          </span>
          <strong>{stats?.total ?? 0}</strong>
          <span>films remembered</span>
          <small>{stats?.topGenre ? `${stats.topGenre} found you most often` : "Your story is just beginning"}</small>
        </article>
        <article className="stat-card">
          <span className="stat-card__icon">
            <Clock3 size={18} />
          </span>
          <strong>{hours}</strong>
          <span>hours in other worlds</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__icon stat-card__icon--heart">
            <Heart size={18} />
          </span>
          <strong>{stats?.loved ?? 0}</strong>
          <span>films you loved</span>
          <small>{lovedPercent}% of your journal</small>
        </article>
        <article className="stat-card">
          <span className="stat-card__icon">
            <RotateCcw size={18} />
          </span>
          <strong>{stats?.rewatches ?? 0}</strong>
          <span>return visits</span>
        </article>
      </div>

      <div className="rewind-panels">
        <article className="activity-panel">
          <div className="activity-panel__heading">
            <div>
              <h3>{year}, frame by frame</h3>
              <p>Each bar is a month in your film year.</p>
            </div>
            <Sparkles size={18} />
          </div>
          <div
            className="month-chart"
            aria-label={`Films watched by month in ${year}: ${monthCounts
              .map((count, index) => `${monthLabels[index]} ${count}`)
              .join(", ")}`}
          >
            {monthCounts.map((count, index) => (
              <div className="month-chart__column" key={`${monthNames[index]}-${index}`}>
                <span className="month-chart__count">{count || ""}</span>
                <span className="month-chart__track">
                  <span
                    className="month-chart__bar"
                    style={{ height: count ? `${Math.max((count / maxCount) * 100, 12)}%` : "3px" }}
                  />
                </span>
                <span className="month-chart__label">{monthNames[index]}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="on-this-day">
          <span className="on-this-day__eyebrow">On this day</span>
          {onThisDay.length ? (
            <>
              <h3>A few old frames are flickering.</h3>
              <ul>
                {onThisDay.map((entry) => (
                  <li key={entry.id}>
                    <strong>{entry.title}</strong>
                    <span>{entry.watchedOn.slice(0, 4)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h3>Nothing from today — yet.</h3>
              <p>As your journal grows, films from this date will return here.</p>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
