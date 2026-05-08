"use server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/session";
import { revalidatePath } from "next/cache";

// Parse a measurement value:
// - empty/null/NaN → null (field not filled)
// - <0.1          → null (silently rejected, can't be negative or zero)
// - rounded to 1 decimal place
function num(v: any): number | null {
  if (v === "" || v == null) return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  if (n < 0.1) return null;
  return Math.round(n * 10) / 10;
}

function buildData(data: Record<string, any>) {
  return {
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
  };
}

export async function saveOwnMeasurement(data: Record<string, any>) {
  const u = await requireClient();
  await prisma.measurement.create({
    data: { clientId: u.id, ...buildData(data) },
  });
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard");
}

export async function updateOwnMeasurement(id: string, data: Record<string, any>) {
  const u = await requireClient();
  const existing = await prisma.measurement.findUnique({ where: { id } });
  if (!existing || existing.clientId !== u.id) {
    throw new Error("Замір не знайдено або немає доступу");
  }
  await prisma.measurement.update({
    where: { id },
    data: buildData(data),
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
