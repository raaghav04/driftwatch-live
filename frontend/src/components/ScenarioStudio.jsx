import { useMemo, useState } from "react";

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export default function ScenarioStudio({ report }) {
  const [spaceShock, setSpaceShock] = useState(15);
  const [chemShock, setChemShock] = useState(10);
  const [bioShock, setBioShock] = useState(8);

  const projection = useMemo(() => {
    const rows = report?.by_metric ?? [];
    const base = report?.drift_score ?? 0;
    const spaceAvg =
      rows
        .filter((r) => r.metric.includes("solar") || r.metric.includes("geomagnetic") || r.metric.includes("cosmic"))
        .reduce((a, b) => a + Math.abs(b.z_score), 0) / 3;
    const chemAvg =
      rows
        .filter((r) => r.metric.includes("ozone") || r.metric.includes("co2") || r.metric.includes("humidity") || r.metric.includes("temperature"))
        .reduce((a, b) => a + Math.abs(b.z_score), 0) / 4;
    const bioAvg =
      rows
        .filter((r) => r.metric.includes("plant") || r.metric.includes("animal") || r.metric.includes("circadian") || r.metric.includes("microbial"))
        .reduce((a, b) => a + Math.abs(b.z_score), 0) / 3;

    const shock =
      (spaceShock / 100) * (Number.isFinite(spaceAvg) ? spaceAvg : 0) * 0.04 +
      (chemShock / 100) * (Number.isFinite(chemAvg) ? chemAvg : 0) * 0.035 +
      (bioShock / 100) * (Number.isFinite(bioAvg) ? bioAvg : 0) * 0.03;

    return clamp(base + shock, 0, 1);
  }, [report, spaceShock, chemShock, bioShock]);

  const projected = (projection * 100).toFixed(1);

  return (
    <section className="panel scenario-studio">
      <div className="scenario-head">
        <h2>Scenario Studio</h2>
        <span>Projected Drift: {projected}%</span>
      </div>
      <label>
        <span>Space Shock</span>
        <input type="range" min="0" max="100" value={spaceShock} onChange={(e) => setSpaceShock(Number(e.target.value))} />
      </label>
      <label>
        <span>Chem Shock</span>
        <input type="range" min="0" max="100" value={chemShock} onChange={(e) => setChemShock(Number(e.target.value))} />
      </label>
      <label>
        <span>Bio Shock</span>
        <input type="range" min="0" max="100" value={bioShock} onChange={(e) => setBioShock(Number(e.target.value))} />
      </label>
      <div className="scenario-note">
        Dynamic what-if engine estimating how extreme domain perturbations could shift global drift trajectory.
      </div>
    </section>
  );
}

