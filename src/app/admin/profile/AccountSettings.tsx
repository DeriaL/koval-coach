"use client";
import { useState, useTransition } from "react";
import { Loader2, Save, KeyRound, Mail, User as UserIcon, CheckCircle2 } from "lucide-react";
import { updateTrainerLogin, updateTrainerPassword } from "./actions";

export function AccountSettings({ user }: { user: any }) {
  return (
    <div className="space-y-4">
      <LoginForm user={user} />
      <PasswordForm />
    </div>
  );
}

function LoginForm({ user }: { user: any }) {
  const [email, setEmail] = useState(user.email);
  const [firstName, setFirst] = useState(user.firstName);
  const [lastName, setLast] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await updateTrainerLogin({ email, firstName, lastName, phone });
      if ((r as any).error) setErr((r as any).error);
      else { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    });
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><UserIcon className="w-4 h-4" /></div>
        <h3 className="font-semibold">Особисті дані</h3>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Імʼя</label>
          <input className="input" value={firstName} onChange={e => setFirst(e.target.value)} required />
        </div>
        <div>
          <label className="label">Прізвище</label>
          <input className="input" value={lastName} onChange={e => setLast(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="label flex items-center gap-1.5"><Mail className="w-3 h-3" /> Логін (Email)</label>
        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <div className="text-[10px] text-muted mt-1">Цей email використовується для входу в кабінет</div>
      </div>

      <div>
        <label className="label">Телефон</label>
        <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+38 050 …" />
      </div>

      {err && <div className="text-danger text-xs">{err}</div>}

      <button type="submit" disabled={pending} className="btn btn-primary gap-2">
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> :
          saved ? <><CheckCircle2 className="w-4 h-4" /> Збережено</> :
          <><Save className="w-4 h-4" /> Зберегти</>}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (next !== confirm) { setErr("Паролі не співпадають"); return; }
    start(async () => {
      const r = await updateTrainerPassword({ currentPassword: current, newPassword: next });
      if ((r as any).error) setErr((r as any).error);
      else {
        setSaved(true);
        setCurrent(""); setNext(""); setConfirm("");
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><KeyRound className="w-4 h-4" /></div>
        <h3 className="font-semibold">Зміна паролю</h3>
      </div>

      <div>
        <label className="label">Поточний пароль</label>
        <input className="input" type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} required />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Новий пароль</label>
          <input className="input" type="password" autoComplete="new-password" minLength={6} value={next} onChange={e => setNext(e.target.value)} required />
        </div>
        <div>
          <label className="label">Підтвердити</label>
          <input className="input" type="password" autoComplete="new-password" minLength={6} value={confirm} onChange={e => setConfirm(e.target.value)} required />
        </div>
      </div>
      <div className="text-[10px] text-muted">Мінімум 6 символів</div>

      {err && <div className="text-danger text-xs">{err}</div>}

      <button type="submit" disabled={pending || !current || !next} className="btn btn-primary gap-2">
        {pending ? <Loader2 className="w-4 h-4 animate-spin" /> :
          saved ? <><CheckCircle2 className="w-4 h-4" /> Пароль оновлено</> :
          <><Save className="w-4 h-4" /> Оновити пароль</>}
      </button>
    </form>
  );
}
