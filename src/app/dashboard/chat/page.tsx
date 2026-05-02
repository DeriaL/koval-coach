import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ChatThread } from "@/components/ChatThread";

export default async function ChatPage() {
  const u = await requireClient();
  const messages = await prisma.message.findMany({ where: { clientId: u.id }, orderBy: { createdAt: "asc" } });
  return (
    <div>
      <PageHeader title="Прямий чат" subtitle="Пиши мені, якщо щось незрозуміло" />
      <ChatThread clientId={u.id} meRole="CLIENT" initial={messages.map(m => ({ ...m, createdAt: m.createdAt.toISOString() }))} />
    </div>
  );
}
