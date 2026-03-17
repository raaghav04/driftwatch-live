function pathFrom(values, width, height) {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function DriftSparkline({ history = [] }) {
  const values = history.map((h) => h.drift_score);
  const d = pathFrom(values, 560, 120);
  const latest = history[history.length - 1]?.drift_score ?? 0;
  return (
    <section className="panel sparkline-panel">
      <div className="spark-head">
        <h2>Drift Timeline</h2>
        <span>Latest: {latest.toFixed(4)}</span>
      </div>
      <svg viewBox="0 0 560 120" className="sparkline">
        <defs>
          <linearGradient id="lineGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#80ecff" />
            <stop offset="100%" stopColor="#44c6a0" />
          </linearGradient>
        </defs>
        <path d={d} fill="none" stroke="url(#lineGrad)" strokeWidth="3" />
      </svg>
    </section>
  );
}

