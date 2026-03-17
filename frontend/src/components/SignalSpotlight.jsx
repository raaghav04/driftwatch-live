import { useEffect, useMemo, useState } from "react";

export default function SignalSpotlight({ report }) {
  const ranked = useMemo(() => {
    const rows = report?.by_metric ?? [];
    return [...rows].sort((a, b) => Math.abs(b.z_score) - Math.abs(a.z_score));
  }, [report]);

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!ranked.length) return undefined;
    const t = setInterval(() => setIdx((x) => (x + 1) % ranked.length), 2500);
    return () => clearInterval(t);
  }, [ranked]);

  const item = ranked[idx];

  return (
    <section className="panel signal-spotlight">
      <h2>Signal Spotlight</h2>
      {item ? (
        <div className="spot-core">
          <div className="spot-metric">{item.metric}</div>
          <div className="spot-stats">
            <span>Z {item.z_score.toFixed(3)}</span>
            <span>PSI {item.psi_like.toFixed(3)}</span>
            <span className={item.is_drift ? "critical" : "stable"}>{item.is_drift ? "ACTIVE DRIFT" : "STABLE"}</span>
          </div>
          <p>
            {item.is_drift
              ? "This channel is currently diverging from baseline behavior."
              : "Signal is inside expected behavior envelope."}
          </p>
        </div>
      ) : (
        <p className="muted-text">Waiting for diagnostics...</p>
      )}
    </section>
  );
}

