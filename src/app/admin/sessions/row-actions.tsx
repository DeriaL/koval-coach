"use client";
import { useTransition, useState } from "react";
import { confirmSession, deleteSession, cancelSessionByTrainer } from "../clients/actions";
import { CheckCircle2, X, Trash2, Loader2, Ban } from "lucide-react";
import { Confetti } from "@/components/Confetti";
import { CancelModal } from "@/components/CancelModal";

export function SessionRowActions({ sessionId, clientId, mode, sessionTitle }: { sessionId: string; clientId: string; mode: "awaiting" | "upcoming" | "done" | "cancelled"; sessionTitle?: string }) {
  const [pending, start] = useTransition();
  const [celebrate, setCelebrate] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

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
    if (!window.confirm("Видалити сесію назавжди?")) return;
    start(async () => { await deleteSession(sessionId, clientId); });
  }
  async function doCancel(reason: string) {
    await cancelSessionByTrainer(sessionId, clientId, reason);
  }

  return (
    <>
      {celebrate && <Confetti duration={2500} count={120} />}
      <CancelModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={doCancel}
        who="TRAINER"
        title={sessionTitle}
      />

      {mode === "awaiting" && (
        <div className="flex gap-2 ml-auto">
          <button onClick={() => ack(true)} disabled={pending}
            className="btn btn-primary text-xs py-2">
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Відбулася</span></>}
          </button>
          <button onClick={() => ack(false)} disabled={pending}
            className="btn text-xs py-2">
            <X className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Не відбулась</span>
          </button>
        </div>
      )}
      {mode === "upcoming" && (
        <div className="flex gap-1 ml-auto">
          <button onClick={() => setCancelOpen(true)} disabled={pending}
            title="Скасувати з повідомленням клієнту"
            className="btn text-xs py-2 hover:border-danger/40 hover:text-danger">
            <Ban className="w-3.5 h-3.5" />
          </button>
          <button onClick={del} disabled={pending} title="Видалити" className="btn text-xs py-2 text-muted">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {(mode === "done" || mode === "cancelled") && (
        <button onClick={del} disabled={pending}
          className="btn text-xs py-2 text-muted hover:text-danger ml-auto">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </>
  );
}
