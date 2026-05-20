"use client";
import { useRef, type ReactNode } from "react";

export function Magnetic({ children, className = "", strength = 0.2 }:
  { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span
      ref={ref}
      className={`inline-block will-change-transform transition-transform duration-200 ${className}`}
      onPointerMove={(e) => {
        if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const el = ref.current; if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * strength}px, ${(e.clientY - r.top - r.height / 2) * strength * 1.4}px)`;
      }}
      onPointerLeave={() => { if (ref.current) ref.current.style.transform = ""; }}
    >
      {children}
    </span>
  );
}
