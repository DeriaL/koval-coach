import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { User, Mail, Phone, Calendar, Target, Ruler, Scale, StickyNote } from "lucide-react";
import { TelegramConnect } from "@/components/TelegramConnect";
import { AvatarUpload } from "@/components/AvatarUpload";

export default async function ProfilePage() {
  const u = await requireClient();
  const user = await prisma.user.findUnique({ where: { id: u.id } });
  if (!user) return null;

  const row = (icon: any, label: string, value?: string | null) => {
    const Icon = icon;
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border">
        <Icon className="w-4 h-4 text-accent" />
        <div className="flex-1">
          <div className="text-xs text-muted uppercase tracking-wider">{label}</div>
          <div className="font-medium">{value || "—"}</div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Мій профіль" subtitle="Дані, які я веду по тобі" />

      <div className="card p-6 flex items-center gap-5">
        <AvatarUpload
          initialUrl={user.avatarUrl}
          initials={`${user.firstName[0]}${user.lastName[0]}`}
          size={80}
        />
        <div>
          <div className="text-2xl font-bold">{user.firstName} {user.lastName}</div>
          <div className="text-muted">Клієнт з {user.createdAt.toLocaleDateString("uk-UA")}</div>
        </div>
      </div>

      <div className="mt-6">
        <TelegramConnect initialLinked={!!user.telegramChatId} initialUsername={user.telegramUsername} />
      </div>

      <div className="grid md:grid-cols-2 gap-3 mt-4">
        {row(Mail, "Email", user.email)}
        {row(Phone, "Телефон", user.phone)}
        {row(Calendar, "День народження", user.birthday?.toLocaleDateString("uk-UA"))}
        {row(Target, "Ціль", user.goal)}
        {row(Ruler, "Зріст", user.height ? `${user.height} см` : null)}
        {row(Scale, "Стартова вага", user.startWeight ? `${user.startWeight} кг` : null)}
      </div>

      {user.notes && (
        <div className="card p-5 mt-6">
          <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-wider">
            <StickyNote className="w-4 h-4" /> Мої нотатки
          </div>
          <div className="mt-2 whitespace-pre-wrap">{user.notes}</div>
        </div>
      )}

      <div className="mt-6 text-sm text-muted">
        Щоб змінити дані, напиши мені у чат.
      </div>
    </div>
  );
}
