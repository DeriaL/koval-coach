"use client";
import { useEffect, useState } from "react";
import { X, ExternalLink, Loader2, AlertCircle } from "lucide-react";

interface Props {
  title: string;
  fileUrl: string;
  fileType: string;
  onClose: () => void;
}

export function RecipePreviewModal({ title, fileUrl, fileType, onClose }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // For PDF blobs use direct URL; for everything else try Google Docs viewer first
  const isBlobPdf = fileType === "pdf" && fileUrl.includes("vercel-storage.com");
  const isCanva = fileUrl.includes("canva");
  const isGoogleDrive = fileUrl.includes("drive.google.com") || fileUrl.includes("docs.google.com");

  // Build iframe src
  let src = fileUrl;
  if (isBlobPdf) {
    src = fileUrl; // browser PDF viewer handles this natively
  } else if (isGoogleDrive) {
    // Convert Drive share link to preview
    src = fileUrl.replace("/view", "/preview").replace("/edit", "/preview");
  } else if (!isCanva && fileType === "pdf") {
    // External PDF — try Google Docs viewer
    src = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
  }
  // Canva and other links: use as-is — Canva share links render their own viewer

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-surface/95 border-b border-border shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="font-semibold truncate pr-4">{title}</div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="btn text-xs gap-1.5 py-2 px-3"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Відкрити окремо
          </a>
          <button onClick={onClose} className="btn py-2 px-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iframe area */}
      <div className="flex-1 relative" onClick={e => e.stopPropagation()}>
        {/* Loading spinner */}
        {!loaded && !failed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <span className="text-sm">Завантаження…</span>
          </div>
        )}

        {/* Fallback if iframe blocked */}
        {failed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="font-semibold mb-1">Не вдалось показати тут</div>
              <div className="text-sm text-muted">Сайт джерела блокує вбудоване відображення</div>
            </div>
            <a href={fileUrl} target="_blank" rel="noreferrer" className="btn btn-primary gap-2">
              <ExternalLink className="w-4 h-4" /> Відкрити в новій вкладці
            </a>
          </div>
        )}

        <iframe
          src={src}
          className={`w-full h-full border-0 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          allow="fullscreen"
          title={title}
        />
      </div>
    </div>
  );
}
