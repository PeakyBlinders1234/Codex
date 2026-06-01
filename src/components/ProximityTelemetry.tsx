"use client";

import { useEffect, useRef } from "react";
import { Activity, Atom, MousePointer2 } from "lucide-react";

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function ProximityTelemetry() {
  const percentageRef = useRef<HTMLSpanElement | null>(null);
  const barRef = useRef<HTMLSpanElement | null>(null);
  const verticesRef = useRef<HTMLSpanElement | null>(null);
  const particlesRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    let frame = 0;
    let lastUpdate = 0;

    function paint(nextInfluence: number) {
      const percentage = Math.round(nextInfluence * 100);
      const vertices = Math.round(84 + nextInfluence * 196);
      const particles = Math.round(120 + nextInfluence * 260);
      if (percentageRef.current) percentageRef.current.textContent = `${percentage}%`;
      if (barRef.current) barRef.current.style.width = `${Math.max(8, percentage)}%`;
      if (verticesRef.current) verticesRef.current.textContent = `${vertices}`;
      if (particlesRef.current) particlesRef.current.textContent = `${particles}`;
    }

    function handlePointerMove(event: PointerEvent) {
      const now = performance.now();
      if (now - lastUpdate < 96) return;
      lastUpdate = now;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const centerX = window.innerWidth * 0.58;
        const centerY = window.innerHeight * 0.38;
        const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
        paint(1 - smoothstep(80, Math.min(window.innerWidth, 980) * 0.52, distance));
      });
    }

    paint(0.48);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <section className="proximity-hud rounded-lg p-3" aria-label="3D 接近函数实时反馈">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Proximity Function</p>
          <h3 className="mt-1 text-sm font-semibold text-ink">鼠标距离驱动 3D 形变</h3>
        </div>
        <span ref={percentageRef} className="rounded-full border border-accent/40 px-2 py-1 text-xs font-semibold text-accent">
          48%
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(var(--panel-rgb),0.48)]">
        <span ref={barRef} className="block h-full rounded-full bg-gradient-to-r from-accent via-[var(--lime)] to-cyan transition-[width] duration-200" style={{ width: "48%" }} />
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-3">
        <span className="inline-flex items-center gap-1">
          <MousePointer2 className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          smoothstep 距离场
        </span>
        <span className="inline-flex items-center gap-1">
          <Atom className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          <span ref={verticesRef}>178</span> 个顶点扰动
        </span>
        <span className="inline-flex items-center gap-1">
          <Activity className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          <span ref={particlesRef}>245</span> 个粒子增亮
        </span>
      </div>
    </section>
  );
}
