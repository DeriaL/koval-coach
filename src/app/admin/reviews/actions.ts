"use server";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function approveReview(id: string, approved: boolean) {
  await requireTrainer();
  await (prisma as any).review.update({ where: { id }, data: { approved } });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

export async function deleteReview(id: string) {
  await requireTrainer();
  await (prisma as any).review.delete({ where: { id } });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

export async function addManualReview(data: { authorName: string; rating: number; text: string; approved: boolean }) {
  await requireTrainer();
  const rating = Math.max(1, Math.min(5, Number(data.rating) || 0));
  const name = (data.authorName || "").trim();
  if (!name) throw new Error("Імʼя обовʼязкове");
  if (!rating) throw new Error("Постав оцінку від 1 до 5");
  await (prisma as any).review.create({
    data: {
      authorName: name,
      rating,
      text: (data.text || "").trim() || null,
      approved: !!data.approved,
    },
  });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}
