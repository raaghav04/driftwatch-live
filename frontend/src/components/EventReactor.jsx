import { useMemo } from "react";

export default function EventReactor({ report, correctionReport, history = [] }) {
  const items = useMemo(() => {
    const out = [];
    if (report?.generated_at) {
      out.push({
        t: new Date(report.generated_at).toLocaleTimeString(),
        type: "SYNC",
        msg: `Live diagnostics updated (${report.by_metric?.length ?? 0} metrics).`
      });
    }
    const drifted = (report?.by_metric ?? []).filter((x) => x.is_drift).slice(0, 3);
    drifted.forEach((d) => {
      out.push({
        t: "now",
        type: "DRIFT",
        msg: `${d.metric} diverged (z=${d.z_score.toFixed(2)}).`
      });
    });
    if (correctionReport) {
      out.push({
        t: new Date(correctionReport.generated_at).toLocaleTimeString(),
        type: "CORRECT",
        msg: `Correction completed: ${correctionReport.improved_metrics}/${correctionReport.total_metrics} improved.`
      });
    }
    const last = history[history.length - 1];
    if (last) {
      out.push({
        t: "trend",
        type: "TREND",
        msg: `Latest drift trend value ${Number(last.drift_score).toFixed(4)}.`
      });
    }
    return out.slice(0, 6);
  }, [report, correctionReport, history]);

  return (
    <section className="panel event-reactor">
      <h2>Event Reactor</h2>
      <div className="reactor-list">
        {items.map((i, idx) => (
          <article key={`${i.type}-${idx}`} className={`reactor-item ${i.type.toLowerCase()}`}>
            <div className="reactor-meta">{i.type} • {i.t}</div>
            <p>{i.msg}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

