"use server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { notifyAllTrainers } from "@/lib/telegram";

export async function cancelSessionByClient(sessionId: string, reason: string) {
  const u = await requireClient();
  const s = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
  if (!s || s.clientId !== u.id) throw new Error("Тренування не знайдено");

  // Late cancel rule: less than 8h before scheduledAt → session is "burned" (counts as completed)
  const scheduled = s.scheduledAt ? new Date(s.scheduledAt).getTime() : null;
  const hoursTillStart = scheduled ? (scheduled - Date.now()) / 3_600_000 : Infinity;
  const isLate = hoursTillStart < 8 && hoursTillStart > -2; // менше 8 годин до старту
  const finalReason = (reason || "Без причини") + (isLate ? " (пізнє скасування — тренування списано в облік)" : "");

  await prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      cancelledAt: new Date(),
      cancelledBy: "CLIENT",
      cancelReason: finalReason,
      // burn the session — counts toward total/milestone:
      completed: isLate ? true : s.completed,
      confirmedByTrainer: isLate ? true : s.confirmedByTrainer,
    },
  });

  // milestone trigger if late-cancel just brought it to a multiple of 10
  if (isLate) {
    const total = await prisma.workoutSession.count({
      where: { clientId: u.id, OR: [{ completed: true }, { confirmedByTrainer: true }] },
    });
    if (total > 0 && total % 10 === 0) {
      const user = await prisma.user.findUnique({ where: { id: u.id } });
      const amount = user?.pricePer10 ?? null;
      if (amount && amount > 0) {
        await prisma.payment.create({
          data: { clientId: u.id, amount, currency: "UAH", date: new Date(), status: "pending", notes: `Пакет №${Math.floor(total/10)} · 10 тренувань (авто)` },
        });
      }
      await prisma.reminder.create({
        data: { clientId: u.id, title: `🎉 ${total} тренувань! Час оплати${amount ? ` (${amount} ₴)` : ""}.`, type: "payment", datetime: new Date(), done: false },
      });
    }
  }
  // Notification to trainer is implicit — visible on /admin/sessions in cancelled section + admin home activity feed.
  // We also create a Reminder on the client (so they have a record); trainer sees in cancelled section.
  const when = s.scheduledAt ? new Date(s.scheduledAt).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" }) : "";
  await prisma.reminder.create({
    data: {
      clientId: u.id,
      title: `❌ Ви скасували тренування «${s.title}»${when ? ` на ${when}` : ""} — ${finalReason}`,
      type: "cancel",
      datetime: new Date(),
      done: false,
    },
  });
  const lateNote = isLate ? "\n⚠️ Пізнє скасування — тренування списано в облік." : "";
  notifyAllTrainers(`❌ <b>Клієнт ${u.name} скасував тренування</b>\n\n«${s.title}»\n🕐 ${when}\n💬 ${reason || "Без причини"}${lateNote}`).catch(()=>{});
  revalidatePath("/dashboard/sessions");
  revalidatePath("/dashboard/workout");
  revalidatePath("/dashboard");
  revalidatePath("/admin/sessions");
  revalidatePath("/admin");
}
