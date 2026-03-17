export default function ControlDock({
  loading,
  correcting,
  autoRefresh,
  onToggleAutoRefresh,
  onRefresh,
  onDetectCorrect
}) {
  return (
    <section className="panel control-dock">
      <div className="dock-title">Command Dock</div>
      <div className="dock-actions">
        <button className="dock-btn" onClick={onRefresh} disabled={loading}>
          {loading ? "Syncing..." : "Refresh Live Feed"}
        </button>
        <button className="dock-btn ghost" onClick={onToggleAutoRefresh}>
          Auto Refresh: {autoRefresh ? "ON" : "OFF"}
        </button>
        <button className="dock-btn accent" onClick={onDetectCorrect} disabled={correcting}>
          {correcting ? "Correcting..." : "Detect + Correct"}
        </button>
      </div>
    </section>
  );
}

