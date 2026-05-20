"use client";
import { History, X } from "lucide-react";

/** Banner shown at the top of a form when an autosaved draft was restored. */
export function DraftBanner({ onDiscard }: { onDiscard: () => void }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/30 text-sm">
      <History className="w-4 h-4 text-accent shrink-0" />
      <span className="flex-1 min-w-0">Відновлено незбережену чернетку</span>
      <button
        type="button"
        onClick={onDiscard}
        className="btn text-xs py-1 px-2 gap-1 shrink-0"
      >
        <X className="w-3 h-3" /> Почати заново
      </button>
    </div>
  );
}
