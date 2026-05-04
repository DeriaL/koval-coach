"use client";
import { useTransition, useState } from "react";
import { updateClient, resetPassword, deleteClient } from "../../actions";
import { Loader2, Save, KeyRound, Trash2, Wifi, Crown, Star } from "lucide-react";

export function ProfileTab({ client }: { client: any }) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [pwd, setPwd] = useState("");
  const [plan, setPlan] = useState<"ONLINE" | "FULL">(client.coachingPlan === "ONLINE" ? "ONLINE" : "FULL");
  const [vip, setVip] = useState<boolean>(!!client.isVip);

  function submit(fd: FormData) {
    fd.set("coachingPlan", plan);
    fd.set("isVip", vip ? "true" : "false");
    start(async () => {
      await updateClient(client.id, Object.fromEntries(fd));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function reset() {
    if (!pwd) return;
    start(async () => { await resetPassword(client.id, pwd); setPwd(""); alert("Пароль оновлено"); });
  }

  function del() {
    if (!confirm(`Видалити клієнта "${client.firstName} ${client.lastName}"? Всі дані буде стерто.`)) return;
    start(async () => { await deleteClient(client.id); });
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <form action={submit} className="card p-6 lg:col-span-2 space-y-4">
        <h3 className="font-semibold">Основні дані</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Імʼя" name="firstName" defaultValue={client.firstName} required />
          <Field label="Прізвище" name="lastName" defaultValue={client.lastName} required />
          <Field label="Email" name="email" type="email" defaultValue={client.email} required />
          <Field label="Телефон" name="phone" defaultValue={client.phone ?? ""} />
          <Field label="День народження" name="birthday" type="date" defaultValue={client.birthday?.toISOString().slice(0,10) ?? ""} />
          <Field label="Зріст (см)" name="height" type="number" step="0.1" defaultValue={client.height ?? ""} />
          <Field label="Стартова вага (кг)" name="startWeight" type="number" step="0.1" defaultValue={client.startWeight ?? ""} />
        </div>
        <Field label="Ціль" name="goal" defaultValue={client.goal ?? ""} />

        <div>
          <label className="label">Формат ведення</label>
          <div className="grid sm:grid-cols-2 gap-2">
            <button type="button" onClick={() => setPlan("ONLINE")}
              className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${plan === "ONLINE" ? "border-accent bg-accent/10 -translate-y-0.5 shadow-glow" : "border-border bg-surface hover:border-accent/40"}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${plan === "ONLINE" ? "accent-shine text-white" : "bg-card text-accent"}`}><Wifi className="w-4 h-4" /></div>
              <div><div className="font-medium text-sm">Онлайн</div><div className="text-xs text-muted">віддалено</div></div>
            </button>
            <button type="button" onClick={() => setPlan("FULL")}
              className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${plan === "FULL" ? "border-accent bg-accent/10 -translate-y-0.5 shadow-glow" : "border-border bg-surface hover:border-accent/40"}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${plan === "FULL" ? "accent-shine text-white" : "bg-card text-accent"}`}><Crown className="w-4 h-4" /></div>
              <div><div className="font-medium text-sm">Офлайн</div><div className="text-xs text-muted">в залі особисто</div></div>
            </button>
          </div>
        </div>

        <Field label="Ціна за пакет 10 тренувань (₴)" name="pricePer10" type="number" step="50" defaultValue={client.pricePer10 ?? ""} />

        <button type="button" onClick={() => setVip(!vip)}
          className={`w-full p-3 rounded-xl border flex items-center gap-3 transition ${vip ? "border-accent bg-accent/10 shadow-glow" : "border-border bg-surface hover:border-accent/40"}`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${vip ? "accent-shine text-white" : "bg-card text-accent"}`}>
            <Star className={`w-4 h-4 ${vip ? "fill-current" : ""}`} />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-sm">VIP-клієнт</div>
            <div className="text-xs text-muted">Виділяти зірочкою у списку клієнтів</div>
          </div>
          <div className={`text-xs font-semibold ${vip ? "text-accent" : "text-muted"}`}>{vip ? "увімк" : "вимк"}</div>
        </button>

        <div>
          <label className="label">Нотатки тренера</label>
          <textarea name="notes" rows={4} className="textarea" defaultValue={client.notes ?? ""} />
        </div>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? "✓ Збережено" : <><Save className="w-4 h-4" /> Зберегти</>}
        </button>
      </form>

      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="font-semibold flex items-center gap-2"><KeyRound className="w-4 h-4 text-accent" /> Пароль клієнта</h3>
          <input className="input mt-3" placeholder="Новий пароль" value={pwd} onChange={e => setPwd(e.target.value)} />
          <button onClick={reset} disabled={!pwd || pending} className="btn w-full mt-2">Скинути пароль</button>
        </div>
        <div className="card p-5 border-danger/30">
          <h3 className="font-semibold text-danger flex items-center gap-2"><Trash2 className="w-4 h-4" /> Небезпечна зона</h3>
          <p className="text-muted text-sm mt-2">Видалить усі дані клієнта безповоротно.</p>
          <button onClick={del} disabled={pending} className="btn btn-danger w-full mt-3">Видалити клієнта</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, ...p }: any) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" {...p} />
    </div>
  );
}
