"use server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/session";
import { revalidatePath } from "next/cache";

function num(v: any) { if (v === "" || v == null) return null; const n = Number(v); return Number.isNaN(n) ? null : n; }

export async function saveOwnMeasurement(data: {
  date: string;
  weight?: any; chest?: any; waist?: any; hips?: any; arm?: any; leg?: any; bodyFat?: any; notes?: string;
}) {
  const u = await requireClient();
  await prisma.measurement.create({
    data: {
      clientId: u.id,
      date: new Date(data.date),
      weight: num(data.weight),
      chest: num(data.chest),
      waist: num(data.waist),
      hips: num(data.hips),
      arm: num(data.arm),
      leg: num(data.leg),
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
