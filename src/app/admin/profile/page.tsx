import { requireTrainer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { TelegramConnect } from "@/components/TelegramConnect";

export default async function TrainerProfile() {
  const u = await requireTrainer();
  const user = await prisma.user.findUnique({ where: { id: u.id } });
  if (!user) return null;
  return (
    <div className="max-w-2xl">
      <PageHeader title="Мій профіль" />
      <div className="card p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl accent-shine flex items-center justify-center text-white text-3xl font-black">
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

      <div className="card p-5 mt-4 text-sm text-muted">
        Редагування кабінету тренера — у майбутніх оновленнях. Поки що ти можеш керувати клієнтами через вкладку «Клієнти».
      </div>
    </div>
  );
}
