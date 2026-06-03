"use client";
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn, Trophy } from "lucide-react";

export type CaseItem = {
  src: string;
  caption: string;
  tag?: string; // short accent label, e.g. "1.5 місяці"
};

export function CasesGallery({ items }: { items: CaseItem[] }) {
  const [idx, setIdx] = useState<number | null>(null);
  const open = idx !== null;

  // Duplicate the row so the auto-scroll loop is seamless. Clicking a duplicate
  // still opens the correct photo via the modulo index.
  const loop = items.length > 1 ? [...items, ...items] : items;

  return (
    <>
      <div className="marquee -mx-5 lg:-mx-8 px-5 lg:px-8 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
        <div className="marquee-track !gap-4">
          {loop.map((it, i) => {
            const realIdx = i % items.length;
            return (
              <button
                key={`${it.src}-${i}`}
                type="button"
                onClick={() => setIdx(realIdx)}
                className="group relative shrink-0 w-[230px] sm:w-[270px] flex flex-col text-left rounded-2xl overflow-hidden border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_24px_60px_-24px] hover:shadow-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                {/* Image — shown in full, never cropped */}
                <div className="relative aspect-[3/4] bg-black shrink-0">
                  <Image
                    src={it.src}
                    alt={it.caption}
                    fill
                    sizes="270px"
                    className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  {/* Zoom hint */}
                  <span className="absolute top-2.5 right-2.5 z-10 grid place-items-center w-8 h-8 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-4 h-4" />
                  </span>
                </div>
                {/* Caption footer — below the photo, no overlap */}
                <div className="flex-1 p-3 sm:p-3.5 flex flex-col gap-1.5">
                  {it.tag && (
                    <span className="self-start inline-flex items-center gap-1 rounded-full bg-accent/15 border border-accent/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                      <Trophy className="w-3 h-3" /> {it.tag}
                    </span>
                  )}
                  <p className="text-xs sm:text-sm font-medium leading-snug text-text/90">
                    {it.caption}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {open && (
        <Lightbox
          items={items}
          idx={idx!}
          onClose={() => setIdx(null)}
          onNav={(d) => setIdx((p) => {
            const n = (p ?? 0) + d;
            return n < 0 ? items.length - 1 : n >= items.length ? 0 : n;
          })}
        />
      )}
    </>
  );
}

function Lightbox({
  items, idx, onClose, onNav,
}: {
  items: CaseItem[];
  idx: number;
  onClose: () => void;
  onNav: (d: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowLeft") onNav(-1);
    else if (e.key === "ArrowRight") onNav(1);
  }, [onClose, onNav]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [handleKey]);

  if (!mounted) return null;
  const it = items[idx];

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex flex-col animate-fade-in"
      onClick={onClose}
      style={{
        background:
          "radial-gradient(ellipse at top, rgba(40,30,80,0.55), transparent 60%), radial-gradient(ellipse at bottom, rgba(12,12,24,0.96), rgba(6,6,12,0.98))",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full grid place-items-center bg-white/10 hover:bg-white/20 text-white border border-white/15 transition active:scale-90"
        aria-label="Закрити"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Image */}
      <div
        className="flex-1 flex items-center justify-center px-4 sm:px-8 pt-14 pb-28 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={it.src}
          src={it.src}
          alt={it.caption}
          className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
        />
      </div>

      {/* Caption + nav */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[min(92vw,640px)] flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 rounded-2xl bg-black/55 backdrop-blur-xl border border-white/10 text-white/95 text-sm text-center leading-snug">
          {it.tag && (
            <span className="inline-flex items-center gap-1 mr-2 align-middle rounded-full bg-accent/20 border border-accent/40 px-2 py-0.5 text-[11px] font-semibold text-accent">
              <Trophy className="w-3 h-3" /> {it.tag}
            </span>
          )}
          {it.caption}
        </div>
        <div className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15">
          <button
            onClick={() => onNav(-1)}
            className="w-10 h-10 rounded-full grid place-items-center text-white hover:bg-white/15 transition active:scale-90"
            aria-label="Попередній"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-3 min-w-[60px] text-white text-sm font-semibold tabular-nums text-center">
            {idx + 1}<span className="text-white/50 font-normal mx-0.5">/</span>{items.length}
          </div>
          <button
            onClick={() => onNav(1)}
            className="w-10 h-10 rounded-full grid place-items-center text-white hover:bg-white/15 transition active:scale-90"
            aria-label="Наступний"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
