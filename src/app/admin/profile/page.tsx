import { requireTrainer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { TelegramConnect } from "@/components/TelegramConnect";
import { Ledger } from "./Ledger";
import { Wallet } from "lucide-react";

export default async function TrainerProfile() {
  const u = await requireTrainer();
  const [user, entries] = await Promise.all([
    prisma.user.findUnique({ where: { id: u.id } }),
    prisma.ledgerEntry.findMany({ where: { trainerId: u.id }, orderBy: { date: "desc" } }),
  ]);
  if (!user) return null;

  return (
    <div className="max-w-3xl">
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

      <section className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl accent-shine text-white flex items-center justify-center"><Wallet className="w-4 h-4" /></div>
          <div>
            <h2 className="font-bold text-xl">Фінанси</h2>
            <div className="text-xs text-muted">Дохід, витрати, рентабельність — твій облік</div>
          </div>
        </div>
        <Ledger entries={entries.map(e => ({
          id: e.id, type: e.type, amount: e.amount, currency: e.currency,
          date: e.date.toISOString(), category: e.category, notes: e.notes,
        }))} />
      </section>
    </div>
  );
}
