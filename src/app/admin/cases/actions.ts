"use server";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/session";
import { revalidatePath } from "next/cache";

function revalidate() {
  revalidatePath("/admin/cases");
  revalidatePath("/");
}

export async function createCase(data: { imageUrl: string; caption: string; tag?: string }) {
  await requireTrainer();
  const imageUrl = (data.imageUrl || "").trim();
  const caption = (data.caption || "").trim();
  if (!imageUrl) throw new Error("Спочатку завантаж фото");
  if (!caption) throw new Error("Додай підпис");
  // New case goes to the end.
  const last = await (prisma as any).caseStudy.findFirst({ orderBy: { order: "desc" } });
  await (prisma as any).caseStudy.create({
    data: {
      imageUrl,
      caption,
      tag: (data.tag || "").trim() || null,
      order: (last?.order ?? -1) + 1,
    },
  });
  revalidate();
}

export async function updateCase(id: string, data: { caption: string; tag?: string }) {
  await requireTrainer();
  const caption = (data.caption || "").trim();
  if (!caption) throw new Error("Підпис не може бути порожнім");
  await (prisma as any).caseStudy.update({
    where: { id },
    data: { caption, tag: (data.tag || "").trim() || null },
  });
  revalidate();
}

export async function toggleCase(id: string, published: boolean) {
  await requireTrainer();
  await (prisma as any).caseStudy.update({ where: { id }, data: { published } });
  revalidate();
}

export async function deleteCase(id: string) {
  await requireTrainer();
  await (prisma as any).caseStudy.delete({ where: { id } });
  revalidate();
}

// Move a case up/down by swapping `order` with its neighbour.
export async function moveCase(id: string, dir: "up" | "down") {
  await requireTrainer();
  const all: any[] = await (prisma as any).caseStudy.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return;
  const swapWith = dir === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= all.length) return;
  const a = all[idx], b = all[swapWith];
  await prisma.$transaction([
    (prisma as any).caseStudy.update({ where: { id: a.id }, data: { order: b.order } }),
    (prisma as any).caseStudy.update({ where: { id: b.id }, data: { order: a.order } }),
  ]);
  revalidate();
}
