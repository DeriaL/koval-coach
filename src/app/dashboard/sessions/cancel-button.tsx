"use client";
import { useState } from "react";
import { CancelModal } from "@/components/CancelModal";
import { cancelSessionByClient } from "./actions";
import { Ban } from "lucide-react";

export function CancelButton({ sessionId, title }: { sessionId: string; title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        title="Скасувати тренування"
        className="btn text-xs py-2 hover:border-danger/40 hover:text-danger shrink-0">
        <Ban className="w-3.5 h-3.5" />
      </button>
      <CancelModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={async (reason) => { await cancelSessionByClient(sessionId, reason); }}
        who="CLIENT"
        title={title}
      />
    </>
  );
}
