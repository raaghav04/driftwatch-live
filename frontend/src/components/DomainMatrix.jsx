function avg(items) {
  if (!items.length) return 0;
  return items.reduce((a, b) => a + b, 0) / items.length;
}

export default function DomainMatrix({ report }) {
  const contrib = report?.insight?.domain_contribution ?? [];
  if (contrib.length) {
    return (
      <section className="panel domain-matrix">
        <h2>Domain Matrix</h2>
        <div className="domain-grid">
          {contrib.map((d) => (
            <article key={d.domain} className="domain-card">
              <div className="domain-name">{d.domain.toUpperCase()}</div>
              <div className="domain-score">{(d.avg_abs_z ?? 0).toFixed(3)}</div>
              <div className="domain-meta">
                share {(d.share * 100).toFixed(1)}% | drift {d.drift_count}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  const rows = report?.by_metric ?? [];
  const space = rows.filter((r) => r.metric.includes("solar") || r.metric.includes("geomagnetic") || r.metric.includes("cosmic"));
  const chem = rows.filter((r) => r.metric.includes("ozone") || r.metric.includes("co2") || r.metric.includes("humidity") || r.metric.includes("temperature"));
  const bio = rows.filter((r) => r.metric.includes("plant") || r.metric.includes("animal") || r.metric.includes("circadian") || r.metric.includes("microbial"));

  const data = [
    { key: "Space Physics", score: avg(space.map((x) => Math.abs(x.z_score))), count: space.length },
    { key: "Chem-Env", score: avg(chem.map((x) => Math.abs(x.z_score))), count: chem.length },
    { key: "Bio Signals", score: avg(bio.map((x) => Math.abs(x.z_score))), count: bio.length }
  ];

  return (
    <section className="panel domain-matrix">
      <h2>Domain Matrix</h2>
      <div className="domain-grid">
        {data.map((d) => (
          <article key={d.key} className="domain-card">
            <div className="domain-name">{d.key}</div>
            <div className="domain-score">{d.score.toFixed(3)}</div>
            <div className="domain-meta">{d.count} metrics tracked</div>
          </article>
        ))}
      </div>
    </section>
  );
}
