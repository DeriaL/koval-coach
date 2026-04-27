"use client";
import { useTransition, useState } from "react";
import { confirmSession, deleteSession } from "../clients/actions";
import { CheckCircle2, X, Trash2, Loader2 } from "lucide-react";
import { Confetti } from "@/components/Confetti";

export function SessionRowActions({ sessionId, clientId, mode }: { sessionId: string; clientId: string; mode: "awaiting" | "upcoming" | "done" }) {
  const [pending, start] = useTransition();
  const [celebrate, setCelebrate] = useState(false);

  function ack(happened: boolean) {
    start(async () => {
      await confirmSession(sessionId, clientId, happened);
      if (happened) {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 2500);
      }
    });
  }
  function del() {
    if (!window.confirm("Видалити сесію?")) return;
    start(async () => { await deleteSession(sessionId, clientId); });
  }

  return (
    <>
      {celebrate && <Confetti duration={2500} count={120} />}
      {mode === "awaiting" && (
        <div className="flex gap-2 ml-auto">
          <button onClick={() => ack(true)} disabled={pending}
            className="btn btn-primary text-xs py-2">
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Відбулася</span></>}
          </button>
          <button onClick={() => ack(false)} disabled={pending}
            className="btn text-xs py-2">
            <X className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Скасувати</span>
          </button>
        </div>
      )}
      {mode !== "awaiting" && (
        <button onClick={del} disabled={pending}
          className="btn text-xs py-2 text-muted hover:text-danger ml-auto">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </>
  );
}
