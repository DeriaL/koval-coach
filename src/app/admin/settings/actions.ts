"use server";
import { requireTrainer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveSiteConfig(data: {
  phone?: string; email?: string; city?: string;
  instagram?: string; telegram?: string;
  priceOnline?: string; priceOffline?: string; priceNote?: string;
  paymentDescription?: string;
  aboutMe?: string;
}) {
  await requireTrainer();
  await (prisma as any).siteConfig.upsert({
    where: { id: "main" },
    create: { id: "main", ...data },
    update: data,
  });
  revalidatePath("/");
  revalidatePath("/admin/settings");
}

// Manually reset the training counter for all ONLINE clients. Sets a reset
// point = now, so each online client's "Тренувань" count starts from 0 until
// they do new sessions. (Online counts auto-reset on the 1st anyway — this is
// a manual override the trainer can use any time.)
export async function resetOnlineSessions(): Promise<{ count: number }> {
  await requireTrainer();
  const res = await prisma.user.updateMany({
    where: { role: "CLIENT", coachingPlan: "ONLINE" },
    data: { sessionsResetAt: new Date() },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/sessions");
  return { count: res.count };
}
