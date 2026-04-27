"use server";
import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveCheckIn(data: {
  mood: number; energy: number; sleep: number;
  weight: number | null; water: number | null; steps: number | null; notes: string;
}) {
  const u = await requireClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await prisma.checkIn.findFirst({
    where: { clientId: u.id, date: { gte: today } },
  });
  if (existing) {
    await prisma.checkIn.update({ where: { id: existing.id }, data: { ...data, date: new Date() } });
  } else {
    await prisma.checkIn.create({ data: { ...data, clientId: u.id, date: new Date() } });
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/check-in");
}

export async function quickAddWater(delta: number) {
  const u = await requireClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await prisma.checkIn.findFirst({ where: { clientId: u.id, date: { gte: today } } });
  if (existing) {
    await prisma.checkIn.update({ where: { id: existing.id }, data: { water: Math.max(0, (existing.water ?? 0) + delta) } });
  } else {
    await prisma.checkIn.create({ data: { clientId: u.id, date: new Date(), water: Math.max(0, delta), mood: 0, energy: 0, sleep: 0 } });
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/analytics");
}

export async function quickAddSteps(delta: number) {
  const u = await requireClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await prisma.checkIn.findFirst({ where: { clientId: u.id, date: { gte: today } } });
  if (existing) {
    await prisma.checkIn.update({ where: { id: existing.id }, data: { steps: Math.max(0, (existing.steps ?? 0) + delta) } });
  } else {
    await prisma.checkIn.create({ data: { clientId: u.id, date: new Date(), steps: Math.max(0, delta), mood: 0, energy: 0, sleep: 0 } });
  }
  revalidatePath("/dashboard");
}
