"use client";
import { useState, useRef, useTransition } from "react";
import {
  Plus, X, Save, Loader2, Trash2, Upload, Trophy, Eye, EyeOff,
  ArrowUp, ArrowDown, Pencil, Image as ImageIcon,
} from "lucide-react";
import { createCase, updateCase, toggleCase, deleteCase, moveCase } from "./actions";

type Case = {
  id: string;
  imageUrl: string;
  caption: string;
  tag: string | null;
  order: number;
  published: boolean;
};

export function CasesAdmin({ initial }: { initial: Case[] }) {
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function withBusy(id: string, fn: () => Promise<void>) {
    setBusyId(id);
    start(async () => {
      try { await fn(); } finally { setBusyId(null); }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="text-sm text-muted">
          {initial.length} {initial.length === 1 ? "кейс" : initial.length < 5 ? "кейси" : "кейсів"} ·{" "}
          {initial.filter((c) => c.published).length} на сайті
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)} className="btn btn-primary text-sm">
            <Plus className="w-4 h-4" /> Додати кейс
          </button>
        )}
      </div>

      {adding && <CaseForm onDone={() => setAdding(false)} />}

      {initial.length === 0 && !adding ? (
        <div className="card p-10 text-center">
          <ImageIcon className="w-10 h-10 mx-auto text-muted mb-3" />
          <div className="text-muted">Кейсів ще немає</div>
          <div className="text-xs text-muted mt-1">Натисни «Додати кейс» вгорі</div>
        </div>
      ) : (
        <div className="space-y-3">
          {initial.map((c, i) => (
            <div key={c.id} className={`card p-3 md:p-4 ${c.published ? "" : "opacity-60 border-dashed"}`}>
              {editId === c.id ? (
                <CaseEditForm c={c} onDone={() => setEditId(null)} />
              ) : (
                <div className="flex gap-3 md:gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.imageUrl}
                    alt={c.caption}
                    className="w-20 h-28 md:w-24 md:h-32 rounded-xl object-cover bg-surface shrink-0 border border-border"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {c.tag && (
                        <span className="chip text-[10px] py-0 px-2 text-accent border-accent/30">
                          <Trophy className="w-3 h-3" /> {c.tag}
                        </span>
                      )}
                      {!c.published && <span className="chip text-[10px] py-0 px-2 text-muted">прихований</span>}
                    </div>
                    <p className="text-sm leading-snug line-clamp-3">{c.caption}</p>

                    <div className="mt-auto pt-2 flex items-center gap-1.5 flex-wrap">
                      {/* Reorder */}
                      <button
                        onClick={() => withBusy(c.id, () => moveCase(c.id, "up"))}
                        disabled={i === 0 || busyId === c.id}
                        className="btn px-2 py-1.5 text-xs disabled:opacity-30"
                        title="Вгору"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => withBusy(c.id, () => moveCase(c.id, "down"))}
                        disabled={i === initial.length - 1 || busyId === c.id}
                        className="btn px-2 py-1.5 text-xs disabled:opacity-30"
                        title="Вниз"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-px h-5 bg-border mx-0.5" />
                      <button
                        onClick={() => setEditId(c.id)}
                        className="btn px-2.5 py-1.5 text-xs gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Редагувати</span>
                      </button>
                      <button
                        onClick={() => withBusy(c.id, () => toggleCase(c.id, !c.published))}
                        disabled={busyId === c.id}
                        className={`btn px-2.5 py-1.5 text-xs gap-1 ${c.published ? "" : "border-accent2/40 text-accent2"}`}
                      >
                        {busyId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                          c.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{c.published ? "Приховати" : "Показати"}</span>
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm("Видалити кейс?")) return;
                          withBusy(c.id, () => deleteCase(c.id));
                        }}
                        disabled={busyId === c.id}
                        className="btn px-2.5 py-1.5 text-xs text-danger border-danger/30 hover:bg-danger/10"
                        title="Видалити"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Add form (with upload) ───────────────────────────────────────────────────
function CaseForm({ onDone }: { onDone: () => void }) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [tag, setTag] = useState("");
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setErr(null);
    if (!file.type.startsWith("image/")) { setErr("Тільки зображення"); return; }
    if (file.size > 15 * 1024 * 1024) { setErr("Файл більше 15 МБ"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "cases");
      const res = await fetch("/api/admin/photos", { method: "POST", body: fd });
      const text = await res.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}
      if (!res.ok || !data.url) throw new Error(data.error || `Помилка завантаження (${res.status})`);
      setUrl(data.url);
    } catch (e: any) {
      setErr(e?.message ?? "Помилка завантаження");
    } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      try {
        await createCase({ imageUrl: url, caption, tag });
        onDone();
      } catch (e: any) {
        setErr(e?.message ?? "Помилка");
      }
    });
  }

  return (
    <form onSubmit={submit} className="card p-5 mb-4 space-y-4 border-accent/30">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Новий кейс</h3>
        <button type="button" onClick={onDone} className="btn px-3 py-2"><X className="w-4 h-4" /></button>
      </div>

      {/* Image */}
      <div>
        <label className="label">Фото (вертикальне, до/після)</label>
        {url ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="preview" className="w-40 rounded-xl border border-border" />
            <button
              type="button"
              onClick={() => { setUrl(""); if (fileRef.current) fileRef.current.value = ""; }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full grid place-items-center bg-black/60 text-white border border-white/20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) uploadFile(f); }}
            className={`rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-8 px-4 cursor-pointer transition-colors text-center ${
              drag ? "border-accent bg-accent/10" : "border-border bg-surface hover:border-accent/40"
            }`}
          >
            {uploading ? (
              <><Loader2 className="w-7 h-7 text-accent animate-spin" /><div className="text-sm text-muted">Завантажуємо…</div></>
            ) : (
              <>
                <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/20 text-accent grid place-items-center"><Upload className="w-5 h-5" /></div>
                <div className="text-sm font-medium">Перетягни фото або натисни</div>
                <div className="text-xs text-muted">JPG / PNG / WEBP · до 15 МБ</div>
              </>
            )}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
      </div>

      <div className="grid sm:grid-cols-[1fr_180px] gap-3">
        <div>
          <label className="label">Підпис</label>
          <textarea className="textarea min-h-[72px]" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} placeholder="напр. Результат рекомпозиції тіла за 1.5 місяці!" />
        </div>
        <div>
          <label className="label">Тег (короткий)</label>
          <input className="input" value={tag} onChange={(e) => setTag(e.target.value)} maxLength={20} placeholder="1.5 місяці" />
        </div>
      </div>

      {err && <div className="text-danger text-xs">{err}</div>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending || uploading || !url || !caption.trim()} className="btn btn-primary">
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
        </button>
        <button type="button" onClick={onDone} className="btn">Скасувати</button>
      </div>
    </form>
  );
}

// ── Inline edit (caption + tag only) ─────────────────────────────────────────
function CaseEditForm({ c, onDone }: { c: Case; onDone: () => void }) {
  const [caption, setCaption] = useState(c.caption);
  const [tag, setTag] = useState(c.tag ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      try { await updateCase(c.id, { caption, tag }); onDone(); }
      catch (e: any) { setErr(e?.message ?? "Помилка"); }
    });
  }

  return (
    <form onSubmit={submit} className="flex gap-3 md:gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={c.imageUrl} alt="" className="w-20 h-28 md:w-24 md:h-32 rounded-xl object-cover bg-surface shrink-0 border border-border" />
      <div className="min-w-0 flex-1 space-y-2">
        <textarea className="textarea min-h-[60px] text-sm" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} placeholder="Підпис" />
        <input className="input text-sm" value={tag} onChange={(e) => setTag(e.target.value)} maxLength={20} placeholder="Тег (напр. 3 місяці)" />
        {err && <div className="text-danger text-xs">{err}</div>}
        <div className="flex gap-2">
          <button type="submit" disabled={pending || !caption.trim()} className="btn btn-primary text-sm">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
          </button>
          <button type="button" onClick={onDone} className="btn text-sm">Скасувати</button>
        </div>
      </div>
    </form>
  );
}
