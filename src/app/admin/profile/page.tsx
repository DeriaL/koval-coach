import { requireTrainer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { TelegramConnect } from "@/components/TelegramConnect";
import { AvatarUpload } from "@/components/AvatarUpload";
import { AccountSettings } from "./AccountSettings";
import Link from "next/link";
import { Wallet, ArrowRight, Settings as Cog } from "lucide-react";

export default async function TrainerProfile() {
  const u = await requireTrainer();
  const user = await prisma.user.findUnique({ where: { id: u.id } });
  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Мій профіль" />
      <div className="card p-4 md:p-6 flex items-center gap-4 md:gap-5">
        <div className="shrink-0">
          <AvatarUpload
            initialUrl={user.avatarUrl}
            initials={`${user.firstName[0]}${user.lastName[0]}`}
            size={80}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xl md:text-2xl font-bold truncate">{user.firstName} {user.lastName}</div>
          <div className="text-muted text-sm truncate">{user.email}</div>
          <div className="text-muted text-sm mt-1 truncate">{user.phone ?? "—"}</div>
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

      <Link href="/admin/settings" className="card p-4 mt-4 flex items-center gap-3 hover:border-accent/40 transition group">
        <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center"><Cog className="w-4 h-4" /></div>
        <div className="flex-1">
          <div className="font-medium text-sm">Налаштування сайту</div>
          <div className="text-xs text-muted">«Про мене», контакти, послуги, ціни — для лендингу</div>
        </div>
        <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent group-hover:translate-x-1 transition" />
      </Link>

      <div className="mt-4">
        <AccountSettings
          user={{
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone ?? "",
          }}
        />
      </div>
    </div>
  );
}
