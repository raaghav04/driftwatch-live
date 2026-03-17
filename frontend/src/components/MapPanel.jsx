import { memo } from "react";

function MapPanel({ lat, lon, points = [], driftScore, alertLevel, loading, onMove }) {
  const nudge = () => {
    const nextLat = Math.max(-89.9, Math.min(89.9, lat + (Math.random() - 0.5) * 0.6));
    const nextLon = Math.max(-179.9, Math.min(179.9, lon + (Math.random() - 0.5) * 0.6));
    onMove(nextLat, nextLon);
  };

  return (
    <section className="map-panel-wrap">
      <section className="map-panel synthetic">
        <div className="wave-layer wave-a" />
        <div className="wave-layer wave-b" />
        <div className="wave-layer wave-c" />
        <div className="scan-cone" />
        <div className="scan-line" />
        <div className="pulse-ring ring-1" />
        <div className="pulse-ring ring-2" />
        <div className="pulse-ring ring-3" />
        <div className="trail t1" />
        <div className="trail t2" />
        <div className="trail t3" />
        <div className="flow flow-1" />
        <div className="flow flow-2" />
        <div className="flow flow-3" />
        <div className="flow flow-4" />
        <div className="particle p1" />
        <div className="particle p2" />
        <div className="particle p3" />
        <div className="particle p4" />
        <div className="particle p5" />
        <div className="orbit orbit-a" />
        <div className="orbit orbit-b" />
        <div className="grid-overlay" />
        <div className="target-dot" />
        <div className="hud-core">
          <div className="hud-label">LIVE DRIFT CORE</div>
          <div className="hud-score">{driftScore === null ? "--" : driftScore.toFixed(4)}</div>
          <div className="hud-sub">{loading ? "SYNCING..." : `ALERT ${String(alertLevel).toUpperCase()}`}</div>
        </div>
        <div className="domain-tags">
          <span>SPACE</span>
          <span>CHEM</span>
          <span>BIO</span>
        </div>
        <div className="ticker">
          <div className="ticker-track">
            {(points.length ? points : [{ metric: "waiting_for_live_data", value: 0, unit: "" }]).map((p) => (
              <span key={`${p.metric}-${p.value}`}>
                {p.metric}: {Number(p.value).toFixed(3)} {p.unit}
              </span>
            ))}
            {(points.length ? points : [{ metric: "waiting_for_live_data", value: 0, unit: "" }]).map((p) => (
              <span key={`${p.metric}-${p.value}-dup`}>
                {p.metric}: {Number(p.value).toFixed(3)} {p.unit}
              </span>
            ))}
          </div>
        </div>
      </section>
      <div className="map-overlay">
        <strong>Live Position:</strong> {lat.toFixed(4)}, {lon.toFixed(4)}
        <button className="mini-btn" onClick={nudge}>Nudge Location</button>
      </div>
    </section>
  );
}

export default memo(MapPanel);
