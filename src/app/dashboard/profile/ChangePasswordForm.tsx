"use client";
import { useState, useTransition } from "react";
import { changePassword } from "./actions";
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setStatus("error");
      setMessage("Новий пароль і підтвердження не збігаються");
      return;
    }
    start(async () => {
      const res = await changePassword(current, next);
      if ("error" in res) {
        setStatus("error");
        setMessage(res.error);
      } else {
        setStatus("success");
        setMessage("Пароль успішно змінено!");
        setCurrent(""); setNext(""); setConfirm("");
        setTimeout(() => setStatus("idle"), 3000);
      }
    });
  }

  return (
    <div className="card p-5 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
          <KeyRound className="w-4 h-4 text-accent" />
        </div>
        <div>
          <div className="font-semibold text-sm">Змінити пароль</div>
          <div className="text-xs text-muted">Введи поточний і новий пароль</div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Поточний пароль</label>
          <div className="relative">
            <input
              className="input pr-10"
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={e => setCurrent(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="label">Новий пароль</label>
          <div className="relative">
            <input
              className="input pr-10"
              type={showNext ? "text" : "password"}
              value={next}
              onChange={e => setNext(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNext(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition"
            >
              {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {next && next.length < 6 && (
            <div className="text-xs text-muted mt-1">Мінімум 6 символів</div>
          )}
        </div>

        <div>
          <label className="label">Підтвердження нового пароля</label>
          <input
            className={`input ${confirm && confirm !== next ? "border-danger/60 focus:border-danger" : ""}`}
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
          {confirm && confirm !== next && (
            <div className="text-xs text-danger mt-1">Паролі не збігаються</div>
          )}
        </div>

        {status !== "idle" && (
          <div className={`flex items-center gap-2 text-sm p-3 rounded-xl border ${
            status === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-danger/10 border-danger/30 text-danger"
          }`}>
            {status === "success"
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <AlertCircle className="w-4 h-4 shrink-0" />}
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={pending || !current || !next || !confirm || next !== confirm}
          className="btn btn-primary w-full"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Змінити пароль"}
        </button>
      </form>
    </div>
  );
}
