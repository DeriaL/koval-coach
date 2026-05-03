"use server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/session";
import { revalidatePath } from "next/cache";

function num(v: any) { if (v === "" || v == null) return null; const n = Number(v); return Number.isNaN(n) ? null : n; }

export async function saveOwnMeasurement(data: Record<string, any>) {
  const u = await requireClient();
  await prisma.measurement.create({
    data: {
      clientId: u.id,
      date: new Date(data.date),
      weight: num(data.weight),
      chest: num(data.chest),
      waist: num(data.waist),
      hips: num(data.hips),
      shoulders: num(data.shoulders),
      leftArm: num(data.leftArm),
      rightArm: num(data.rightArm),
      leftThigh: num(data.leftThigh),
      rightThigh: num(data.rightThigh),
      leftCalf: num(data.leftCalf),
      rightCalf: num(data.rightCalf),
      bodyFat: num(data.bodyFat),
      notes: data.notes || null,
    },
  });
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard");
}

export async function deleteOwnMeasurement(id: string) {
  const u = await requireClient();
  const m = await prisma.measurement.findUnique({ where: { id } });
  if (!m || m.clientId !== u.id) return;
  await prisma.measurement.delete({ where: { id } });
  revalidatePath("/dashboard/analytics");
}
