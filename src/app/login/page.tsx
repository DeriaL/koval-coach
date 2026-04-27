"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Loader2 } from "lucide-react";
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
    // get role from session via fetch
    const s = await fetch("/api/auth/session").then((r) => r.json());
    if (s?.user?.role === "TRAINER") router.push("/admin");
    else router.push("/dashboard");
  }

  function fill(role: "trainer" | "client") {
    if (role === "trainer") {
      setEmail("trainer@koval.fit");
      setPassword("trainer123");
    } else {
      setEmail("client@koval.fit");
      setPassword("client123");
    }
  }

  return (
    <div className="min-h-screen h-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 font-bold text-xl mb-8">
          <div className="w-10 h-10 rounded-xl accent-shine flex items-center justify-center text-white">
            <Dumbbell className="w-5 h-5" />
          </div>
          KOVAL<span className="text-accent">.coach</span>
        </Link>

        <div className="card p-8">
          <h1 className="text-2xl font-bold">Вхід у кабінет</h1>
          <p className="text-muted text-sm mt-1">Введи дані, які тобі видав тренер</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Пароль</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <div className="text-danger text-sm">{error}</div>}
            <button className="btn btn-primary w-full py-3" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Увійти"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted mb-2">Швидкий вхід (demo):</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => fill("trainer")} className="btn text-sm">Тренер</button>
              <button onClick={() => fill("client")} className="btn text-sm">Клієнт</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
