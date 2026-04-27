"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Apple, Dumbbell, Pill, Wallet, LineChart,
  Camera, Flame, MessageCircle, User, Trophy, LogOut, Users, Settings, Menu, X, Target, Play
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

type Item = { href: string; label: string; icon: any };

const clientNav: Item[] = [
  { href: "/dashboard", label: "Головна", icon: LayoutDashboard },
  { href: "/dashboard/check-in", label: "Check-in", icon: Flame },
  { href: "/dashboard/habits", label: "Звички", icon: Target },
  { href: "/dashboard/workout", label: "В залі", icon: Play },
  { href: "/dashboard/training", label: "Програма", icon: Dumbbell },
  { href: "/dashboard/nutrition", label: "Харчування", icon: Apple },
  { href: "/dashboard/supplements", label: "Добавки", icon: Pill },
  { href: "/dashboard/analytics", label: "Аналітика", icon: LineChart },
  { href: "/dashboard/records", label: "Рекорди", icon: Trophy },
  { href: "/dashboard/photos", label: "Фото", icon: Camera },
  { href: "/dashboard/achievements", label: "Досягнення", icon: Trophy },
  { href: "/dashboard/payments", label: "Оплати", icon: Wallet },
  { href: "/dashboard/chat", label: "Чат", icon: MessageCircle },
  { href: "/dashboard/profile", label: "Профіль", icon: User },
];

const adminNav: Item[] = [
  { href: "/admin", label: "Клієнти", icon: Users },
  { href: "/admin/sessions", label: "Тренування", icon: Dumbbell },
  { href: "/admin/profile", label: "Мій профіль", icon: Settings },
];

export function Sidebar({ role, userName }: { role: "CLIENT" | "TRAINER"; userName: string }) {
  const pathname = usePathname();
  const items = role === "TRAINER" ? adminNav : clientNav;
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // bottom-nav: 4 основних + "Ще"
  const bottomItems = role === "CLIENT"
    ? [
        clientNav.find(i => i.href === "/dashboard")!,
        clientNav.find(i => i.href === "/dashboard/check-in")!,
        clientNav.find(i => i.href === "/dashboard/workout")!,
        clientNav.find(i => i.href === "/dashboard/analytics")!,
      ]
    : [adminNav[0]];

  const NavList = (
    <nav className="flex-1 space-y-1 overflow-y-auto stagger">
      {items.map((i, idx) => {
        const active = pathname === i.href || (i.href !== "/dashboard" && i.href !== "/admin" && pathname.startsWith(i.href));
        return (
          <Link
            key={i.href}
            href={i.href}
            style={{ ["--i" as any]: idx }}
            className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm overflow-hidden ${
              active ? "text-accent border border-accent/30 bg-accent/10 shadow-glow" : "text-text/80 hover:bg-card hover:translate-x-0.5"
            }`}
          >
            {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full accent-shine" />}
            <i.icon className={`w-4 h-4 transition-transform ${active ? "scale-110" : "group-hover:scale-110"}`} />
            {i.label}
          </Link>
        );
      })}
    </nav>
  );

  const Brand = (
    <Link href={role === "TRAINER" ? "/admin" : "/dashboard"} className="flex items-center gap-2 font-bold px-2 py-3 group">
      <div className="w-9 h-9 rounded-xl accent-shine flex items-center justify-center text-white shadow-glow group-hover:scale-110 transition-transform duration-300">
        <Dumbbell className="w-5 h-5" />
      </div>
      KOVAL<span className="text-gradient">.coach</span>
    </Link>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-surface border-r border-border flex-col p-4 z-30">
        {Brand}
        <div className="mt-4 flex-1 overflow-hidden flex flex-col">{NavList}</div>
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          <div className="px-2 py-2 text-sm">
            <div className="font-medium truncate">{userName}</div>
            <div className="text-muted text-xs">{role === "TRAINER" ? "Тренер" : "Клієнт"}</div>
          </div>
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted hover:bg-card hover:text-danger"
          >
            <LogOut className="w-4 h-4" /> Вийти
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 bg-surface/80 backdrop-blur-md border-b border-border z-30 flex items-center justify-between px-3 h-14">
        {Brand}
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <button onClick={() => setOpen(true)} className="btn px-3 py-2" aria-label="Меню">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
          <div
            className="absolute top-0 right-0 bottom-0 w-[85%] max-w-xs bg-surface border-l border-border p-4 flex flex-col animate-slide-in-right shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              {Brand}
              <button onClick={() => setOpen(false)} className="btn px-3 py-2"><X className="w-5 h-5" /></button>
            </div>
            <div className="mt-4 flex-1 overflow-y-auto">{NavList}</div>
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <div className="px-2 py-2 text-sm">
                <div className="font-medium truncate">{userName}</div>
                <div className="text-muted text-xs">{role === "TRAINER" ? "Тренер" : "Клієнт"}</div>
              </div>
              <ThemeToggle />
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted hover:bg-card hover:text-danger"
              >
                <LogOut className="w-4 h-4" /> Вийти
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav (тільки для клієнта) */}
      {role === "CLIENT" && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface/85 backdrop-blur-md border-t border-border z-30 grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
          {bottomItems.map((i) => {
            const active = pathname === i.href;
            return (
              <Link
                key={i.href}
                href={i.href}
                className={`relative flex flex-col items-center justify-center py-2 text-[10px] gap-1 active:scale-90 transition-transform ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full accent-shine" />}
                <i.icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} /> {i.label}
              </Link>
            );
          })}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center justify-center py-2 text-[10px] gap-1 text-muted active:scale-90 transition-transform"
          >
            <Menu className="w-5 h-5" /> Ще
          </button>
        </nav>
      )}
    </>
  );
}
