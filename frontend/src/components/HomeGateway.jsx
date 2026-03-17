import { useEffect, useMemo, useRef, useState } from "react";

const TAGLINES = [
  "Orbital intelligence for living systems",
  "Live fusion of space, chemistry, and bio signals",
  "High-resolution drift command environment"
];

export default function HomeGateway({ onEnter }) {
  const [step, setStep] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const rootRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    let rafId = 0;
    let nextX = 50;
    let nextY = 50;

    const flush = () => {
      rafId = 0;
      if (!rootRef.current) return;
      rootRef.current.style.setProperty("--hx", `${nextX}%`);
      rootRef.current.style.setProperty("--hy", `${nextY}%`);
      rootRef.current.style.setProperty("--rx", `${(nextX - 50) * 0.18}deg`);
      rootRef.current.style.setProperty("--ry", `${(nextY - 50) * -0.18}deg`);
    };

    const onMove = (e) => {
      if (reduceMotion.matches || !finePointer.matches) return;
      nextX = (e.clientX / window.innerWidth) * 100;
      nextY = (e.clientY / window.innerHeight) * 100;
      if (!rafId) rafId = window.requestAnimationFrame(flush);
    };
    const onKey = (e) => {
      if (e.key === "Enter") triggerLaunch();
    };
    flush();
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("keydown", onKey);
    const timer = setInterval(() => setStep((s) => (s + 1) % TAGLINES.length), 2400);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onKey);
      clearInterval(timer);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (!launching) return undefined;
    if (countdown <= 0) {
      onEnter();
      return undefined;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 420);
    return () => clearTimeout(t);
  }, [launching, countdown, onEnter]);

  const triggerLaunch = () => {
    if (launching) return;
    setLaunching(true);
    setCountdown(3);
  };

  const style = useMemo(
    () => ({
      "--hx": "50%",
      "--hy": "50%",
      "--rx": "0deg",
      "--ry": "0deg"
    }),
    []
  );

  return (
    <main ref={rootRef} className={`home-gateway x-premium ${launching ? "launching" : ""}`} style={style}>
      <div className="home-nebula" />
      <div className="home-aurora" />
      <div className="home-grid-3d" />
      <div className="home-orb orb-a" />
      <div className="home-orb orb-b" />
      <div className="home-orb orb-c" />
      <section className="home-panel x-panel">
        <div className="home-topline">
          <span>ASTRO-BIOCHEMICAL CONTROL SUITE</span>
          <span>v2.0 Hyper-Cinematic</span>
        </div>
        <h1>Astra Drift Nexus</h1>
        <p className="home-dynamic">{TAGLINES[step]}</p>
        <p className="home-copy">
          Navigate a premium command surface built for real-time anomaly detection and correction across
          space weather, environmental chemistry, and biological proxy streams.
        </p>
        <div className="home-holo-row">
          <article className="holo-card">
            <span>Temporal Mesh</span>
            <strong>Adaptive Drift Clock</strong>
          </article>
          <article className="holo-card">
            <span>Sensor Fusion</span>
            <strong>Space + Chem + Bio Link</strong>
          </article>
          <article className="holo-card">
            <span>Response Core</span>
            <strong>Auto Correct Runtime</strong>
          </article>
        </div>
        <div className="home-stats">
          <article><strong>11</strong><span>Live Channels</span></article>
          <article><strong>24/7</strong><span>Telemetry Flow</span></article>
          <article><strong>&lt;2s</strong><span>UI Reaction Loop</span></article>
        </div>
        <div className="home-actions">
          <button className="home-enter" onClick={triggerLaunch}>
            {launching ? `Launching ${countdown}` : "Enter Mission Control"}
          </button>
          <span>{launching ? "Initializing cinematic launch..." : "Press Enter"}</span>
        </div>
      </section>
    </main>
  );
}
