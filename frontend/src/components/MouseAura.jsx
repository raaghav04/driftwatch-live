import { useEffect, useRef } from "react";

export default function MouseAura() {
  const auraRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    if (reduceMotion.matches || !finePointer.matches) return undefined;

    const target = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.3
    };
    const current = { ...target };
    let rafId = 0;

    const render = () => {
      current.x += (target.x - current.x) * 0.14;
      current.y += (target.y - current.y) * 0.14;
      if (auraRef.current) {
        auraRef.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      }
      rafId = window.requestAnimationFrame(render);
    };

    const onMove = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };

    rafId = window.requestAnimationFrame(render);
    window.addEventListener("mousemove", onMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="mouse-aura-layer" aria-hidden="true">
      <div ref={auraRef} className="mouse-aura" />
    </div>
  );
}
