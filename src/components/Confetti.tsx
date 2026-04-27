"use client";
import { useEffect, useRef } from "react";

type Particle = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; size: number; color: string; shape: number; life: number };

const palette = ["#6366f1", "#3884ff", "#a78bfa", "#22d3ee", "#f472b6", "#fde047"];

export function Confetti({ duration = 2400, count = 140 }: { duration?: number; count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.scale(dpr, dpr);

    const parts: Particle[] = Array.from({ length: count }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 80,
      y: H / 2,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 14 - 6,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.4,
      size: 6 + Math.random() * 8,
      color: palette[Math.floor(Math.random() * palette.length)],
      shape: Math.floor(Math.random() * 3),
      life: 1,
    }));

    const start = performance.now();
    let raf = 0;
    function tick(t: number) {
      const elapsed = t - start;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.vy += 0.32;
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life = Math.max(0, 1 - elapsed / duration);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        if (p.shape === 0) ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else if (p.shape === 1) {
          ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2); ctx.lineTo(p.size / 2, p.size / 2); ctx.lineTo(-p.size / 2, p.size / 2); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      if (elapsed < duration) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, count]);

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-[100]" />;
}
