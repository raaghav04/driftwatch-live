import { useMemo } from "react";

function levelText(score) {
  if (score >= 0.7) return "critical";
  if (score >= 0.4) return "high";
  if (score >= 0.2) return "moderate";
  return "low";
}

export default function ExecutiveBriefing({ report, correctionReport }) {
  const brief = useMemo(() => {
    const score = report?.drift_score ?? 0;
    const level = levelText(score);
    const drifted = (report?.by_metric ?? []).filter((x) => x.is_drift).length;
    const corrected = correctionReport?.improved_metrics ?? 0;
    return `System drift risk is currently ${level}. ${drifted} channels are outside baseline tolerance. `
      + `${corrected > 0 ? `Correction engine improved ${corrected} channels.` : "No correction run in this cycle."}`;
  }, [report, correctionReport]);

  return (
    <section className="panel executive-briefing">
      <h2>Executive Briefing</h2>
      <p>{brief}</p>
    </section>
  );
}

