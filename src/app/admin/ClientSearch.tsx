"use client";
import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

export function ClientSearch({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(defaultValue);
  const [pending, start] = useTransition();
  const debRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local q if user navigates with different ?q=
  useEffect(() => {
    setQ(defaultValue);
  }, [defaultValue]);

  function push(next: string) {
    const sp = new URLSearchParams(params?.toString() ?? "");
    if (next) sp.set("q", next);
    else sp.delete("q");
    const url = sp.toString() ? `${pathname}?${sp.toString()}` : pathname;
    start(() => router.replace(url, { scroll: false }));
  }

  function onChange(v: string) {
    setQ(v);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => push(v), 220);
  }

  function clear() {
    setQ("");
    if (debRef.current) clearTimeout(debRef.current);
    push("");
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
        {pending ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : <Search className="w-4 h-4" />}
      </div>
      <input
        ref={inputRef}
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder="Пошук клієнта…"
        value={q}
        onChange={(e) => onChange(e.target.value)}
        className="input pl-9 pr-9 w-full"
        aria-label="Пошук клієнта"
      />
      {q && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-text hover:bg-surface transition"
          aria-label="Очистити"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
