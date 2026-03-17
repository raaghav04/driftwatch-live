import { useEffect, useMemo, useState } from "react";

function phaseFromScore(v) {
  if (v >= 0.75) return "Critical Surge";
  if (v >= 0.5) return "Escalating";
  if (v >= 0.3) return "Transitional";
  return "Stable Flow";
}

export default function TemporalPlaybackDeck({ history = [], report }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing || history.length < 2) return undefined;
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % history.length);
    }, 1200);
    return () => window.clearInterval(t);
  }, [playing, history.length]);

  useEffect(() => {
    if (!history.length) setIdx(0);
    else if (idx > history.length - 1) setIdx(history.length - 1);
  }, [history, idx]);

  const current = useMemo(() => {
    if (!history.length) return report?.drift_score ?? 0;
    return history[idx]?.drift_score ?? 0;
  }, [history, idx, report]);

  const pct = Math.max(0, Math.min(1, current));
  const phase = phaseFromScore(pct);

  return (
    <section className="panel temporal-deck">
      <div className="temporal-head">
        <h2>Temporal Playback Deck</h2>
        <button type="button" className="dock-btn ghost" onClick={() => setPlaying((x) => !x)}>
          {playing ? "Pause Stream" : "Resume Stream"}
        </button>
      </div>

      <div className="temporal-main">
        <div className="temporal-ring" style={{ "--tp": `${(pct * 100).toFixed(1)}%` }}>
          <strong>{current.toFixed(4)}</strong>
          <span>{phase}</span>
        </div>

        <div className="temporal-track-wrap">
          <input
            type="range"
            min="0"
            max={Math.max(0, history.length - 1)}
            value={Math.min(idx, Math.max(0, history.length - 1))}
            onChange={(e) => setIdx(Number(e.target.value))}
            disabled={!history.length}
          />
          <div className="temporal-meta">
            <span>Frame {history.length ? idx + 1 : 0}/{history.length || 0}</span>
            <span>{history.length && history[idx]?.generated_at ? new Date(history[idx].generated_at).toLocaleTimeString() : "n/a"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

