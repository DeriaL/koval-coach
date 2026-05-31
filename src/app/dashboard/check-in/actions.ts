"use server";
import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { kyivStartOfToday } from "@/lib/kyivTime";

export async function saveCheckIn(data: {
  mood: number; energy: number; stress?: number; sleep: number;
  weight: number | null; water: number | null; steps: number | null; notes: string;
}) {
  const u = await requireClient();
  const today = kyivStartOfToday();
  const existing = await prisma.checkIn.findFirst({
    where: { clientId: u.id, date: { gte: today } },
  });
  // `stress` was added later; type-cast to avoid stale Prisma types locally.
  const payload: any = { ...data, date: new Date() };
  if (existing) {
    await (prisma as any).checkIn.update({ where: { id: existing.id }, data: payload });
  } else {
    await (prisma as any).checkIn.create({ data: { ...payload, clientId: u.id } });
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/check-in");
}

export async function quickAddWater(delta: number) {
  const u = await requireClient();
  const today = kyivStartOfToday();
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
  const today = kyivStartOfToday();
  const existing = await prisma.checkIn.findFirst({ where: { clientId: u.id, date: { gte: today } } });
  if (existing) {
    await prisma.checkIn.update({ where: { id: existing.id }, data: { steps: Math.max(0, (existing.steps ?? 0) + delta) } });
  } else {
    await prisma.checkIn.create({ data: { clientId: u.id, date: new Date(), steps: Math.max(0, delta), mood: 0, energy: 0, sleep: 0 } });
  }
  revalidatePath("/dashboard");
}
