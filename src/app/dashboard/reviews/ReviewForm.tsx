"use client";
import { useState, useTransition } from "react";
import { Star, Send, Loader2, CheckCircle2 } from "lucide-react";
import { submitReview } from "./actions";

export function ReviewForm({ canEdit }: { canEdit: boolean }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!canEdit) {
    return (
      <div className="card p-5 border-success/30 bg-success/5 text-center">
        <CheckCircle2 className="w-8 h-8 mx-auto text-success mb-2" />
        <div className="font-semibold">Дякую за відгук!</div>
        <div className="text-xs text-muted mt-1">Він зʼявиться на сайті після перевірки тренером.</div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card p-5 border-success/30 bg-success/5 text-center">
        <CheckCircle2 className="w-8 h-8 mx-auto text-success mb-2" />
        <div className="font-semibold">Відгук надіслано!</div>
        <div className="text-xs text-muted mt-1">Тренер перевірить і опублікує на сайті.</div>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!rating) { setError("Постав оцінку від 1 до 5"); return; }
    start(async () => {
      try {
        await submitReview({ rating, text });
        setDone(true);
      } catch (err: any) {
        setError(err?.message ?? "Не вдалось надіслати");
      }
    });
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-4">
      <div>
        <div className="text-xs text-muted uppercase tracking-wider mb-2">Оцінка</div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map(n => {
            const filled = n <= (hover || rating);
            return (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition active:scale-90 ${
                  filled ? "text-yellow-400" : "text-muted hover:text-yellow-400/60"
                }`}
                aria-label={`${n} зірок`}
              >
                <Star className={`w-7 h-7 ${filled ? "fill-current" : ""}`} strokeWidth={1.5} />
              </button>
            );
          })}
          {rating > 0 && (
            <span className="ml-3 text-sm text-muted">{rating} / 5</span>
          )}
        </div>
      </div>

      <div>
        <label className="label">Коментар <span className="font-normal text-muted">(не обов&apos;язково)</span></label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Розкажи що сподобалось, які результати, як працюється з тренером…"
          className="textarea min-h-[110px]"
        />
        <div className="text-[10px] text-muted mt-1 text-right">{text.length} / 1000</div>
      </div>

      {error && <div className="text-danger text-xs">{error}</div>}

      <button
        type="submit"
        disabled={pending || !rating}
        className="btn btn-primary gap-2 w-full sm:w-auto"
      >
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {pending ? "Надсилаю…" : "Надіслати відгук"}
      </button>
    </form>
  );
}
