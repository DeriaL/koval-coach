"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { savePhoto, deletePhoto } from "../../actions";
import {
  Trash2, Plus, Save, X, Loader2, Upload, Image as ImageIcon,
  Camera, ChevronLeft, ChevronRight, Calendar,
} from "lucide-react";
import { kyivDayKey } from "@/lib/kyivTime";
import { PhotoComparePicker } from "@/components/PhotoCompare";

type Photo = {
  id: string;
  url: string;
  date: Date | string;
  angle: string | null;
  notes: string | null;
};

const ANGLE_LABEL: Record<string, string> = {
  front: "Спереду",
  side:  "Збоку",
  back:  "Ззаду",
};

export function PhotosTab({ clientId, items }: { clientId: string; items: Photo[] }) {
  const [editing, setEditing] = useState<Partial<Photo> | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [pending, start] = useTransition();

  function handleAdd() {
    setEditing({ date: kyivDayKey(new Date()) });
  }
  function save(data: Record<string, any>) {
    start(async () => {
      await savePhoto(clientId, { ...data, id: editing?.id });
      setEditing(null);
    });
  }
  function del(p: Photo) {
    if (!confirm("Видалити фото?")) return;
    start(async () => {
      await deletePhoto(p.id, clientId);
      // best-effort blob cleanup
      if (p.url?.includes("vercel-storage.com")) {
        fetch(`/api/admin/photos?url=${encodeURIComponent(p.url)}`, { method: "DELETE" }).catch(() => {});
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold">Фото прогресу</h3>
          <div className="text-xs text-muted">{items.length} фото у галереї</div>
        </div>
        {!editing && (
          <button onClick={handleAdd} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Додати фото
          </button>
        )}
      </div>

      {editing && (
        <PhotoForm
          clientId={clientId}
          initial={editing}
          pending={pending}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}

      {/* Before/after comparison — pick any two photos, filter by angle */}
      {!editing && items.length >= 2 && (
        <div className="card p-5 md:p-6 mb-4">
          <h4 className="font-semibold mb-3">Порівняння «до/після»</h4>
          <PhotoComparePicker
            photos={items.map((p) => ({ id: p.id, url: p.url, date: p.date, angle: p.angle }))}
          />
        </div>
      )}

      {/* Gallery */}
      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <Camera className="w-10 h-10 mx-auto text-muted mb-3" />
          <div className="text-muted">Фото ще немає</div>
          <div className="text-xs text-muted mt-1">Натисни «Додати фото» вгорі</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((p, i) => (
            <div
              key={p.id}
              className="card overflow-hidden group relative cursor-pointer hover:border-accent/40 hover:-translate-y-0.5 transition-all"
              onClick={() => setLightboxIdx(i)}
            >
              <div className="aspect-[3/4] bg-surface relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={ANGLE_LABEL[p.angle ?? ""] ?? ""}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Bottom gradient overlay */}
                <div aria-hidden className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                {/* Angle chip */}
                {p.angle && (
                  <div className="absolute top-2 left-2 chip text-[10px] py-0 px-2 bg-black/40 backdrop-blur-md border-white/15 text-white">
                    {ANGLE_LABEL[p.angle] ?? p.angle}
                  </div>
                )}
                {/* Date overlay */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 text-white text-[11px] font-medium drop-shadow">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span className="truncate">{new Date(p.date).toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv" })}</span>
                </div>
                {/* Delete button (visible on hover) */}
                <button
                  onClick={(e) => { e.stopPropagation(); del(p); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center bg-danger/85 hover:bg-danger text-white opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                  aria-label="Видалити"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          photos={items}
          startIdx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onDelete={(p) => { del(p); setLightboxIdx(null); }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Form with file upload
// ────────────────────────────────────────────────────────────────────────────

function PhotoForm({
  clientId, initial, pending, onSave, onCancel,
}: {
  clientId: string;
  initial: Partial<Photo>;
  pending: boolean;
  onSave: (data: Record<string, any>) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState(initial.url ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Тільки зображення (JPG/PNG/WEBP/HEIC)");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Файл більше 15 МБ");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("clientId", clientId);
      const res = await fetch("/api/admin/photos", { method: "POST", body: fd });
      // Parse defensively — a non-JSON body (e.g. a 500 HTML page) makes Safari
      // throw "The string did not match the expected pattern".
      const text = await res.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }
      if (!res.ok || !data.url) {
        throw new Error(data.error || `Помилка завантаження (${res.status})`);
      }
      setUrl(data.url);
    } catch (e: any) {
      setError(e?.message ?? "Помилка завантаження");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) uploadFile(f);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) uploadFile(f);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url) { setError("Спочатку завантаж фото"); return; }
    const fd = new FormData(e.currentTarget);
    const data: Record<string, any> = Object.fromEntries(fd);
    data.url = url;
    onSave(data);
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 md:p-6 space-y-4 mb-4 border-accent/30">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl accent-shine flex items-center justify-center text-white">
            <Camera className="w-4 h-4" />
          </div>
          {initial.id ? "Редагувати фото" : "Нове фото"}
        </h3>
        <button type="button" onClick={onCancel} className="btn px-3 py-2"><X className="w-4 h-4" /></button>
      </div>

      {/* Drop zone / preview */}
      <div>
        <label className="label">Фото</label>
        {url ? (
          <div className="relative rounded-2xl overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="preview" className="w-full max-h-[420px] object-contain bg-black" />
            <button
              type="button"
              onClick={() => { setUrl(""); if (fileRef.current) fileRef.current.value = ""; }}
              className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 active:scale-90 transition"
              aria-label="Прибрати"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-3 right-3 btn text-xs gap-1.5 backdrop-blur-md bg-black/60 border-white/20 text-white hover:bg-black/80"
            >
              <Upload className="w-3.5 h-3.5" /> Замінити
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={[
              "rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-10 px-4 cursor-pointer transition-colors text-center",
              drag
                ? "border-accent bg-accent/10"
                : "border-border bg-surface hover:border-accent/40 hover:bg-accent/5",
            ].join(" ")}
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                <div className="text-sm text-muted">Завантажуємо…</div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-sm font-medium">Перетягни фото сюди або натисни</div>
                <div className="text-xs text-muted">JPG / PNG / WEBP / HEIC · до 15 МБ</div>
              </>
            )}
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPick}
        />
      </div>

      {/* Date + angle */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Дата</label>
          <input
            name="date"
            type="date"
            defaultValue={initial.date ? kyivDayKey(new Date(initial.date as any)) : ""}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label">Ракурс</label>
          <select name="angle" defaultValue={initial.angle ?? ""} className="select">
            <option value="">—</option>
            <option value="front">Спереду</option>
            <option value="side">Збоку</option>
            <option value="back">Ззаду</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Нотатка</label>
        <input name="notes" defaultValue={initial.notes ?? ""} className="input" placeholder="напр. ранкове фото натщесерце" />
      </div>

      {error && <div className="text-danger text-xs">{error}</div>}

      <div className="flex gap-2 flex-wrap">
        <button type="submit" disabled={pending || uploading || !url} className="btn btn-primary">
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
        </button>
        <button type="button" onClick={onCancel} className="btn">Скасувати</button>
      </div>
    </form>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Lightbox (fullscreen photo viewer with navigation)
// ────────────────────────────────────────────────────────────────────────────

function Lightbox({
  photos, startIdx, onClose, onDelete,
}: {
  photos: Photo[];
  startIdx: number;
  onClose: () => void;
  onDelete: (p: Photo) => void;
}) {
  const [idx, setIdx] = useState(startIdx);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") setIdx(i => Math.max(0, i - 1));
      else if (e.key === "ArrowRight") setIdx(i => Math.min(photos.length - 1, i + 1));
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, photos.length]);

  // Track first finger + pinch flag so zoom gestures don't navigate photos.
  const touchStart = useRef<{ x: number; y: number; pinched: boolean } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length > 1) { touchStart.current = null; return; }
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, pinched: false };
  }
  function onTouchMove(e: React.TouchEvent) {
    if (touchStart.current && e.touches.length > 1) {
      touchStart.current.pinched = true;
    }
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || start.pinched) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) setIdx(i => Math.max(0, i - 1));
      else setIdx(i => Math.min(photos.length - 1, i + 1));
    }
  }

  if (!mounted) return null;

  const p = photos[idx];
  const total = photos.length;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col animate-fade-in"
      onClick={onClose}
      style={{
        background:
          "radial-gradient(ellipse at top, rgba(40,30,80,0.6), transparent 60%), radial-gradient(ellipse at bottom, rgba(15,15,30,0.95), rgba(8,8,16,0.98))",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      {/* Floating header */}
      <div
        className="absolute top-3 sm:top-4 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-20 flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white/8 backdrop-blur-xl border border-white/15 shadow-2xl sm:max-w-md w-full sm:w-auto"
        onClick={e => e.stopPropagation()}
      >
        <Camera className="w-4 h-4 text-white shrink-0" />
        <div className="font-semibold text-white truncate flex-1 text-sm sm:text-base">
          {new Date(p.date).toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv",  day: "2-digit", month: "long", year: "numeric" })}
          {p.angle && <span className="text-white/60 font-normal ml-2">· {ANGLE_LABEL[p.angle] ?? p.angle}</span>}
        </div>
        <button
          onClick={() => onDelete(p)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-danger/30 hover:bg-danger/60 text-white border border-danger/40 transition active:scale-90 shrink-0"
          aria-label="Видалити"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white border border-white/15 transition active:scale-90 shrink-0"
          aria-label="Закрити"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Image */}
      <div
        className="flex-1 flex items-center justify-center px-3 sm:px-8 pt-16 pb-20 sm:pt-20 sm:pb-24 min-h-0"
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => { touchStart.current = null; }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={p.id}
          src={p.url}
          alt=""
          className="max-w-full max-h-full object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
        />
      </div>

      {p.notes && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-md w-full px-4 z-10">
          <div className="px-4 py-2 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/10 text-white/90 text-sm text-center">
            {p.notes}
          </div>
        </div>
      )}

      {/* Bottom toolbar */}
      <div
        className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-1.5 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 shadow-2xl z-10"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => setIdx(i => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-30 transition active:scale-90"
          aria-label="Попередній"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="px-3 sm:px-4 min-w-[64px] text-white text-sm font-semibold tabular-nums text-center">
          {idx + 1}<span className="text-white/50 font-normal mx-0.5">/</span>{total}
        </div>
        <button
          onClick={() => setIdx(i => Math.min(total - 1, i + 1))}
          disabled={idx === total - 1}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-30 transition active:scale-90"
          aria-label="Наступний"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>,
    document.body
  );
}
