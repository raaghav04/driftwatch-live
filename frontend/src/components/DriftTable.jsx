export default function DriftTable({ rows = [] }) {
  return (
    <section className="panel drift-table">
      <h2>Drift Diagnostics</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Domain</th>
            <th>Z-score</th>
            <th>PSI-like</th>
            <th>ADWIN</th>
            <th>Trend</th>
            <th>Severity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.metric}>
              <td>{r.metric}</td>
              <td>{r.domain}</td>
              <td>{r.z_score.toFixed(3)}</td>
              <td>{r.psi_like.toFixed(3)}</td>
              <td>{r.adwin_score.toFixed(3)}</td>
              <td>{r.trend}</td>
              <td>{r.severity}</td>
              <td className={r.is_drift ? "critical" : "stable"}>{r.is_drift ? "Drift" : "Stable"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
