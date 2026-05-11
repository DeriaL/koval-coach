"use server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { notifyAllTrainers } from "@/lib/telegram";

export async function submitReview(data: { rating: number; text: string }) {
  const u = await requireClient();
  const rating = Math.max(1, Math.min(5, Number(data.rating) || 0));
  if (!rating) throw new Error("Постав оцінку від 1 до 5");

  // Fetch full name
  const dbUser = await prisma.user.findUnique({
    where: { id: u.id },
    select: { firstName: true, lastName: true },
  });
  const authorName = dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : (u.name ?? "Клієнт");

  await (prisma as any).review.create({
    data: {
      clientId: u.id,
      authorName,
      rating,
      text: (data.text || "").trim() || null,
      approved: false, // moderation required
    },
  });

  notifyAllTrainers(`⭐ <b>Новий відгук від ${authorName}</b>\nОцінка: ${"⭐".repeat(rating)}${data.text ? `\n«${data.text}»` : ""}`).catch(() => {});

  revalidatePath("/dashboard/reviews");
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}
