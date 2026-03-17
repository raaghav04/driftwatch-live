import { useRef } from "react";

export default function MetricCard({ title, value, unit, source }) {
  const frameRef = useRef(0);
  const metric = String(title).toLowerCase();
  const domain = metric.includes("solar") || metric.includes("geomagnetic") || metric.includes("cosmic")
    ? "space"
    : metric.includes("co2") || metric.includes("ozone") || metric.includes("humidity") || metric.includes("temperature")
      ? "chem"
      : "bio";

  return (
    <article
      className={`metric-card ${domain}`}
      onMouseMove={(e) => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        if (!window.matchMedia("(pointer: fine)").matches) return;
        if (frameRef.current) return;

        const card = e.currentTarget;
        const { clientX, clientY } = e;
        frameRef.current = window.requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const px = (clientX - rect.left) / rect.width;
          const py = (clientY - rect.top) / rect.height;
          const rx = (0.5 - py) * 4.5;
          const ry = (px - 0.5) * 5.5;
          card.style.setProperty("--tilt-x", `${rx.toFixed(2)}deg`);
          card.style.setProperty("--tilt-y", `${ry.toFixed(2)}deg`);
          card.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
          card.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
          frameRef.current = 0;
        });
      }}
      onMouseLeave={(e) => {
        if (frameRef.current) {
          window.cancelAnimationFrame(frameRef.current);
          frameRef.current = 0;
        }
        e.currentTarget.style.setProperty("--tilt-x", "0deg");
        e.currentTarget.style.setProperty("--tilt-y", "0deg");
        e.currentTarget.style.setProperty("--gx", "50%");
        e.currentTarget.style.setProperty("--gy", "50%");
      }}
    >
      <div className="metric-top">
        <h3>{title}</h3>
        <span className="domain-pill">{domain}</span>
      </div>
      <div className="metric-value">
        {Number.isFinite(value) ? value.toFixed(3) : "N/A"} <span>{unit}</span>
      </div>
      <p>{source}</p>
      <div className="metric-scanline" />
      <div className="metric-glow" />
    </article>
  );
}
