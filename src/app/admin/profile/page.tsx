import { requireTrainer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { TelegramConnect } from "@/components/TelegramConnect";
import Link from "next/link";
import { Wallet, ArrowRight } from "lucide-react";

export default async function TrainerProfile() {
  const u = await requireTrainer();
  const user = await prisma.user.findUnique({ where: { id: u.id } });
  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Мій профіль" />
      <div className="card p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl accent-shine flex items-center justify-center text-white text-3xl font-black shrink-0">
          {user.firstName[0]}{user.lastName[0]}
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold">{user.firstName} {user.lastName}</div>
          <div className="text-muted truncate">{user.email}</div>
          <div className="text-muted text-sm mt-1">{user.phone ?? "—"}</div>
        </div>
      </div>

      <div className="mt-4">
        <TelegramConnect initialLinked={!!user.telegramChatId} initialUsername={user.telegramUsername} />
      </div>

      <Link href="/admin/finance" className="card p-4 mt-4 flex items-center gap-3 hover:border-accent/40 transition group">
        <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><Wallet className="w-4 h-4" /></div>
        <div className="flex-1">
          <div className="font-medium text-sm">Фінансовий облік</div>
          <div className="text-xs text-muted">Дохід, витрати, рентабельність — окремий розділ</div>
        </div>
        <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent group-hover:translate-x-1 transition" />
      </Link>

      <div className="card p-5 mt-4 text-sm text-muted">
        Редагування кабінету тренера — у майбутніх оновленнях. Поки що ти можеш керувати клієнтами через вкладку «Клієнти».
      </div>
    </div>
  );
}
