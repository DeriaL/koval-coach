"use server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function toggleHabit(habitId: string) {
  const u = await requireClient();
  const habit = await prisma.habit.findFirst({ where: { id: habitId, clientId: u.id } });
  if (!habit) throw new Error("not found");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await prisma.habitLog.findUnique({ where: { habitId_date: { habitId, date: today } } });
  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
  } else {
    await prisma.habitLog.create({ data: { habitId, date: today, done: true } });
  }
  revalidatePath("/dashboard/habits");
  revalidatePath("/dashboard");
}
