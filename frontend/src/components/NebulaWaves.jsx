import { memo } from "react";

const METEORS = Array.from({ length: 4 }, (_, i) => i);

function NebulaWaves() {
  return (
    <div className="nebula-waves" aria-hidden="true">
      <svg className="nw-ribbon" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <defs>
          <linearGradient id="nw-grad-a" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#58c8ff" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#70f0ca" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#6f9dff" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path d="M0,116 C160,52 320,168 520,104 C700,54 860,164 1200,98 L1200,0 L0,0 Z" fill="url(#nw-grad-a)" />
      </svg>
      <svg className="nw-ribbon ribbon-b" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <defs>
          <linearGradient id="nw-grad-b" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6de5ff" stopOpacity="0.14" />
            <stop offset="50%" stopColor="#7bf5d2" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#88a9ff" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path d="M0,132 C240,62 360,200 620,108 C800,42 980,152 1200,92 L1200,0 L0,0 Z" fill="url(#nw-grad-b)" />
      </svg>

      <div className="nw-vignette" />
      {METEORS.map((i) => (
        <span
          key={i}
          className="nw-meteor"
          style={{
            "--mx": `${10 + (i * 12) % 90}%`,
            "--my": `${8 + (i * 11) % 52}%`,
            "--md": `${(i % 6) * 1.2}s`,
            "--mt": `${5.5 + (i % 4) * 1.3}s`
          }}
        />
      ))}
    </div>
  );
}

export default memo(NebulaWaves);
