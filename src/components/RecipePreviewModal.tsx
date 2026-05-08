"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { SlidesViewer } from "./SlidesViewer";

interface Props {
  title: string;
  fileUrl: string;
  fileType: string;
  emoji?: string | null;
  onClose: () => void;
}

// Build absolute URL for relative paths — needed by external viewers (Office, Google Docs)
function toAbsolute(url: string): string {
  if (typeof window === "undefined") return url;
  if (/^https?:\/\//i.test(url)) return url;
  // encodeURI keeps Cyrillic file names readable but URL-safe
  return new URL(encodeURI(url), window.location.origin).toString();
}

// ── Detect sites that block iframe embedding ──────────────────────────────────
function getEmbedInfo(url: string, fileType: string): { src: string | null; blocked: boolean; brand?: string } {
  const u = url.toLowerCase();

  // Canva — always blocks iframe for share/short links
  if (u.includes("canva.com") || u.includes("canva.link")) {
    // If user already provided an embed URL (canva.com/design/.../view?embed) — try it
    if (u.includes("?embed") || u.includes("&embed")) {
      return { src: url, blocked: false };
    }
    return { src: null, blocked: true, brand: "Canva" };
  }

  // Instagram, Facebook, TikTok — always block
  if (u.includes("instagram.com") || u.includes("facebook.com") || u.includes("tiktok.com")) {
    return { src: null, blocked: true, brand: "соцмережа" };
  }

  // Google Drive — convert to embed preview
  if (u.includes("drive.google.com") || u.includes("docs.google.com")) {
    const src = url.replace("/view?usp=sharing", "/preview").replace("/view", "/preview").replace("/edit", "/preview");
    return { src, blocked: false };
  }

  // PPTX — use Microsoft Office Online viewer (requires public absolute URL)
  if (fileType === "pptx" || u.endsWith(".pptx")) {
    const abs = toAbsolute(url);
    // Office viewer doesn't work with localhost, only public URLs
    if (abs.includes("localhost") || abs.includes("127.0.0.1")) {
      return { src: null, blocked: true, brand: "PPTX (потрібен публічний URL)" };
    }
    const src = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(abs)}`;
    return { src, blocked: false };
  }

  // Direct PDF (blob / public URL)
  if (fileType === "pdf" && !u.includes("canva")) {
    const abs = toAbsolute(url);
    // Use Google Docs viewer for external PDFs, direct for blob
    const src = url.includes("vercel-storage.com")
      ? url
      : `https://docs.google.com/viewer?url=${encodeURIComponent(abs)}&embedded=true`;
    return { src, blocked: false };
  }

  // Anything else — try directly
  return { src: url, blocked: false };
}

// ── Canva-specific fallback card ──────────────────────────────────────────────
function CanvaFallback({ title, fileUrl, emoji }: { title: string; fileUrl: string; emoji?: string | null }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      {/* Big emoji / icon */}
      <div className="text-6xl leading-none">{emoji ?? "📄"}</div>

      <div>
        <div className="text-xl font-bold mb-2">{title}</div>
        <div className="text-muted text-sm max-w-sm">
          Canva не дозволяє вбудовувати презентації через iframe.<br />
          Натисни кнопку нижче щоб відкрити її в Canva.
        </div>
      </div>

      <a href={fileUrl} target="_blank" rel="noreferrer"
        className="btn btn-primary gap-2 px-6 py-3 text-base">
        <ExternalLink className="w-5 h-5" />
        Відкрити в Canva
      </a>

      {/* Tip */}
      <div className="max-w-sm p-4 rounded-2xl bg-surface border border-border text-left text-sm text-muted">
        <div className="font-medium text-text mb-2">💡 Як показувати прямо тут?</div>
        <ol className="space-y-1.5 list-none">
          <li><span className="font-medium text-text">1.</span> В Canva натисни <b>Download → PDF</b></li>
          <li><span className="font-medium text-text">2.</span> В адмінці відредагуй цю збірку</li>
          <li><span className="font-medium text-text">3.</span> Переключи на <b>«Завантажити файл»</b> і завантаж PDF</li>
        </ol>
        <div className="mt-2 text-xs opacity-70">Embed-посилання доступне тільки в Canva Pro</div>
      </div>
    </div>
  );
}

// ── Generic blocked fallback ──────────────────────────────────────────────────
function BlockedFallback({ title, fileUrl, brand, emoji }: { title: string; fileUrl: string; brand?: string; emoji?: string | null }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">{emoji ?? "📄"}</div>
      <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
        <AlertCircle className="w-6 h-6 text-accent" />
      </div>
      <div>
        <div className="font-semibold mb-1">Перегляд недоступний</div>
        <div className="text-sm text-muted">{brand ?? "Сайт"} блокує вбудовування</div>
      </div>
      <a href={fileUrl} target="_blank" rel="noreferrer" className="btn btn-primary gap-2">
        <ExternalLink className="w-4 h-4" /> Відкрити в новій вкладці
      </a>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export function RecipePreviewModal(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  // Render to document.body to escape any parent with `transform` that would
  // break `position: fixed` (e.g. animated page templates).
  return createPortal(<RecipePreviewModalInner {...props} />, document.body);
}

function RecipePreviewModalInner({ title, fileUrl, fileType, emoji, onClose }: Props) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // "slides" — image gallery rendered by SlidesViewer
  if (fileType === "slides") {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col animate-fade-in"
        onClick={onClose}
        style={{
          // Layered dark gradient — much more modern than flat black
          background:
            "radial-gradient(ellipse at top, rgba(40,30,80,0.6), transparent 60%), radial-gradient(ellipse at bottom, rgba(15,15,30,0.95), rgba(8,8,16,0.98))",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        {/* Floating glass header — compact, doesn't take much space */}
        <div
          className="absolute top-3 sm:top-4 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-20 flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white/8 backdrop-blur-xl border border-white/15 shadow-2xl sm:max-w-md w-full sm:w-auto"
          onClick={e => e.stopPropagation()}
        >
          <span className="text-xl shrink-0 leading-none">{emoji ?? "📄"}</span>
          <div className="font-semibold text-white truncate flex-1 text-sm sm:text-base">{title}</div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white border border-white/15 transition active:scale-90 shrink-0"
            aria-label="Закрити"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Centered content with max-width on large screens.
            min-h-0 lets flex children actually shrink — without it,
            the image's natural size pushes the container taller than
            the modal viewport (classic flexbox min-height:auto trap). */}
        <div
          className="flex-1 flex w-full max-w-7xl mx-auto min-h-0 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <SlidesViewer folder={fileUrl} title={title} emoji={emoji} />
        </div>
      </div>
    );
  }

  const { src, blocked, brand } = getEmbedInfo(fileUrl, fileType);
  const isCanva = fileUrl.toLowerCase().includes("canva");

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface/95 border-b border-border shrink-0"
        onClick={e => e.stopPropagation()}>
        <div className="font-semibold truncate pr-4">{title}</div>
        <div className="flex items-center gap-2 shrink-0">
          <a href={fileUrl} target="_blank" rel="noreferrer" className="btn text-xs gap-1.5 py-2 px-3">
            <ExternalLink className="w-3.5 h-3.5" /> Відкрити окремо
          </a>
          <button onClick={onClose} className="btn py-2 px-3"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden bg-[#f5f5f5] dark:bg-[#1a1a1a]"
        onClick={e => e.stopPropagation()}>

        {/* Canva-specific fallback */}
        {isCanva && blocked ? (
          <CanvaFallback title={title} fileUrl={fileUrl} emoji={emoji} />
        ) : blocked ? (
          <BlockedFallback title={title} fileUrl={fileUrl} brand={brand} emoji={emoji} />
        ) : src ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <span className="text-sm">Завантаження…</span>
              </div>
            )}
            <iframe
              src={src}
              className={`w-full h-full border-0 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setLoaded(true)}
              allow="fullscreen"
              title={title}
            />
          </>
        ) : (
          <BlockedFallback title={title} fileUrl={fileUrl} emoji={emoji} />
        )}
      </div>
    </div>
  );
}
