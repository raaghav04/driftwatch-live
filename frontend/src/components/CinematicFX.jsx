import { useEffect, useRef } from "react";

export default function CinematicFX() {
  const timeRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      if (timeRef.current) {
        timeRef.current.textContent = new Date().toLocaleTimeString();
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="cinematic-fx" aria-hidden="true">
      <div className="fx-beam beam-a" />
      <div className="fx-beam beam-b" />
      <div className="fx-grain" />
      <div className="fx-vignette" />
      <div className="fx-frame frame-tl" />
      <div className="fx-frame frame-tr" />
      <div className="fx-frame frame-bl" />
      <div className="fx-frame frame-br" />
      <div className="fx-rec">REC <span ref={timeRef} /></div>
    </div>
  );
}
