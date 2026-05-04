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
import { ArrowLeft, Mail, Phone, Target, Wifi, Crown, Dumbbell, Wallet, Star } from "lucide-react";
import { AvatarUpload } from "@/components/AvatarUpload";

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
          <div className="card p-4 md:p-6 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-gradient-to-br from-accent/20 via-transparent to-accent2/20" />

            <div className="relative flex items-start gap-3 md:gap-5">
              <div className="shrink-0 md:hidden">
                <AvatarUpload
                  initialUrl={client.avatarUrl}
                  initials={`${client.firstName[0]}${client.lastName[0]}`}
                  size={56}
                  endpoint={`/api/admin/client-avatar/${client.id}`}
                />
              </div>
              <div className="shrink-0 hidden md:block">
                <AvatarUpload
                  initialUrl={client.avatarUrl}
                  initials={`${client.firstName[0]}${client.lastName[0]}`}
                  size={80}
                  endpoint={`/api/admin/client-avatar/${client.id}`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg md:text-2xl font-bold leading-tight flex items-center gap-2">
                  {client.isVip && <Star className="w-5 h-5 text-yellow-400 fill-current shrink-0" />}
                  <span>{client.firstName} {client.lastName}</span>
                </div>
                <div className="mt-1.5">
                  <span className={`chip text-[10px] md:text-xs ${isOnline ? "border-accent2/40 text-accent2" : "border-accent/40 text-accent"}`}>
                    {isOnline ? <><Wifi className="w-3 h-3" /> Онлайн</> : <><Crown className="w-3 h-3" /> Офлайн</>}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-xs md:text-sm text-muted mt-2">
                  <span className="flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{client.email}</span></span>
                  {client.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" /> {client.phone}</span>}
                  {client.goal && <span className="flex items-start gap-1.5"><Target className="w-3.5 h-3.5 shrink-0 mt-0.5" /> <span className="line-clamp-2">{client.goal}</span></span>}
                </div>
              </div>
            </div>

            {/* Stats — full width row on mobile, side-by-side on desktop */}
            <div className="relative grid grid-cols-2 gap-2 md:gap-3 mt-4 md:mt-3 md:absolute md:top-6 md:right-6 md:w-auto md:flex">
              <div className="p-2.5 md:p-3 rounded-xl bg-surface border border-border md:min-w-[90px]">
                <div className="text-[10px] uppercase text-muted flex items-center gap-1"><Dumbbell className="w-3 h-3" /> Тренувань</div>
                <div className="text-lg md:text-xl font-black">{sessions}</div>
                <div className="text-[10px] text-muted">до оплати: {toNext}</div>
              </div>
              {pendingPay ? (
                <div className="p-2.5 md:p-3 rounded-xl bg-accent2/10 border border-accent2/40 md:min-w-[90px] animate-pulse-ring">
                  <div className="text-[10px] uppercase text-accent2 flex items-center gap-1"><Wallet className="w-3 h-3" /> Оплата</div>
                  <div className="text-lg md:text-xl font-black text-accent2">{pendingPay.amount} ₴</div>
                  <div className="text-[10px] text-muted">очікує</div>
                </div>
              ) : client.pricePer10 ? (
                <div className="p-2.5 md:p-3 rounded-xl bg-surface border border-border md:min-w-[90px]">
                  <div className="text-[10px] uppercase text-muted flex items-center gap-1"><Wallet className="w-3 h-3" /> Пакет</div>
                  <div className="text-lg md:text-xl font-black">{client.pricePer10} ₴</div>
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
