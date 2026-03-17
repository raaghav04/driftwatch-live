import { memo } from "react";

const SHARDS = Array.from({ length: 5 }, (_, i) => i);
const STARS = Array.from({ length: 18 }, (_, i) => i);

function MotionBackdrop() {
  return (
    <div className="motion-backdrop" aria-hidden="true">
      <div className="mb-blob blob-a" />
      <div className="mb-blob blob-b" />
      <div className="mb-blob blob-c" />
      {STARS.map((i) => (
        <span
          key={`star-${i}`}
          className="mb-star"
          style={{
            "--tx": `${(i * 17) % 100}%`,
            "--ty": `${(i * 29) % 100}%`,
            "--td": `${(i % 8) * 0.35}s`,
            "--tt": `${2.8 + (i % 5) * 0.9}s`
          }}
        />
      ))}
      {SHARDS.map((i) => (
        <span
          key={i}
          className="mb-shard"
          style={{
            "--sx": `${(i * 7) % 100}%`,
            "--sy": `${(i * 13) % 100}%`,
            "--sd": `${(i % 7) * 0.6}s`,
            "--st": `${8 + (i % 6) * 1.25}s`
          }}
        />
      ))}
    </div>
  );
}

export default memo(MotionBackdrop);
