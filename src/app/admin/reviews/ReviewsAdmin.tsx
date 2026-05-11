"use client";
import { useState, useTransition } from "react";
import { Star, CheckCircle2, X, Trash2, Eye, EyeOff, Plus, Loader2, Save } from "lucide-react";
import { approveReview, deleteReview, addManualReview } from "./actions";

type Review = {
  id: string;
  clientId: string | null;
  authorName: string;
  rating: number;
  text: string | null;
  approved: boolean;
  createdAt: Date;
};

export function ReviewsAdmin({ initial }: { initial: Review[] }) {
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = initial.filter(r =>
    filter === "all" ? true :
    filter === "pending" ? !r.approved :
    r.approved
  );

  const counts = {
    all: initial.length,
    pending: initial.filter(r => !r.approved).length,
    approved: initial.filter(r => r.approved).length,
  };

  function toggle(r: Review) {
    setBusyId(r.id);
    start(async () => {
      await approveReview(r.id, !r.approved);
      setBusyId(null);
    });
  }

  function del(r: Review) {
    if (!confirm("Видалити відгук?")) return;
    setBusyId(r.id);
    start(async () => {
      await deleteReview(r.id);
      setBusyId(null);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
          {([
            ["all",      "Усі",         counts.all],
            ["pending",  "На модерації", counts.pending],
            ["approved", "Опубліковані", counts.approved],
          ] as const).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm border transition active:scale-95 ${
                filter === key
                  ? "accent-shine text-white border-transparent shadow-glow"
                  : "bg-surface border-border hover:border-accent/40"
              }`}
            >
              {label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                filter === key ? "bg-white/20" : "bg-card text-muted"
              }`}>{count}</span>
            </button>
          ))}
        </div>
        {!adding && (
          <button onClick={() => setAdding(true)} className="btn btn-primary text-sm">
            <Plus className="w-4 h-4" /> Додати відгук
          </button>
        )}
      </div>

      {adding && <ManualReviewForm onDone={() => setAdding(false)} />}

      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          {filter === "pending" ? "Немає відгуків що чекають перевірки" :
           filter === "approved" ? "Опублікованих відгуків ще немає" :
           "Відгуків ще немає"}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className={`card p-4 md:p-5 ${r.approved ? "" : "border-accent2/30 bg-accent2/5"}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold flex items-center gap-2 flex-wrap">
                    <span className="truncate">{r.authorName}</span>
                    {!r.clientId && <span className="chip text-[10px] py-0 px-1.5 text-muted">ручний</span>}
                  </div>
                  <div className="flex items-center gap-0.5 text-yellow-400 mt-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? "fill-current" : "text-muted"}`} />
                    ))}
                    <span className="text-xs text-muted ml-1.5">
                      {new Date(r.createdAt).toLocaleDateString("uk-UA")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggle(r)}
                    disabled={busyId === r.id}
                    title={r.approved ? "Зняти з публікації" : "Опублікувати"}
                    className={`btn text-xs gap-1 ${
                      r.approved
                        ? "border-success/30 text-success hover:bg-success/10"
                        : "border-accent2/40 text-accent2 hover:bg-accent2/10"
                    }`}
                  >
                    {busyId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                      r.approved ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">
                      {r.approved ? "Приховати" : "Опублікувати"}
                    </span>
                  </button>
                  <button
                    onClick={() => del(r)}
                    disabled={busyId === r.id}
                    className="btn text-xs text-danger border-danger/30 hover:bg-danger/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {r.text && (
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words mt-2">
                  {r.text}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ManualReviewForm({ onDone }: { onDone: () => void }) {
  const [authorName, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [approved, setApproved] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      try {
        await addManualReview({ authorName, rating, text, approved });
        onDone();
      } catch (e: any) {
        setErr(e?.message ?? "Помилка");
      }
    });
  }

  return (
    <form onSubmit={submit} className="card p-5 mb-4 space-y-3 border-accent/30">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Новий відгук вручну</h3>
        <button type="button" onClick={onDone} className="btn px-3 py-2"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Імʼя автора</label>
          <input className="input" value={authorName} onChange={e => setName(e.target.value)} placeholder="Олег П." required />
        </div>
        <div>
          <label className="label">Оцінка</label>
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button" onClick={() => setRating(n)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${n <= rating ? "text-yellow-400" : "text-muted"}`}>
                <Star className={`w-5 h-5 ${n <= rating ? "fill-current" : ""}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="label">Текст</label>
        <textarea className="textarea min-h-[80px]" value={text} onChange={e => setText(e.target.value)} maxLength={1000} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} />
        Одразу опублікувати на сайті
      </label>
      {err && <div className="text-danger text-xs">{err}</div>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Зберегти</>}
        </button>
        <button type="button" onClick={onDone} className="btn">Скасувати</button>
      </div>
    </form>
  );
}
