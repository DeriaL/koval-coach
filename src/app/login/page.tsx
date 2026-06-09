"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Loader2, Send } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Невірний email або пароль");
      return;
    }
    const s = await fetch("/api/auth/session").then((r) => r.json());
    if (s?.user?.role === "TRAINER") router.push("/admin");
    else router.push("/dashboard");
  }

  return (
    <div className="min-h-[100dvh] h-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 font-bold text-xl mb-8">
          <div className="w-10 h-10 rounded-xl accent-shine flex items-center justify-center text-white">
            <Dumbbell className="w-5 h-5" strokeWidth={1.6} />
          </div>
          <span>Koval<span className="text-gradient">Fit</span></span>
        </Link>

        <div className="card p-8">
          <h1 className="text-2xl font-bold">Вхід у кабінет</h1>
          <p className="text-muted text-sm mt-1">Введи дані, які я тобі видав</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label className="label">Пароль</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            {error && <div className="text-danger text-sm">{error}</div>}
            <button className="btn btn-primary w-full py-3" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Увійти"}
            </button>
          </form>
        </div>

        {/* No-access CTA — sends the visitor straight to the trainer in Telegram */}
        <div className="card mt-5 p-5 text-center border-accent2/30 bg-accent2/5 relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 pointer-events-none opacity-40 bg-gradient-to-br from-accent2/15 via-transparent to-accent/15" />
          <div className="relative">
            <p className="font-semibold">Ще не маєш доступу?</p>
            <p className="text-xs text-muted mt-1">
              Напиши мені — заведу твій кабінет і обговоримо співпрацю.
            </p>
            <a
              href="https://t.me/dmytro_kovalchuk_coach"
              target="_blank"
              rel="noreferrer"
              className="mt-4 w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-white accent-shine shadow-glow active:scale-95 transition hover:brightness-110"
            >
              <Send className="w-4 h-4" /> Написати тренеру
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
