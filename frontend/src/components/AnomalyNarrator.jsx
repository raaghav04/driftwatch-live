import { useEffect, useMemo, useState } from "react";

export default function AnomalyNarrator({ report }) {
  const sorted = useMemo(() => {
    const rows = report?.by_metric ?? [];
    return [...rows].sort((a, b) => Math.abs(b.z_score) - Math.abs(a.z_score));
  }, [report]);

  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!sorted.length) return undefined;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % sorted.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [sorted]);

  const focus = sorted[index];
  const msg = focus
    ? focus.is_drift
      ? `${focus.metric} is deviating from baseline; monitor corrective cascade impact.`
      : `${focus.metric} remains in expected envelope with low divergence pressure.`
    : "Narrative engine waiting for diagnostics...";

  return (
    <section className="panel anomaly-narrator">
      <div className="narrator-head">
        <h2>Anomaly Narrator</h2>
        <span>{focus ? `Rank #${index + 1}` : "..."}</span>
      </div>
      <div className="narrator-chip">{focus?.metric ?? "no_signal"}</div>
      <p>{msg}</p>
      <div className="narrator-bars">
        {(sorted.slice(0, 6)).map((r) => {
          const width = Math.min(100, Math.abs(r.z_score) * 16);
          return (
            <div key={r.metric} className="nbar">
              <span>{r.metric}</span>
              <div className="nbar-track">
                <div className={`nbar-fill ${r.is_drift ? "drift" : "ok"}`} style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

