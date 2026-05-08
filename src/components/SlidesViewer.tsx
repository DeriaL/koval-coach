"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
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
  const goPrev = useCallback(() => setIndex(i => Math.max(0, i - 1)), []);
  const goNext = useCallback(() => setIndex(i => Math.min(total - 1, i + 1)), [total]);

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

  // Touch swipe
  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx > 0) goPrev(); else goNext();
    }
    touchStartX.current = null;
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="text-sm">Завантажуємо рецепти…</span>
      </div>
    );
  }

  if (error || !slides.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">{emoji ?? "📄"}</div>
        <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-accent" />
        </div>
        <div>
          <div className="font-semibold mb-1">Не вдалося завантажити</div>
          <div className="text-sm text-muted">Спробуй пізніше або зверніся до тренера</div>
        </div>
      </div>
    );
  }

  const current = slides[index];
  const progress = ((index + 1) / total) * 100;

  return (
    <div ref={containerRef}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      className="flex-1 flex flex-col bg-black relative overflow-hidden">

      {/* Top progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-10">
        <div className="h-full accent-shine transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Slide image area */}
      <div className={`flex-1 flex items-center justify-center p-2 sm:p-6 ${zoom ? "overflow-auto" : "overflow-hidden"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt={`${title} — слайд ${index + 1}`}
          className={`select-none transition-transform duration-200 ${zoom ? "max-w-none w-auto h-auto" : "max-w-full max-h-full object-contain"}`}
          style={zoom ? { width: "150%" } : undefined}
          draggable={false}
        />
      </div>

      {/* Bottom toolbar */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-3 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between gap-2">
        <button
          onClick={goPrev}
          disabled={index === 0}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95"
          aria-label="Попередній слайд"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-sm font-medium">
          <span>{index + 1} / {total}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(v => !v)}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/15 transition active:scale-95"
            aria-label={zoom ? "Зменшити" : "Збільшити"}
          >
            {zoom ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={goNext}
            disabled={index === total - 1}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95"
            aria-label="Наступний слайд"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Side click zones (desktop) */}
      <button onClick={goPrev} disabled={index === 0}
        className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-1/4 h-1/2 cursor-w-resize disabled:cursor-not-allowed"
        aria-label="prev" tabIndex={-1} />
      <button onClick={goNext} disabled={index === total - 1}
        className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1/4 h-1/2 cursor-e-resize disabled:cursor-not-allowed"
        aria-label="next" tabIndex={-1} />
    </div>
  );
}
