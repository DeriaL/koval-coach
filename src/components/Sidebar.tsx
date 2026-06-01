"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Apple, Dumbbell, Pill, Wallet, LineChart,
  Camera, Flame, MessageCircle, User, Trophy, LogOut, Users, Settings, Menu, X, Target, Play, Calendar, BookOpen, ChefHat, Activity, Star
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

type Item = { href: string; label: string; icon: any };

const clientNav: Item[] = [
  { href: "/dashboard", label: "Головна", icon: LayoutDashboard },
  { href: "/dashboard/check-in", label: "Check-in", icon: Flame },
  { href: "/dashboard/workout", label: "В залі", icon: Play },
  { href: "/dashboard/sessions", label: "Мої тренування", icon: Calendar },
  { href: "/dashboard/training", label: "Програма", icon: Dumbbell },
  { href: "/dashboard/nutrition", label: "Харчування", icon: Apple },
  { href: "/dashboard/recipes", label: "Рецепти", icon: ChefHat },
  { href: "/dashboard/supplements", label: "Добавки", icon: Pill },
  { href: "/dashboard/analytics", label: "Аналітика", icon: LineChart },
  { href: "/dashboard/photos", label: "Фото", icon: Camera },
  { href: "/dashboard/payments", label: "Оплати", icon: Wallet },
  { href: "/dashboard/reviews", label: "Відгук", icon: Star },
];

const adminNav: Item[] = [
  { href: "/admin", label: "Клієнти", icon: Users },
  { href: "/admin/activity", label: "Активність", icon: Activity },
  { href: "/admin/sessions", label: "Тренування", icon: Dumbbell },
  { href: "/admin/recipes", label: "Рецепти", icon: ChefHat },
  { href: "/admin/reviews", label: "Відгуки", icon: Star },
  { href: "/admin/finance", label: "Фінанси", icon: Wallet },
  { href: "/admin/settings", label: "Налаштування", icon: Settings },
  { href: "/admin/profile", label: "Мій профіль", icon: User },
];

export function Sidebar({ role, userName, hasPendingPayment = false }: { role: "CLIENT" | "TRAINER"; userName: string; hasPendingPayment?: boolean }) {
  const pathname = usePathname();
  const items = role === "TRAINER" ? adminNav : clientNav;
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // bottom-nav: 5 основних пунктів (5 columns total) — окремо для клієнта й тренера.
  // Use shorter labels here so the text doesn't overflow on narrow phones
  // ("Мій профіль" → "Профіль", etc.).
  const bottomItems: Item[] = role === "CLIENT"
    ? [
        clientNav.find(i => i.href === "/dashboard")!,
        clientNav.find(i => i.href === "/dashboard/check-in")!,
        { ...clientNav.find(i => i.href === "/dashboard/workout")!, label: "В залі" },
        clientNav.find(i => i.href === "/dashboard/analytics")!,
        // Profile isn't in clientNav (it's a separate footer entry on desktop),
        // declare it inline so the 5th column always renders.
        { href: "/dashboard/profile", label: "Профіль", icon: User },
      ].filter(Boolean) as Item[]
    : [
        { ...adminNav.find(i => i.href === "/admin")!, label: "Клієнти" },
        { ...adminNav.find(i => i.href === "/admin/activity")!, label: "Активність" },
        { ...adminNav.find(i => i.href === "/admin/sessions")!, label: "Сесії" },
        { ...adminNav.find(i => i.href === "/admin/finance")!, label: "Фінанси" },
        { ...adminNav.find(i => i.href === "/admin/profile")!, label: "Профіль" },
      ].filter(Boolean) as Item[];

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
        <Dumbbell className="w-5 h-5" strokeWidth={1.6} />
      </div>
      <span>Koval<span className="text-gradient">Fit</span></span>
    </Link>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-surface border-r border-border flex-col p-4 z-30">
        {Brand}
        <div className="mt-4 flex-1 overflow-hidden flex flex-col">{NavList}</div>
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          <Link
            href={role === "TRAINER" ? "/admin/profile" : "/dashboard/profile"}
            className={`flex items-center gap-2.5 px-2 py-2 rounded-xl text-sm hover:bg-card transition-colors group ${
              pathname === "/dashboard/profile" || pathname === "/admin/profile" ? "bg-accent/10 border border-accent/30" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-full accent-shine flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userName.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate leading-tight">{userName}</div>
              <div className="text-muted text-xs">{role === "TRAINER" ? "Тренер" : "Клієнт"}</div>
            </div>
            <User className="w-3.5 h-3.5 text-muted ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted hover:bg-card hover:text-danger"
          >
            <LogOut className="w-4 h-4" /> Вийти
          </button>
        </div>
      </aside>

      {/* Mobile top bar — opaque so scrolled content never bleeds through into
          the status-bar / notch safe-area zone. */}
      <header
        className="md:hidden fixed top-0 inset-x-0 bg-surface border-b border-border z-30 flex items-center justify-between px-3 h-14"
        style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(3.5rem + env(safe-area-inset-top))" }}
      >
        {Brand}
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <button onClick={() => setOpen(true)} className="btn px-3 py-2 relative" aria-label="Меню">
            <Menu className="w-5 h-5" />
            {hasPendingPayment && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-danger ring-2 ring-bg" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-danger animate-ping" />
              </>
            )}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-[60]" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" />
          <div
            className="absolute top-0 right-0 bottom-0 w-[85%] max-w-xs bg-surface border-l border-border px-4 pb-4 flex flex-col animate-slide-in-right shadow-2xl"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              {Brand}
              <button onClick={() => setOpen(false)} className="btn px-3 py-2"><X className="w-5 h-5" /></button>
            </div>
            <div className="mt-4 flex-1 overflow-y-auto">{NavList}</div>
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <Link
                href={role === "TRAINER" ? "/admin/profile" : "/dashboard/profile"}
                className={`flex items-center gap-2.5 px-2 py-2 rounded-xl text-sm hover:bg-card transition-colors group ${
                  pathname === "/dashboard/profile" || pathname === "/admin/profile" ? "bg-accent/10 border border-accent/30" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-full accent-shine flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {userName.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate leading-tight">{userName}</div>
                  <div className="text-muted text-xs">{role === "TRAINER" ? "Тренер" : "Клієнт"}</div>
                </div>
                <User className="w-3.5 h-3.5 text-muted ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
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

      {/* Mobile bottom nav (клієнт і тренер) — opaque so content doesn't bleed
          through into the home-indicator safe-area on overscroll. */}
      {bottomItems.length > 0 && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border z-30 grid grid-cols-5"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom), 10px)",
            paddingTop: "8px",
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
            boxShadow: "0 -8px 24px -12px rgba(0,0,0,0.35)",
          }}
        >
          {bottomItems.map((i) => {
            const active = pathname === i.href || (i.href !== "/dashboard" && i.href !== "/admin" && pathname.startsWith(i.href));
            return (
              <Link
                key={i.href}
                href={i.href}
                className="relative flex flex-col items-center justify-center pt-1 pb-0.5 px-1 min-w-0 gap-1 active:scale-95 transition-transform"
              >
                {/* Icon bubble — 3D when active, flat otherwise */}
                <span
                  className={`relative h-8 w-8 grid place-items-center rounded-xl transition-all duration-300 ${
                    active ? "text-white -translate-y-1" : "text-muted"
                  }`}
                  style={
                    active
                      ? {
                          background:
                            "linear-gradient(135deg, rgb(var(--accent2)) 0%, rgb(var(--accent)) 55%, rgb(var(--accent-soft)) 100%)",
                          boxShadow:
                            "inset 0 1px 0 rgba(255,255,255,0.35), 0 1px 0 rgba(0,0,0,0.15), 0 8px 18px -5px rgb(var(--accent) / 0.6), 0 12px 24px -8px rgb(var(--accent2) / 0.45)",
                        }
                      : undefined
                  }
                >
                  {/* glow halo behind active bubble */}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute -inset-1.5 -z-10 rounded-full opacity-70 blur-xl"
                      style={{ background: "radial-gradient(closest-side, rgb(var(--accent) / 0.55), transparent 70%)" }}
                    />
                  )}
                  <i.icon className={`shrink-0 ${active ? "w-[18px] h-[18px]" : "w-[19px] h-[19px]"}`} strokeWidth={active ? 2.4 : 1.8} />
                </span>

                <span
                  className={`text-[10px] leading-none truncate max-w-full transition-colors ${
                    active ? "text-accent font-semibold" : "text-muted"
                  }`}
                >
                  {i.label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
