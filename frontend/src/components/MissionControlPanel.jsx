import { useMemo, useState } from "react";

const TAB_KEYS = ["space", "chem", "bio", "system"];

function label(k) {
  if (k === "space") return "Space Ops";
  if (k === "chem") return "Chem Ops";
  if (k === "bio") return "Bio Ops";
  return "System";
}

export default function MissionControlPanel({ report }) {
  const [tab, setTab] = useState("system");

  const data = useMemo(() => {
    const rows = report?.by_metric ?? [];
    const byDomain = {
      space: rows.filter((r) => r.domain === "space"),
      chem: rows.filter((r) => r.domain === "chem"),
      bio: rows.filter((r) => r.domain === "bio")
    };
    const sys = rows;
    return { ...byDomain, system: sys };
  }, [report]);

  const active = data[tab] ?? [];
  const drift = active.filter((x) => x.is_drift);
  const avgZ = active.length ? active.reduce((a, b) => a + Math.abs(b.z_score), 0) / active.length : 0;
  const nextAction = drift.length
    ? "Run Detect & Correct + monitor hottest metrics."
    : "Maintain auto refresh and watch forecast trend.";

  return (
    <section className="panel mission-control">
      <div className="mission-head">
        <h2>Mission Control</h2>
        <span>{label(tab)}</span>
      </div>

      <div className="mission-tabs">
        {TAB_KEYS.map((k) => (
          <button key={k} type="button" className={tab === k ? "active" : ""} onClick={() => setTab(k)}>
            {label(k)}
          </button>
        ))}
      </div>

      <div className="mission-grid">
        <article>
          <span>Tracked</span>
          <strong>{active.length}</strong>
        </article>
        <article>
          <span>Drifting</span>
          <strong>{drift.length}</strong>
        </article>
        <article>
          <span>Avg |Z|</span>
          <strong>{avgZ.toFixed(3)}</strong>
        </article>
      </div>

      <div className="mission-action">
        <span>Recommended Action</span>
        <p>{nextAction}</p>
      </div>
    </section>
  );
}

