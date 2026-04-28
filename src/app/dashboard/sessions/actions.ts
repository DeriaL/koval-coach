"use server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { notifyAllTrainers } from "@/lib/telegram";

export async function cancelSessionByClient(sessionId: string, reason: string) {
  const u = await requireClient();
  const s = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
  if (!s || s.clientId !== u.id) throw new Error("Сесія не знайдена");
  await prisma.workoutSession.update({
    where: { id: sessionId },
    data: { cancelledAt: new Date(), cancelledBy: "CLIENT", cancelReason: reason || "Без причини" },
  });
  // Notification to trainer is implicit — visible on /admin/sessions in cancelled section + admin home activity feed.
  // We also create a Reminder on the client (so they have a record); trainer sees in cancelled section.
  const when = s.scheduledAt ? new Date(s.scheduledAt).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" }) : "";
  await prisma.reminder.create({
    data: {
      clientId: u.id,
      title: `❌ Ви скасували тренування «${s.title}»${when ? ` на ${when}` : ""} — ${reason || "без причини"}`,
      type: "cancel",
      datetime: new Date(),
      done: false,
    },
  });
  notifyAllTrainers(`❌ <b>Клієнт ${u.name} скасував тренування</b>\n\n«${s.title}»\n🕐 ${when}\n💬 ${reason || "Без причини"}`).catch(()=>{});
  revalidatePath("/dashboard/sessions");
  revalidatePath("/dashboard/workout");
  revalidatePath("/dashboard");
  revalidatePath("/admin/sessions");
  revalidatePath("/admin");
}
