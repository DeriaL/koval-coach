"use client";
import { useState, useTransition, useRef } from "react";
import { createLabResult, updateLabNote, deleteLabResult } from "@/app/dashboard/analyses/actions";
import {
  FlaskConical, Upload, FileText, ImageIcon, ExternalLink, Plus, X, Save,
  Loader2, Trash2, Pencil, StickyNote, Calendar,
} from "lucide-react";
import { kyivDayKey } from "@/lib/kyivTime";

type Lab = {
  id: string;
  title: string;
  date: Date | string;
  fileUrl: string;
  fileType: string;
  clientNote: string | null;
  trainerNote: string | null;
  uploadedBy: string;
};

export function AnalysesPanel({
  role,
  clientId,
  items,
}: {
  role: "CLIENT" | "TRAINER";
  clientId?: string;      // required when trainer adds for a client
  items: Lab[];
}) {
  const isTrainer = role === "TRAINER";
  const [adding, setAdding] = useState(false);
  const [pending, start] = useTransition();

  function del(id: string) {
    if (!confirm("Видалити цей запис аналізів?")) return;
    start(async () => { await deleteLabResult(id); });
  }

  return (
    <div className="space-y-4">
      {!adding && (
        <button onClick={() => setAdding(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Додати аналізи
        </button>
      )}

      {adding && (
        <UploadForm
          role={role}
          clientId={clientId}
          onDone={() => setAdding(false)}
        />
      )}

      {items.length === 0 && !adding && (
        <div className="card p-10 text-center">
          <FlaskConical className="w-10 h-10 mx-auto text-muted mb-3" />
          <div className="text-muted">Аналізів ще немає</div>
          <div className="text-xs text-muted mt-1">Завантаж файл, який надіслала лабораторія</div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((it) => (
          <LabCard key={it.id} lab={it} isTrainer={isTrainer} onDelete={() => del(it.id)} pending={pending} />
        ))}
      </div>
    </div>
  );
}

/* ───────────────── Upload form ───────────────── */

function UploadForm({ role, clientId, onDone }: { role: "CLIENT" | "TRAINER"; clientId?: string; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(kyivDayKey(new Date()));
  const [note, setNote] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("pdf");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/analyses/upload", { method: "POST", body: fd });
      const text = await res.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}
      if (!res.ok || !data.url) throw new Error(data.error || `Помилка завантаження (${res.status})`);
      setFileUrl(data.url);
      setFileType(data.fileType ?? "pdf");
      setFileName(data.name ?? file.name);
      if (!title) setTitle((data.name ?? file.name).replace(/\.[^.]+$/, ""));
    } catch (e: any) {
      setErr(e?.message ?? "Помилка");
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    setErr(null);
    if (!fileUrl) { setErr("Спочатку завантаж файл"); return; }
    start(async () => {
      const res = await createLabResult({ clientId, title, date, fileUrl, fileType, note });
      if (res?.ok) onDone();
      else setErr((res as any)?.error ?? "Помилка");
    });
  }

  return (
    <div className="card p-5 space-y-4 border-accent/30">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2"><FlaskConical className="w-4 h-4 text-accent" /> Нові аналізи</h3>
        <button onClick={onDone} className="btn"><X className="w-4 h-4" /></button>
      </div>

      {/* File */}
      {fileUrl ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
          <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
            {fileType === "image" ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{fileName || "Файл"}</div>
            <div className="text-xs text-success">✓ Завантажено</div>
          </div>
          <button onClick={() => { setFileUrl(""); if (fileRef.current) fileRef.current.value = ""; }} className="btn text-sm"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="rounded-2xl border-2 border-dashed border-border bg-surface hover:border-accent/40 cursor-pointer flex flex-col items-center justify-center gap-2 py-8 px-4 text-center transition-colors"
        >
          {uploading ? <Loader2 className="w-7 h-7 text-accent animate-spin" /> : (
            <>
              <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center"><Upload className="w-5 h-5" /></div>
              <div className="text-sm font-medium">Натисни, щоб завантажити файл</div>
              <div className="text-xs text-muted">PDF або фото · до 20 МБ</div>
            </>
          )}
        </div>
      )}
      <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />

      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="label">Назва</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="напр. Загальний аналіз крові" /></div>
        <div><label className="label">Дата</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" /></div>
      </div>

      <div>
        <label className="label">{role === "TRAINER" ? "Коментар тренера" : "Коментар (необовʼязково)"}</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="textarea" placeholder="напр. усе в нормі / звернути увагу на залізо…" />
      </div>

      {err && <div className="text-danger text-xs">{err}</div>}

      <button onClick={submit} disabled={pending || uploading || !fileUrl} className="btn btn-primary">
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
      </button>
    </div>
  );
}

/* ───────────────── Lab card ───────────────── */

function LabCard({ lab, isTrainer, onDelete, pending }: { lab: Lab; isTrainer: boolean; onDelete: () => void; pending: boolean }) {
  const dateStr = new Date(lab.date).toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv", day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="card overflow-hidden">
      <div className="h-[3px] bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent2))]" />
      <div className="p-4 space-y-3">
        {/* Header + file */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            {lab.fileType === "image" ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold break-words">{lab.title}</div>
            <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" /> {dateStr}
              <span className="text-muted/70">· {lab.uploadedBy === "TRAINER" ? "додав тренер" : "додав клієнт"}</span>
            </div>
          </div>
          <a href={lab.fileUrl} target="_blank" rel="noreferrer" className="btn text-xs gap-1.5 shrink-0">
            <ExternalLink className="w-3.5 h-3.5" /> Відкрити
          </a>
          <button onClick={onDelete} disabled={pending} className="btn text-xs px-2 text-muted hover:text-danger shrink-0" aria-label="Видалити">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Image preview */}
        {lab.fileType === "image" && (
          <a href={lab.fileUrl} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lab.fileUrl} alt={lab.title} className="w-full max-h-72 object-contain bg-black/40" />
          </a>
        )}

        {/* Two-sided notes */}
        <NoteRow
          label="Тренер"
          accent
          value={lab.trainerNote}
          editable={isTrainer}
          labId={lab.id}
        />
        <NoteRow
          label="Клієнт"
          value={lab.clientNote}
          editable={!isTrainer}
          labId={lab.id}
        />
      </div>
    </div>
  );
}

function NoteRow({ label, value, editable, accent, labId }: { label: string; value: string | null; editable: boolean; accent?: boolean; labId: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value ?? "");
  const [pending, start] = useTransition();

  function save() {
    start(async () => { await updateLabNote(labId, text); setEditing(false); });
  }

  if (!value && !editable) return null; // nothing to show and can't add

  return (
    <div className={`rounded-xl p-3 border ${accent ? "bg-accent/5 border-accent/20" : "bg-surface border-border"}`}>
      <div className="flex items-center justify-between mb-1">
        <div className={`text-[10px] uppercase tracking-wider flex items-center gap-1 ${accent ? "text-accent" : "text-muted"}`}>
          <StickyNote className="w-3 h-3" /> {label}
        </div>
        {editable && !editing && (
          <button onClick={() => { setText(value ?? ""); setEditing(true); }} className="text-[11px] text-muted hover:text-accent flex items-center gap-1">
            <Pencil className="w-3 h-3" /> {value ? "Змінити" : "Додати"}
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className="textarea text-sm" autoFocus placeholder="Напиши коментар…" />
          <div className="flex gap-2">
            <button onClick={save} disabled={pending} className="btn btn-primary text-xs">
              {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Save className="w-3.5 h-3.5" /> Зберегти</>}
            </button>
            <button onClick={() => setEditing(false)} className="btn text-xs">Скасувати</button>
          </div>
        </div>
      ) : (
        <div className="text-sm whitespace-pre-wrap break-words text-text/90">
          {value || <span className="text-muted italic text-xs">Поки без коментаря</span>}
        </div>
      )}
    </div>
  );
}
