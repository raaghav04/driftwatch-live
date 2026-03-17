function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export default function FusionMeter({ report, points = [] }) {
  const drift = report?.drift_score ?? 0;
  const signalCoverage = clamp(points.length / 12, 0, 1);
  const coherence = clamp((1 - drift) * 0.72 + signalCoverage * 0.28, 0, 1);
  const pct = Math.round(coherence * 100);
  const angle = -110 + coherence * 220;

  return (
    <section className="panel fusion-meter">
      <h2>Fusion Coherence</h2>
      <div className="meter-wrap">
        <div className="meter-arc" />
        <div className="meter-needle" style={{ transform: `rotate(${angle}deg)` }} />
        <div className="meter-core">
          <strong>{pct}%</strong>
          <span>System Integrity</span>
        </div>
      </div>
      <p>
        Composite confidence index from drift stability and live domain signal coverage.
      </p>
    </section>
  );
}

