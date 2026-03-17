import { memo } from "react";

function BrandLogo({ onClick, small = false }) {
  return (
    <button
      type="button"
      className={`brand-logo ${small ? "small" : ""}`}
      onClick={onClick}
      aria-label="Go to home page"
      title="Go to home page"
    >
      <span className="logo-orbit orbit-1" />
      <span className="logo-orbit orbit-2" />
      <span className="logo-core">
        <span className="logo-dot" />
      </span>
      <span className="logo-word">
        <strong>ADN</strong>
        <em>Nexus</em>
      </span>
    </button>
  );
}

export default memo(BrandLogo);
