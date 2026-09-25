"use client";

import type { StatsSummary } from "@/lib/types";

function hoursLabel(totalMinutes: number) {
  const hours = totalMinutes / 60;
  if (hours >= 100) return String(Math.round(hours));
  return String(Math.round(hours * 10) / 10);
}

export function StatsRecap({
  stats,
  loading = false,
}: {
  stats: StatsSummary | null;
  loading?: boolean;
}) {
  const total = stats?.total ?? 0;

  return (
    <section
      className="stats"
      id="stats"
      aria-labelledby="stats-title"
      aria-busy={loading && !stats}
    >
      <div className="section-head">
        <h2 id="stats-title">Stats</h2>
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
    </section>
  );
}
