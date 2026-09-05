"use client";

import { useMemo } from "react";
import type { StatsSummary } from "@/lib/types";

const monthInitials = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const monthNames = [
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

function hoursLabel(totalMinutes: number) {
  const hours = totalMinutes / 60;
  if (hours >= 100) return String(Math.round(hours));
  return String(Math.round(hours * 10) / 10);
}

export function Rewind({
  stats,
  loading = false,
}: {
  stats: StatsSummary | null;
  loading?: boolean;
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
  const total = stats?.total ?? 0;
  const onThisDay = stats?.onThisDay ?? [];
  const busiest = monthCounts.indexOf(maxCount);

  return (
    <section
      className="rewind"
      id="rewind"
      aria-labelledby="rewind-title"
      aria-busy={loading && !stats}
    >
      <div className="section-head">
        <h2 id="rewind-title">Rewind</h2>
        <span className="section-head__year" aria-label={`Year ${year}`}>
          {year}
        </span>
      </div>

      <dl className="figures">
        <div className="figures__item">
          <dd>{total}</dd>
          <dt>{total === 1 ? "film" : "films"}</dt>
        </div>
        <div className="figures__item">
          <dd>{hoursLabel(stats?.totalMinutes ?? 0)}</dd>
          <dt>hours watching</dt>
        </div>
        <div className="figures__item">
          <dd>{stats?.loved ?? 0}</dd>
          <dt>loved</dt>
        </div>
        <div className="figures__item">
          <dd>{stats?.rewatches ?? 0}</dd>
          <dt>{stats?.rewatches === 1 ? "rewatch" : "rewatches"}</dt>
        </div>
      </dl>

      <p className="rewind__line">
        {loading && !stats
          ? "Adding things up."
          : total === 0
            ? "Nothing here yet. Your first entry starts the count."
            : stats?.topGenre
              ? `${stats.topGenre} came up most often${
                  monthCounts[busiest] > 0 ? `, and ${monthNames[busiest]} was your busiest month` : ""
                }.`
              : monthCounts[busiest] > 0
                ? `${monthNames[busiest]} was your busiest month.`
                : " "}
      </p>

      <div className="rewind__grid">
        <div className="panel chart">
          <h3 className="panel__title">Films by month</h3>
          <div
            className="bars"
            role="img"
            aria-label={`Films watched by month in ${year}: ${monthCounts
              .map((count, index) => `${monthNames[index]} ${count}`)
              .join(", ")}`}
          >
            {monthCounts.map((count, index) => (
              <div
                className="bars__col"
                key={monthNames[index]}
                tabIndex={0}
                aria-label={`${monthNames[index]}: ${count} ${count === 1 ? "film" : "films"}`}
              >
                <span className="bars__tip" aria-hidden="true">
                  {count}
                </span>
                <span className="bars__track">
                  <span
                    className="bars__bar"
                    style={{ height: count ? `${Math.max((count / maxCount) * 100, 6)}%` : "0" }}
                  />
                </span>
                <span className="bars__label" aria-hidden="true">
                  {monthInitials[index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel today">
          <h3 className="panel__title">On this day</h3>
          {onThisDay.length ? (
            <ul className="today__list">
              {onThisDay.map((entry) => (
                <li key={entry.id}>
                  <span>{entry.title}</span>
                  <span className="today__year">{entry.watchedOn.slice(0, 4)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel__text">
              Nothing yet. Films you watched on this date in earlier years will
              show up here.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
