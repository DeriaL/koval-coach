"use client";
import { useState, useTransition } from "react";
import { createClient } from "../actions";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { Loader2, Wifi, Crown } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [plan, setPlan] = useState<"ONLINE" | "FULL">("ONLINE");

  function submit(fd: FormData) {
    fd.set("coachingPlan", plan);
    start(async () => {
      try {
        const id = await createClient(Object.fromEntries(fd) as any);
        router.push(`/admin/clients/${id}`);
      } catch (e: any) {
        setErr(e.message);
      }
    });
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Новий клієнт" subtitle="Заповни основні дані та обери тариф" />
      <form action={submit} className="space-y-4">
        {/* Format selector */}
        <div className="card p-5 animate-fade-up">
          <div className="label mb-1">Формат ведення</div>
          <div className="text-xs text-muted mb-3">Послуги однакові — обери лише, як клієнт тренується.</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FormatCard
              active={plan === "ONLINE"}
              onClick={() => setPlan("ONLINE")}
              icon={Wifi}
              title="Онлайн"
              desc="Тренується самостійно — ведеш у кабінеті."
            />
            <FormatCard
              active={plan === "FULL"}
              onClick={() => setPlan("FULL")}
              icon={Crown}
              title="Офлайн"
              desc="Тренується з тобою в залі особисто."
            />
          </div>
        </div>

        <div className="card p-6 space-y-4 animate-fade-up" style={{ animationDelay: "80ms" }}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Імʼя</label>
              <input name="firstName" required className="input" />
            </div>
            <div>
              <label className="label">Прізвище</label>
              <input name="lastName" required className="input" />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" required className="input" />
            </div>
            <div>
              <label className="label">Пароль (початковий)</label>
              <input name="password" required className="input" />
            </div>
            <div>
              <label className="label">Телефон</label>
              <input name="phone" className="input" />
            </div>
            <div>
              <label className="label">День народження</label>
              <input name="birthday" type="date" className="input" />
            </div>
            <div>
              <label className="label">Зріст (см)</label>
              <input name="height" type="number" step="0.1" className="input" />
            </div>
            <div>
              <label className="label">Стартова вага (кг)</label>
              <input name="startWeight" type="number" step="0.1" className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Ціна за пакет 10 тренувань (₴)</label>
              <input name="pricePer10" type="number" step="50" placeholder="напр. 4000" className="input" />
              <div className="text-xs text-muted mt-1">
                Після кожних 10 завершених тренувань автоматично створюється рахунок і нагадування про оплату.
              </div>
            </div>
          </div>
          <div>
            <label className="label">Ціль</label>
            <input name="goal" className="input" />
          </div>
          <div>
            <label className="label">Нотатки</label>
            <textarea name="notes" rows={3} className="textarea" />
          </div>
          {err && <div className="text-danger text-sm">{err}</div>}
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={pending}>
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Створити"}
            </button>
            <button type="button" onClick={() => router.back()} className="btn">Скасувати</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function FormatCard({ active, onClick, icon: Icon, title, desc }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative text-left p-4 rounded-2xl border transition-all duration-300 overflow-hidden flex items-center gap-3 ${
        active
          ? "border-accent bg-accent/10 shadow-glow -translate-y-0.5"
          : "border-border bg-surface hover:border-accent/40 hover:-translate-y-0.5"
      }`}
    >
      {active && <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-accent/10 via-transparent to-accent2/10" />}
      <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${active ? "accent-shine text-white" : "bg-card border border-border text-accent"}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="relative flex-1 min-w-0">
        <div className="font-semibold flex items-center gap-2">
          {title}
          {active && <span className="chip text-[10px] border-accent/40 text-accent">обрано</span>}
        </div>
        <div className="text-xs text-muted mt-0.5">{desc}</div>
      </div>
    </button>
  );
}
