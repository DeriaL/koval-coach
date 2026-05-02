"use client";
import Link from "next/link";
import {
  User, Apple, Dumbbell, Pill, Wallet, LineChart, Camera, Trophy, Flame, Bell, MessageCircle, Target, Calendar
} from "lucide-react";

const tabs = [
  { id: "profile", label: "Профіль", icon: User },
  { id: "sessions", label: "Тренування", icon: Calendar },
  { id: "checkins", label: "Check-ins", icon: Flame },
  { id: "habits", label: "Звички", icon: Target },
  { id: "nutrition", label: "Харчування", icon: Apple },
  { id: "training", label: "Тренування", icon: Dumbbell },
  { id: "supplements", label: "Добавки", icon: Pill },
  { id: "analytics", label: "Аналітика", icon: LineChart },
  { id: "photos", label: "Фото", icon: Camera },
  { id: "achievements", label: "Ачівки", icon: Trophy },
  { id: "payments", label: "Оплати", icon: Wallet },
  { id: "reminders", label: "Нагадування", icon: Bell },
  { id: "chat", label: "Чат", icon: MessageCircle },
];

export function Tabs({ active, id }: { active: string; id: string }) {
  return (
    <div className="mt-6 flex gap-2 border-b border-border pb-3 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap scrollbar-thin">
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <Link
            key={t.id}
            href={`/admin/clients/${id}?tab=${t.id}`}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition whitespace-nowrap shrink-0 ${
              isActive ? "bg-accent text-bg font-medium" : "bg-surface border border-border text-text/80 hover:border-accent/40"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </Link>
        );
      })}
    </div>
  );
}
