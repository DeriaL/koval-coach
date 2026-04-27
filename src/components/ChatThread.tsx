"use client";
import { useState, useTransition, useRef, useEffect } from "react";
import { sendMessage } from "@/app/dashboard/chat/actions";
import { Send } from "lucide-react";

type Msg = { id: string; authorRole: string; body: string; createdAt: string };

export function ChatThread({ clientId, meRole, initial }: { clientId: string; meRole: "CLIENT" | "TRAINER"; initial: Msg[] }) {
  const [items, setItems] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [items]);

  function submit() {
    if (!text.trim()) return;
    const body = text.trim();
    setText("");
    const optimistic: Msg = { id: "tmp-" + Date.now(), authorRole: meRole, body, createdAt: new Date().toISOString() };
    setItems((p) => [...p, optimistic]);
    start(async () => {
      const m = await sendMessage(clientId, meRole, body);
      setItems((p) => p.map(x => x.id === optimistic.id ? { ...m, createdAt: new Date(m.createdAt).toISOString() } : x));
    });
  }

  return (
    <div className="card p-3 md:p-4 flex flex-col h-[calc(100vh-200px)] md:h-[70vh]">
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {items.length === 0 && <div className="text-muted text-center mt-10 text-sm">Напиши перше повідомлення</div>}
        {items.map((m) => {
          const mine = m.authorRole === meRole;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${mine ? "bg-accent text-bg" : "bg-surface border border-border"}`}>
                <div className="text-sm whitespace-pre-wrap">{m.body}</div>
                <div className={`text-[10px] mt-1 ${mine ? "text-bg/60" : "text-muted"}`}>
                  {new Date(m.createdAt).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="mt-3 flex gap-2">
        <input
          className="input"
          placeholder="Повідомлення..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        />
        <button onClick={submit} disabled={pending} className="btn btn-primary px-4">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
