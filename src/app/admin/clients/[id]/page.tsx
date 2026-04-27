import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import Link from "next/link";
import { Tabs } from "./tabs";
import { ProfileTab } from "./sections/profile";
import { NutritionTab } from "./sections/nutrition";
import { TrainingTab } from "./sections/training";
import { SupplementsTab } from "./sections/supplements";
import { PaymentsTab } from "./sections/payments";
import { AnalyticsTab } from "./sections/analytics";
import { PhotosTab } from "./sections/photos";
import { AchievementsTab } from "./sections/achievements";
import { CheckInsTab } from "./sections/checkins";
import { RemindersTab } from "./sections/reminders";
import { ChatTab } from "./sections/chat";
import { HabitsTab } from "./sections/habits";
import { SessionsTab } from "./sections/sessions";
import { ArrowLeft, Mail, Phone, Target, Wifi, Crown, Dumbbell, Wallet } from "lucide-react";

type Props = { params: { id: string }; searchParams: { tab?: string } };

export default async function ClientDetail({ params, searchParams }: Props) {
  const id = params.id;
  const tab = searchParams.tab || "profile";

  const client = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: { select: { sessions: { where: { OR: [{ completed: true }, { confirmedByTrainer: true }] } } } },
      nutritionPlans: { orderBy: { updatedAt: "desc" } },
      trainingPlans: { orderBy: { updatedAt: "desc" }, include: { exercises: { orderBy: [{ day: "asc" }, { order: "asc" }] } } },
      habits: { include: { logs: true }, orderBy: { order: "asc" } },
      supplements: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { date: "desc" } },
      measurements: { orderBy: { date: "asc" } },
      photos: { orderBy: { date: "asc" } },
      achievements: { orderBy: { earnedAt: "desc" } },
      checkIns: { orderBy: { date: "desc" }, take: 60 },
      reminders: { orderBy: { datetime: "asc" } },
      messages: { orderBy: { createdAt: "asc" } },
      sessions: { orderBy: [{ scheduledAt: "desc" }, { date: "desc" }] },
    },
  });

  if (!client || client.role !== "CLIENT") notFound();

  return (
    <div className="max-w-6xl">
      <Link href="/admin" className="text-muted text-sm hover:text-accent flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Назад до клієнтів
      </Link>

      {(() => {
        const sessions = client._count.sessions;
        const pendingPay = client.payments.find((p: any) => p.status === "pending" || p.status === "overdue");
        const isOnline = client.coachingPlan === "ONLINE";
        const toNext = 10 - (sessions % 10);
        return (
          <div className="card p-6 flex flex-wrap items-center gap-5 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-gradient-to-br from-accent/20 via-transparent to-accent2/20" />
            <div className="relative w-20 h-20 rounded-2xl accent-shine flex items-center justify-center text-white text-3xl font-black">
              {client.firstName[0]}{client.lastName[0]}
            </div>
            <div className="relative flex-1 min-w-0">
              <div className="text-2xl font-bold flex items-center gap-2 flex-wrap">
                {client.firstName} {client.lastName}
                <span className={`chip text-xs ${isOnline ? "border-accent2/40 text-accent2" : "border-accent/40 text-accent"}`}>
                  {isOnline ? <><Wifi className="w-3 h-3" /> Онлайн</> : <><Crown className="w-3 h-3" /> Офлайн</>}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted mt-1">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {client.email}</span>
                {client.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {client.phone}</span>}
                {client.goal && <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {client.goal}</span>}
              </div>
            </div>
            <div className="relative flex gap-3">
              <div className="p-3 rounded-xl bg-surface border border-border min-w-[90px]">
                <div className="text-[10px] uppercase text-muted flex items-center gap-1"><Dumbbell className="w-3 h-3" /> Тренувань</div>
                <div className="text-xl font-black">{sessions}</div>
                <div className="text-[10px] text-muted">до оплати: {toNext}</div>
              </div>
              {pendingPay ? (
                <div className="p-3 rounded-xl bg-accent2/10 border border-accent2/40 min-w-[90px] animate-pulse-ring">
                  <div className="text-[10px] uppercase text-accent2 flex items-center gap-1"><Wallet className="w-3 h-3" /> Оплата</div>
                  <div className="text-xl font-black text-accent2">{pendingPay.amount} ₴</div>
                  <div className="text-[10px] text-muted">очікує</div>
                </div>
              ) : client.pricePer10 ? (
                <div className="p-3 rounded-xl bg-surface border border-border min-w-[90px]">
                  <div className="text-[10px] uppercase text-muted flex items-center gap-1"><Wallet className="w-3 h-3" /> Пакет</div>
                  <div className="text-xl font-black">{client.pricePer10} ₴</div>
                  <div className="text-[10px] text-muted">за 10 трен.</div>
                </div>
              ) : null}
            </div>
          </div>
        );
      })()}

      <Tabs active={tab} id={client.id} />

      <div className="mt-6">
        {tab === "profile" && <ProfileTab client={client} />}
        {tab === "nutrition" && <NutritionTab clientId={client.id} items={client.nutritionPlans} />}
        {tab === "training" && <TrainingTab clientId={client.id} items={client.trainingPlans} />}
        {tab === "supplements" && <SupplementsTab clientId={client.id} items={client.supplements} />}
        {tab === "payments" && <PaymentsTab clientId={client.id} items={client.payments} />}
        {tab === "analytics" && <AnalyticsTab clientId={client.id} items={client.measurements} />}
        {tab === "photos" && <PhotosTab clientId={client.id} items={client.photos} />}
        {tab === "achievements" && <AchievementsTab clientId={client.id} items={client.achievements} />}
        {tab === "checkins" && <CheckInsTab items={client.checkIns} />}
        {tab === "habits" && <HabitsTab clientId={client.id} items={client.habits} />}
        {tab === "sessions" && <SessionsTab clientId={client.id} items={client.sessions} />}
        {tab === "reminders" && <RemindersTab clientId={client.id} items={client.reminders} />}
        {tab === "chat" && <ChatTab clientId={client.id} initial={client.messages.map(m => ({ ...m, createdAt: m.createdAt.toISOString() }))} />}
      </div>
    </div>
  );
}
