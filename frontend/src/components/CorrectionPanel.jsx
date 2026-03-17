export default function CorrectionPanel({ report, loading, onRun }) {
  return (
    <section className="panel correction-panel">
      <div className="correction-head">
        <h2>Live Drift Correction</h2>
        <button className="action-btn" onClick={onRun} disabled={loading}>
          {loading ? "Detecting..." : "Detect & Correct Drift"}
        </button>
      </div>

      {report ? (
        <>
          <div className="correction-kpis">
            <div><strong>Total Drift:</strong> {report.total_drift_percent.toFixed(2)}%</div>
            <div><strong>Accuracy Before:</strong> {report.average_accuracy_before_percent.toFixed(2)}%</div>
            <div><strong>Accuracy After:</strong> {report.average_accuracy_after_percent.toFixed(2)}%</div>
            <div><strong>Improved Metrics:</strong> {report.improved_metrics}/{report.total_metrics}</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Drift %</th>
                  <th>Before</th>
                  <th>Corrected</th>
                  <th>Acc Before %</th>
                  <th>Acc After %</th>
                  <th>Fixed</th>
                </tr>
              </thead>
              <tbody>
                {report.metrics.map((m) => (
                  <tr key={m.metric}>
                    <td>{m.metric}</td>
                    <td>{m.drift_percent.toFixed(2)}</td>
                    <td>{m.before_value.toFixed(3)} {m.unit}</td>
                    <td>{m.corrected_value.toFixed(3)} {m.unit}</td>
                    <td>{m.accuracy_before_percent.toFixed(2)}</td>
                    <td>{m.accuracy_after_percent.toFixed(2)}</td>
                    <td className={m.corrected ? "critical" : "stable"}>{m.corrected ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="muted-text">Press "Detect & Correct Drift" to run live correction and accuracy comparison.</p>
      )}
    </section>
  );
}

