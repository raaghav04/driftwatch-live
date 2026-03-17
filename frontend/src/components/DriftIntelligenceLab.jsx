import { useMemo, useState } from "react";

function pct(v) {
  return `${(Math.max(0, Math.min(1, v)) * 100).toFixed(1)}%`;
}

export default function DriftIntelligenceLab({ report }) {
  const [lens, setLens] = useState(50);

  const model = useMemo(() => {
    const insight = report?.insight;
    if (!insight) {
      return {
        regime: "n/a",
        forecast: 0,
        velocity: 0,
        acceleration: 0,
        entropy: 0,
        adjusted: 0,
        contribution: [],
        hot: []
      };
    }
    const pressure = lens / 100;
    const adjusted = Math.min(
      1,
      insight.forecast_15m_score + pressure * 0.1 * (insight.velocity + insight.acceleration)
    );
    return {
      regime: insight.regime,
      forecast: insight.forecast_15m_score,
      velocity: insight.velocity,
      acceleration: insight.acceleration,
      entropy: insight.entropy,
      adjusted,
      contribution: insight.domain_contribution ?? [],
      hot: insight.hottest_metrics ?? []
    };
  }, [report, lens]);

  return (
    <section className="panel drift-intel-lab">
      <div className="intel-head">
        <h2>Drift Intelligence Lab</h2>
        <span className="intel-regime">{model.regime}</span>
      </div>

      <div className="intel-kpis">
        <article>
          <span>Forecast 15m</span>
          <strong>{pct(model.forecast)}</strong>
        </article>
        <article>
          <span>Velocity</span>
          <strong>{pct(model.velocity)}</strong>
        </article>
        <article>
          <span>Acceleration</span>
          <strong>{pct(model.acceleration)}</strong>
        </article>
        <article>
          <span>Domain Entropy</span>
          <strong>{pct(model.entropy)}</strong>
        </article>
      </div>

      <label className="intel-lens">
        <span>Sensitivity Lens: {lens}%</span>
        <input type="range" min="0" max="100" value={lens} onChange={(e) => setLens(Number(e.target.value))} />
      </label>

      <div className="intel-adjusted">
        <span>Adjusted near-term drift pressure</span>
        <strong>{pct(model.adjusted)}</strong>
      </div>

      <div className="intel-domain">
        {(model.contribution ?? []).map((d) => (
          <article key={d.domain}>
            <div>
              <span>{d.domain.toUpperCase()}</span>
              <small>{(d.share * 100).toFixed(1)}% share</small>
            </div>
            <div className="intel-bar">
              <div style={{ width: `${Math.max(4, d.share * 100)}%` }} />
            </div>
          </article>
        ))}
      </div>

      <div className="intel-hot">
        <span>Hot Metrics</span>
        <div>
          {(model.hot.length ? model.hot : ["n/a"]).map((m) => (
            <code key={m}>{m}</code>
          ))}
        </div>
      </div>
    </section>
  );
}
