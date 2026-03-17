function topSignals(points = []) {
  return [...points]
    .filter((p) => Number.isFinite(p.value))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 4);
}

export default function PulseDeck({ points = [], report }) {
  const top = topSignals(points);
  const drift = report?.drift_score ?? 0;
  const intensity = Math.min(100, Math.round(drift * 100));

  return (
    <section className="panel pulse-deck">
      <div className="pulse-head">
        <h2>Pulse Deck</h2>
        <span>Intensity {intensity}%</span>
      </div>
      <div className="pulse-grid">
        {top.map((s) => {
          const bar = Math.min(100, Math.abs(s.value) % 100);
          return (
            <article key={s.metric} className="pulse-card">
              <div className="pulse-title">{s.metric}</div>
              <div className="pulse-num">{s.value.toFixed(3)} <small>{s.unit}</small></div>
              <div className="pulse-bar">
                <div className="pulse-fill" style={{ width: `${bar}%` }} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

