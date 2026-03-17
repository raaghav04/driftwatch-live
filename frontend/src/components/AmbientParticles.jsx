import { memo } from "react";

const PARTICLES = Array.from({ length: 28 }, (_, i) => {
  const x = (i * 37) % 100;
  const y = (i * 53) % 100;
  const d = 8 + (i % 7) * 2;
  const s = 2 + (i % 5) * 0.6;
  return { id: i, x, y, d, s };
});

function AmbientParticles() {
  return (
    <div className="ambient-particles" aria-hidden="true">
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDuration: `${p.d}s`,
            animationDelay: `${(p.id % 6) * 0.3}s`,
            width: `${p.s}px`,
            height: `${p.s}px`
          }}
        />
      ))}
    </div>
  );
}

export default memo(AmbientParticles);
