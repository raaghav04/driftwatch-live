function buildNodes(points = []) {
  const use = points.slice(0, 8);
  return use.map((p, i) => {
    const x = 8 + ((i % 4) * 28);
    const y = 18 + (Math.floor(i / 4) * 42) + ((Math.abs(p.value) % 10) / 10) * 12;
    return { ...p, x, y };
  });
}

export default function ConstellationBoard({ points = [] }) {
  const nodes = buildNodes(points);
  const path = nodes.map((n) => `${n.x},${n.y}`).join(" ");
  return (
    <section className="panel constellation-board">
      <div className="constellation-head">
        <h2>Constellation Board</h2>
        <span>{nodes.length} active nodes</span>
      </div>
      <svg viewBox="0 0 120 80" className="constellation-svg">
        {nodes.length > 1 ? (
          <polyline points={path} fill="none" stroke="#74ddff" strokeWidth="0.8" strokeOpacity="0.7" />
        ) : null}
        {nodes.map((n) => (
          <g key={n.metric}>
            <circle cx={n.x} cy={n.y} r="2.2" fill="#9defff" />
            <circle cx={n.x} cy={n.y} r="4.2" fill="none" stroke="#9defff77" strokeWidth="0.6" />
          </g>
        ))}
      </svg>
      <p>Live signal topology view connecting strongest channels into a dynamic drift graph.</p>
    </section>
  );
}

