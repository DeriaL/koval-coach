"use server";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function addLedgerEntry(data: {
  type: "income" | "expense";
  amount: number | string;
  date: string;
  category?: string;
  notes?: string;
}) {
  const u = await requireTrainer();
  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Невірна сума");
  if (data.type !== "income" && data.type !== "expense") throw new Error("Невірний тип");
  await prisma.ledgerEntry.create({
    data: {
      trainerId: u.id,
      type: data.type,
      amount,
      currency: "UAH",
      date: new Date(data.date),
      category: data.category || null,
      notes: data.notes || null,
    },
  });
  revalidatePath("/admin/profile");
}

export async function deleteLedgerEntry(id: string) {
  const u = await requireTrainer();
  const e = await prisma.ledgerEntry.findUnique({ where: { id } });
  if (!e || e.trainerId !== u.id) return;
  await prisma.ledgerEntry.delete({ where: { id } });
  revalidatePath("/admin/profile");
}
