"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Dumbbell, Menu, X } from "lucide-react";

type NavItem = { href: string; label: string };

export function StickyNav({ items, tgHref = "/login" }: { items: NavItem[]; tgHref?: string }) {
  const [active, setActive] = useState(items[0]?.href ?? "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sections = items
      .map((i) => document.querySelector(i.href))
      .filter(Boolean) as Element[];
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => { if (e.isIntersecting) setActive("#" + e.target.id); }),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-bg/60 backdrop-blur-xl border-b border-border/70">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold group">
          <span className="h-9 w-9 rounded-xl accent-shine flex items-center justify-center text-white shadow-glow group-hover:scale-110 transition-transform">
            <Dumbbell className="w-5 h-5" strokeWidth={1.6} />
          </span>
          <span className="text-base">Koval<span className="text-gradient">Fit</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {items.map((i) => (
            <a
              key={i.href}
              href={i.href}
              className={`relative text-sm transition-colors ${active === i.href ? "text-text" : "text-muted hover:text-text"}`}
            >
              {i.label}
              {active === i.href && (
                <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-accent to-accent2" />
              )}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href={tgHref} target="_blank" rel="noreferrer" className="btn btn-primary !py-2 !px-4 text-sm">Залишити заявку</a>
          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden h-9 w-9 grid place-items-center rounded-lg border border-border"
            aria-label="Меню"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-bg/95 backdrop-blur-xl">
          <div className="px-5 py-3 grid gap-1">
            {items.map((i) => (
              <a key={i.href} href={i.href} onClick={() => setOpen(false)} className="py-2.5 text-sm text-muted hover:text-text">
                {i.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
