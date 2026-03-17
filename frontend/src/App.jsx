import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CorrectionPanel from "./components/CorrectionPanel";
import ControlDock from "./components/ControlDock";
import DomainMatrix from "./components/DomainMatrix";
import DriftTable from "./components/DriftTable";
import DriftSparkline from "./components/DriftSparkline";
import MapPanel from "./components/MapPanel";
import MetricCard from "./components/MetricCard";
import ScenarioStudio from "./components/ScenarioStudio";
import SignalSpotlight from "./components/SignalSpotlight";
import FusionMeter from "./components/FusionMeter";
import AnomalyNarrator from "./components/AnomalyNarrator";
import EventReactor from "./components/EventReactor";
import ExecutiveBriefing from "./components/ExecutiveBriefing";
import DriftIntelligenceLab from "./components/DriftIntelligenceLab";
import TemporalPlaybackDeck from "./components/TemporalPlaybackDeck";
import MissionControlPanel from "./components/MissionControlPanel";
import CommandPalette from "./components/CommandPalette";
import PulseDeck from "./components/PulseDeck";
import AmbientParticles from "./components/AmbientParticles";
import ConstellationBoard from "./components/ConstellationBoard";
import HomeGateway from "./components/HomeGateway";
import CinematicFX from "./components/CinematicFX";
import BrandLogo from "./components/BrandLogo";
import MotionBackdrop from "./components/MotionBackdrop";
import NebulaWaves from "./components/NebulaWaves";
import AstroGuideChat from "./components/AstroGuideChat";
import MouseAura from "./components/MouseAura";
import { ClassicSfx } from "./utils/sfx";
import { detectAndCorrectDrift, fetchDrift } from "./services/api";

const REFRESH_MS = 120000;

export default function App() {
  const [lat, setLat] = useState(37.7749);
  const [lon, setLon] = useState(-122.4194);
  const [report, setReport] = useState(null);
  const [correctionReport, setCorrectionReport] = useState(null);
  const [correcting, setCorrecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [history, setHistory] = useState([]);
  const [cinematic, setCinematic] = useState(true);
  const [hyperdrive, setHyperdrive] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [error, setError] = useState("");
  const sfxRef = useRef(null);

  if (!sfxRef.current && typeof window !== "undefined") {
    sfxRef.current = new ClassicSfx();
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchDrift(lat, lon);
      setReport(data);
      setHistory((prev) => [...prev.slice(-31), { drift_score: data.drift_score, generated_at: data.generated_at }]);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Failed to load live drift report.");
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  const runCorrection = useCallback(async () => {
    setCorrecting(true);
    setError("");
    try {
      const data = await detectAndCorrectDrift(lat, lon);
      setCorrectionReport(data);
      await load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Failed to detect and correct drift.");
    } finally {
      setCorrecting(false);
    }
  }, [lat, lon, load]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [autoRefresh, load]);

  const points = report?.live_points ?? [];
  const statusClass = useMemo(() => (report?.alert_level === "critical" ? "critical" : "stable"), [report]);
  const driftedCount = useMemo(() => (report?.by_metric ?? []).filter((x) => x.is_drift).length, [report]);
  const freshness = useMemo(() => {
    if (!report?.generated_at) return "n/a";
    return new Date(report.generated_at).toLocaleTimeString();
  }, [report]);

  useEffect(() => {
    document.body.classList.toggle("cinematic", cinematic);
    return () => document.body.classList.remove("cinematic");
  }, [cinematic]);

  useEffect(() => {
    document.body.classList.toggle("hyperdrive", hyperdrive);
    return () => document.body.classList.remove("hyperdrive");
  }, [hyperdrive]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const targets = document.querySelectorAll(".reveal-on-scroll");
    targets.forEach((t, i) => {
      t.style.transitionDelay = `${Math.min(i * 45, 420)}ms`;
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.14 }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [entered]);

  useEffect(() => {
    const score = report?.drift_score ?? 0.2;
    document.documentElement.style.setProperty("--drift-intensity", String(Math.max(0.15, Math.min(1, score + 0.2))));
  }, [report?.drift_score]);

  const commands = useMemo(() => ([
    { label: "Refresh Live Feed", run: load },
    { label: "Detect and Correct Drift", run: runCorrection },
    { label: "Toggle Cinematic Mode", run: () => setCinematic((x) => !x) },
    { label: "Toggle Hyperdrive Mode", run: () => setHyperdrive((x) => !x) },
    { label: "Toggle Auto Refresh", run: () => setAutoRefresh((x) => !x) },
    { label: "Nudge North-East", run: () => { setLat((x) => x + 0.2); setLon((x) => x + 0.2); } }
  ]), [load, runCorrection]);

  useEffect(() => {
    let armed = false;
    let lastHoverAt = 0;
    let lastHoverButton = null;

    const armAudio = () => {
      if (armed) return;
      armed = true;
      sfxRef.current?.startAmbient();
      sfxRef.current?.play("open");
    };

    const onClick = (e) => {
      armAudio();
      const target = e.target;
      if (!(target instanceof Element)) return;
      const btn = target.closest("button");
      if (!btn) return;
      if (btn.classList.contains("action-btn")) {
        sfxRef.current?.play("confirm");
        return;
      }
      if (btn.classList.contains("cinematic-toggle") && btn.classList.contains("hyper")) {
        sfxRef.current?.play("warp");
        return;
      }
      if (btn.classList.contains("cinematic-toggle")) {
        sfxRef.current?.play("toggle");
        return;
      }
      sfxRef.current?.play("click");
    };

    const onHover = (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const btn = target.closest("button");
      if (!btn) return;
      const related = e.relatedTarget instanceof Element ? e.relatedTarget.closest("button") : null;
      if (related === btn) return;
      const now = performance.now();
      if (lastHoverButton === btn && now - lastHoverAt < 180) return;
      lastHoverButton = btn;
      lastHoverAt = now;
      sfxRef.current?.play("hover");
    };

    const onKey = (e) => {
      if (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey)) {
        sfxRef.current?.play("open");
      }
    };

    const onBlur = () => sfxRef.current?.stopAmbient();
    const onFocus = () => sfxRef.current?.startAmbient();

    document.addEventListener("pointerdown", onClick, true);
    document.addEventListener("pointerover", onHover, true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("pointerdown", onClick, true);
      document.removeEventListener("pointerover", onHover, true);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      sfxRef.current?.stopAmbient();
    };
  }, []);

  useEffect(() => {
    if (report?.alert_level !== "critical") return undefined;
    const timer = window.setInterval(() => sfxRef.current?.play("alarm"), 9000);
    return () => window.clearInterval(timer);
  }, [report?.alert_level]);

  return (
    !entered ? <HomeGateway onEnter={() => setEntered(true)} /> :
    <>
      <MouseAura />
      <AmbientParticles />
      <MotionBackdrop />
      <NebulaWaves />
      <CinematicFX />
      <main className="app-shell">
      <header className="topbar">
        <div className="title-pack">
          <BrandLogo onClick={() => setEntered(false)} />
          <div>
          <div className="eyebrow">ASTRO BIOCHEMICAL EXECUTION GRID</div>
          <h1>Astro-Biochemical Drift Intelligence</h1>
          </div>
        </div>
        <div className={`alert-chip ${statusClass}`}>
          {loading ? "Refreshing..." : `Alert: ${report?.alert_level ?? "n/a"}`}
        </div>
      </header>

      <section className="lux-strip reveal-on-scroll">
        <article className="lux-item">
          <span>Global Score</span>
          <strong>{report ? report.drift_score.toFixed(4) : "--"}</strong>
        </article>
        <article className="lux-item">
          <span>Drifted Metrics</span>
          <strong>{driftedCount}</strong>
        </article>
        <article className="lux-item">
          <span>Live Signals</span>
          <strong>{points.length}</strong>
        </article>
        <article className="lux-item">
          <span>Last Sync</span>
          <strong>{freshness}</strong>
        </article>
        <article className="lux-item">
          <span>Cinematic</span>
          <strong>{cinematic ? "ON" : "OFF"}</strong>
        </article>
        <article className="lux-item">
          <span>Hyperdrive</span>
          <strong>{hyperdrive ? "ON" : "OFF"}</strong>
        </article>
      </section>

      <div className="reveal-on-scroll">
      <MapPanel
        lat={lat}
        lon={lon}
        points={points}
        driftScore={report?.drift_score ?? null}
        alertLevel={report?.alert_level ?? "n/a"}
        loading={loading}
        onMove={(nextLat, nextLon) => { setLat(nextLat); setLon(nextLon); }}
      />
      </div>

      {error && <p className="error">{error}</p>}

      <div className="reveal-on-scroll">
      <ControlDock
        loading={loading}
        correcting={correcting}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh((x) => !x)}
        onRefresh={load}
        onDetectCorrect={runCorrection}
      />
      </div>
      <button className="cinematic-toggle" onClick={() => setCinematic((x) => !x)}>
        {cinematic ? "Disable Cinematic Mode" : "Enable Cinematic Mode"}
      </button>
      <button className="cinematic-toggle hyper" onClick={() => setHyperdrive((x) => !x)}>
        {hyperdrive ? "Disable Hyperdrive" : "Enable Hyperdrive"}
      </button>

      <div className="premium-row reveal-on-scroll">
        <DriftSparkline history={history} />
        <DomainMatrix report={report} />
      </div>

      <div className="creative-row reveal-on-scroll">
        <SignalSpotlight report={report} />
        <ScenarioStudio report={report} />
      </div>

      <div className="creative-row-2 reveal-on-scroll">
        <FusionMeter report={report} points={points} />
        <AnomalyNarrator report={report} />
      </div>

      <div className="reveal-on-scroll">
      <DriftIntelligenceLab report={report} />
      </div>

      <div className="creative-row-2 reveal-on-scroll">
        <TemporalPlaybackDeck history={history} report={report} />
        <MissionControlPanel report={report} />
      </div>

      <div className="creative-row-2 reveal-on-scroll">
        <EventReactor report={report} correctionReport={correctionReport} history={history} />
        <ExecutiveBriefing report={report} correctionReport={correctionReport} />
      </div>

      <div className="reveal-on-scroll">
      <PulseDeck points={points} report={report} />
      </div>

      <div className="reveal-on-scroll">
      <ConstellationBoard points={points} />
      </div>

      <section className="metrics-grid reveal-on-scroll">
        {points.map((p) => (
          <MetricCard key={p.metric} title={p.metric} value={p.value} unit={p.unit} source={p.source} />
        ))}
      </section>

      {report && (
        <section className="panel summary reveal-on-scroll">
          <h2>Global Drift Score</h2>
          <div className="score">{report.drift_score.toFixed(4)}</div>
        </section>
      )}

      <div className="reveal-on-scroll"><DriftTable rows={report?.by_metric ?? []} /></div>
      <div className="reveal-on-scroll"><CorrectionPanel report={correctionReport} loading={correcting} onRun={runCorrection} /></div>
      <AstroGuideChat
        correctionReport={correctionReport}
        lat={lat}
        lon={lon}
        onSound={(kind) => sfxRef.current?.play(kind)}
      />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
      <div className="sticky-hint">Tip: press <kbd>Ctrl</kbd> + <kbd>K</kbd> for instant commands</div>
      </main>
    </>
  );
}
