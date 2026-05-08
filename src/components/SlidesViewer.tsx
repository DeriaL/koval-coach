"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, Maximize2, Minimize2 } from "lucide-react";

interface Props {
  folder: string; // e.g. "/recipes/snidanky"
  title: string;
  emoji?: string | null;
}

export function SlidesViewer({ folder, title, emoji }: Props) {
  const [slides, setSlides] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Load slide list
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/recipes/slides?folder=${encodeURIComponent(folder)}`);
        const data = await res.json();
        if (cancelled) return;
        if (!Array.isArray(data.slides) || data.slides.length === 0) {
          setError(true);
        } else {
          setSlides(data.slides);
          setIndex(0);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [folder]);

  const total = slides.length;
  const goPrev = useCallback(() => { setImageLoaded(false); setIndex(i => Math.max(0, i - 1)); }, []);
  const goNext = useCallback(() => { setImageLoaded(false); setIndex(i => Math.min(total - 1, i + 1)); }, [total]);

  // Reset zoom when changing slide
  useEffect(() => { setZoom(false); }, [index]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Home") setIndex(0);
      else if (e.key === "End") setIndex(total - 1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, total]);

  // Preload neighbor images
  useEffect(() => {
    if (!slides.length) return;
    [index - 1, index + 1, index + 2].forEach(i => {
      if (i >= 0 && i < slides.length) {
        const img = new window.Image();
        img.src = slides[i];
      }
    });
  }, [index, slides]);

  // Touch swipe (only when not zoomed)
  function onTouchStart(e: React.TouchEvent) {
    if (zoom) return;
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (zoom || touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx > 0) goPrev(); else goNext();
    }
    touchStartX.current = null;
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/70">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="text-sm">Завантажуємо рецепти…</span>
      </div>
    );
  }

  if (error || !slides.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center text-white">
        <div className="text-5xl">{emoji ?? "📄"}</div>
        <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-accent" />
        </div>
        <div>
          <div className="font-semibold mb-1">Не вдалося завантажити</div>
          <div className="text-sm text-white/60">Спробуй пізніше або зверніся до тренера</div>
        </div>
      </div>
    );
  }

  const current = slides[index];
  const progress = ((index + 1) / total) * 100;

  return (
    <div ref={containerRef}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      className="flex-1 flex flex-col relative overflow-hidden"
    >
      {/* Slide image area with subtle radial spotlight.
          Top padding accounts for floating header, bottom for toolbar. */}
      <div
        className={`flex-1 flex items-center justify-center px-3 sm:px-8 pt-16 pb-20 sm:pt-20 sm:pb-24 ${zoom ? "overflow-auto" : "overflow-hidden"}`}
        style={{
          background: "radial-gradient(ellipse 80% 60% at center, rgba(255,255,255,0.04), transparent 70%)"
        }}
      >
        {/* Loading shimmer for current image */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Loader2 className="w-7 h-7 animate-spin text-white/30" />
          </div>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current}
          src={current}
          alt={`${title} — слайд ${index + 1}`}
          onLoad={() => setImageLoaded(true)}
          className={[
            "select-none rounded-xl sm:rounded-2xl shadow-2xl ring-1 ring-white/10 transition-all duration-300",
            zoom ? "max-w-none w-auto h-auto cursor-zoom-out" : "max-w-full max-h-full object-contain cursor-zoom-in",
            imageLoaded ? "opacity-100" : "opacity-0",
          ].join(" ")}
          style={zoom ? { width: "180%" } : undefined}
          draggable={false}
          onClick={() => setZoom(v => !v)}
        />
      </div>

      {/* Side click zones (desktop only, between toolbar zones) */}
      <button onClick={goPrev} disabled={index === 0}
        className="hidden md:block absolute left-0 top-16 bottom-24 w-1/5 cursor-pointer disabled:cursor-not-allowed group"
        aria-label="Попередній">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md text-white border border-white/15 opacity-0 group-hover:opacity-100 group-disabled:opacity-0 transition-opacity">
          <ChevronLeft className="w-5 h-5" />
        </span>
      </button>
      <button onClick={goNext} disabled={index === total - 1}
        className="hidden md:block absolute right-0 top-16 bottom-24 w-1/5 cursor-pointer disabled:cursor-not-allowed group"
        aria-label="Наступний">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md text-white border border-white/15 opacity-0 group-hover:opacity-100 group-disabled:opacity-0 transition-opacity">
          <ChevronRight className="w-5 h-5" />
        </span>
      </button>

      {/* Bottom floating toolbar */}
      <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-1.5 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 shadow-2xl z-10">
        <button
          onClick={goPrev}
          disabled={index === 0}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-90"
          aria-label="Попередній слайд"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Slide indicator with mini progress */}
        <div className="px-3 sm:px-4 min-w-[64px] flex items-center justify-center">
          <div className="text-white text-sm font-semibold tabular-nums">
            {index + 1}<span className="text-white/50 font-normal mx-0.5">/</span>{total}
          </div>
        </div>

        <button
          onClick={() => setZoom(v => !v)}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white hover:bg-white/15 transition active:scale-90"
          aria-label={zoom ? "Зменшити" : "Збільшити"}
        >
          {zoom ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          onClick={goNext}
          disabled={index === total - 1}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-90"
          aria-label="Наступний слайд"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Top progress bar — full width, thin */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5 z-10">
        <div className="h-full bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent2))] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
