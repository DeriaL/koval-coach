"use client";
import type { ReactNode, HTMLAttributes } from "react";

export function CardSpot({ children, className = "", ...rest }:
  HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      {...rest}
      className={`card card-hover card-spot h-full ${className}`}
      onPointerMove={(e) => {
        const el = e.currentTarget as HTMLElement;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}
