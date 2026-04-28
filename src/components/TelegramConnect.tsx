"use client";
import { useState, useTransition } from "react";
import { Send, Check, Copy, X, Loader2 } from "lucide-react";

export function TelegramConnect({ initialUsername, initialLinked }: { initialUsername: string | null; initialLinked: boolean }) {
  const [linked, setLinked] = useState(initialLinked);
  const [username, setUsername] = useState(initialUsername);
  const [code, setCode] = useState<string | null>(null);
  const [bot, setBot] = useState<string>("");
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  function generate() {
    start(async () => {
      const r = await fetch("/api/telegram/link-code", { method: "POST" });
      const j = await r.json();
      setCode(j.code);
      setBot(j.botUsername || "");
    });
  }

  function unlink() {
    if (!window.confirm("Відʼєднати Telegram?")) return;
    start(async () => {
      await fetch("/api/telegram/link-code", { method: "DELETE" });
      setLinked(false); setUsername(null); setCode(null);
    });
  }

  const link = code && bot ? `https://t.me/${bot}?start=${code}` : null;

  if (linked) {
    return (
      <div className="card p-5 border-success/30 bg-success/5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-success/15 text-success flex items-center justify-center shrink-0"><Check className="w-5 h-5" /></div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold flex items-center gap-2">Telegram підключено
              <span className="chip text-[10px] text-success border-success/40">активно</span>
            </div>
            <div className="text-xs text-muted mt-1">
              {username ? <>Бот пише на акаунт <b className="text-text">{username}</b>.</> : <>Бот привʼязаний до твого Telegram.</>}
              {" "}Сповіщення приходять тут.
            </div>
          </div>
          <button onClick={unlink} disabled={pending} className="btn text-xs hover:border-danger/40 hover:text-danger">
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><X className="w-3.5 h-3.5" /> Відʼєднати</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-accent2/15 text-accent2 flex items-center justify-center shrink-0"><Send className="w-5 h-5" /></div>
        <div className="flex-1">
          <div className="font-semibold">Підключи Telegram</div>
          <div className="text-xs text-muted mt-1">Сповіщення про тренування, підтвердження, скасування і оплати — прямо в чат.</div>

          {!code && (
            <button onClick={generate} disabled={pending}
              className="btn btn-primary mt-3 text-sm">
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Згенерувати посилання</>}
            </button>
          )}

          {code && (
            <div className="mt-3 space-y-2">
              {link ? (
                <a href={link} target="_blank" rel="noreferrer"
                  className="btn btn-primary text-sm w-full justify-center">
                  Відкрити в Telegram →
                </a>
              ) : null}
              <div className="text-xs text-muted">
                Або відкрий бота і надішли <code className="px-1.5 py-0.5 rounded bg-card border border-border">/start {code}</code>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`/start ${code}`);
                  setCopied(true); setTimeout(() => setCopied(false), 1500);
                }}
                className="btn text-xs">
                {copied ? <><Check className="w-3 h-3" /> Скопійовано</> : <><Copy className="w-3 h-3" /> Копіювати команду</>}
              </button>
              {!bot && (
                <div className="text-[11px] text-danger">⚠ TELEGRAM_BOT_USERNAME не налаштовано на сервері. Адмін має додати env-змінну.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
