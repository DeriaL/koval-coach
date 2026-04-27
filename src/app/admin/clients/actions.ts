"use server";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/session";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function toDate(v: any) { return v ? new Date(v) : null; }
function toNum(v: any) { if (v === "" || v == null) return null; const n = Number(v); return Number.isNaN(n) ? null : n; }
function toInt(v: any) { if (v === "" || v == null) return null; const n = parseInt(v, 10); return Number.isNaN(n) ? null : n; }

export async function createClient(data: Record<string, any>) {
  await requireTrainer();
  const hash = await bcrypt.hash(data.password, 10);
  const u = await prisma.user.create({
    data: {
      email: data.email,
      password: hash,
      role: "CLIENT",
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      birthday: toDate(data.birthday),
      goal: data.goal || null,
      height: toNum(data.height),
      startWeight: toNum(data.startWeight),
      notes: data.notes || null,
      coachingPlan: data.coachingPlan === "ONLINE" ? "ONLINE" : "FULL",
      pricePer10: toNum(data.pricePer10),
    },
  });
  revalidatePath("/admin");
  return u.id;
}

export async function updateClient(id: string, data: Record<string, any>) {
  await requireTrainer();
  await prisma.user.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      birthday: toDate(data.birthday),
      goal: data.goal || null,
      height: toNum(data.height),
      startWeight: toNum(data.startWeight),
      notes: data.notes || null,
      coachingPlan: data.coachingPlan === "ONLINE" ? "ONLINE" : "FULL",
      pricePer10: toNum(data.pricePer10),
    },
  });
  revalidatePath(`/admin/clients/${id}`);
}

export async function resetPassword(id: string, password: string) {
  await requireTrainer();
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { password: hash } });
}

export async function deleteClient(id: string) {
  await requireTrainer();
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin");
  redirect("/admin");
}

// ========= Nutrition =========
export async function saveNutrition(id: string, data: Record<string, any>) {
  await requireTrainer();
  const payload = {
    title: data.title,
    content: data.content,
    notes: data.notes || null,
    calories: toInt(data.calories),
    protein: toInt(data.protein),
    carbs: toInt(data.carbs),
    fats: toInt(data.fats),
  };
  if (data.id) {
    await prisma.nutritionPlan.update({ where: { id: data.id }, data: payload });
  } else {
    await prisma.nutritionPlan.create({ data: { ...payload, clientId: id } });
  }
  revalidatePath(`/admin/clients/${id}`);
}
export async function deleteNutrition(id: string, clientId: string) {
  await requireTrainer();
  await prisma.nutritionPlan.delete({ where: { id } });
  revalidatePath(`/admin/clients/${clientId}`);
}

// ========= Training =========
export async function saveTraining(id: string, data: Record<string, any>) {
  await requireTrainer();
  const payload = {
    title: data.title,
    content: data.content,
    notes: data.notes || null,
    daysPerWeek: toInt(data.daysPerWeek),
  };
  if (data.id) {
    await prisma.trainingPlan.update({ where: { id: data.id }, data: payload });
  } else {
    await prisma.trainingPlan.create({ data: { ...payload, clientId: id } });
  }
  revalidatePath(`/admin/clients/${id}`);
}
export async function deleteTraining(id: string, clientId: string) {
  await requireTrainer();
  await prisma.trainingPlan.delete({ where: { id } });
  revalidatePath(`/admin/clients/${clientId}`);
}

// ========= Supplements =========
export async function saveSupplement(id: string, data: Record<string, any>) {
  await requireTrainer();
  const payload = { name: data.name, dosage: data.dosage || null, schedule: data.schedule || null, notes: data.notes || null };
  if (data.id) {
    await prisma.supplement.update({ where: { id: data.id }, data: payload });
  } else {
    await prisma.supplement.create({ data: { ...payload, clientId: id } });
  }
  revalidatePath(`/admin/clients/${id}`);
}
export async function deleteSupplement(id: string, clientId: string) {
  await requireTrainer();
  await prisma.supplement.delete({ where: { id } });
  revalidatePath(`/admin/clients/${clientId}`);
}

// ========= Payments =========
export async function savePayment(id: string, data: Record<string, any>) {
  await requireTrainer();
  const payload = {
    amount: Number(data.amount),
    currency: data.currency || "UAH",
    date: new Date(data.date),
    method: data.method || null,
    status: data.status || "paid",
    notes: data.notes || null,
  };
  if (data.id) {
    await prisma.payment.update({ where: { id: data.id }, data: payload });
  } else {
    await prisma.payment.create({ data: { ...payload, clientId: id } });
  }
  revalidatePath(`/admin/clients/${id}`);
}
export async function deletePayment(id: string, clientId: string) {
  await requireTrainer();
  await prisma.payment.delete({ where: { id } });
  revalidatePath(`/admin/clients/${clientId}`);
}

// ========= Measurements =========
export async function saveMeasurement(id: string, data: Record<string, any>) {
  await requireTrainer();
  const payload = {
    date: new Date(data.date),
    weight: toNum(data.weight),
    chest: toNum(data.chest),
    waist: toNum(data.waist),
    hips: toNum(data.hips),
    arm: toNum(data.arm),
    leg: toNum(data.leg),
    bodyFat: toNum(data.bodyFat),
    notes: data.notes || null,
  };
  if (data.id) {
    await prisma.measurement.update({ where: { id: data.id }, data: payload });
  } else {
    await prisma.measurement.create({ data: { ...payload, clientId: id } });
  }
  revalidatePath(`/admin/clients/${id}`);
}
export async function deleteMeasurement(id: string, clientId: string) {
  await requireTrainer();
  await prisma.measurement.delete({ where: { id } });
  revalidatePath(`/admin/clients/${clientId}`);
}

// ========= Photos =========
export async function savePhoto(id: string, data: Record<string, any>) {
  await requireTrainer();
  const payload = {
    url: data.url,
    date: new Date(data.date),
    angle: data.angle || null,
    notes: data.notes || null,
  };
  if (data.id) {
    await prisma.progressPhoto.update({ where: { id: data.id }, data: payload });
  } else {
    await prisma.progressPhoto.create({ data: { ...payload, clientId: id } });
  }
  revalidatePath(`/admin/clients/${id}`);
}
export async function deletePhoto(id: string, clientId: string) {
  await requireTrainer();
  await prisma.progressPhoto.delete({ where: { id } });
  revalidatePath(`/admin/clients/${clientId}`);
}

// ========= Achievements =========
export async function saveAchievement(id: string, data: Record<string, any>) {
  await requireTrainer();
  const payload = {
    title: data.title,
    description: data.description || null,
    icon: data.icon || "Trophy",
  };
  if (data.id) {
    await prisma.achievement.update({ where: { id: data.id }, data: payload });
  } else {
    await prisma.achievement.create({ data: { ...payload, clientId: id } });
  }
  revalidatePath(`/admin/clients/${id}`);
}
export async function deleteAchievement(id: string, clientId: string) {
  await requireTrainer();
  await prisma.achievement.delete({ where: { id } });
  revalidatePath(`/admin/clients/${clientId}`);
}

// ========= Exercises =========
export async function saveExercise(clientId: string, data: Record<string, any>) {
  await requireTrainer();
  const payload = {
    name: data.name,
    day: data.day,
    targetSets: toInt(data.targetSets) ?? 3,
    targetReps: data.targetReps || "10",
    restSec: toInt(data.restSec) ?? 90,
    videoUrl: data.videoUrl || null,
    notes: data.notes || null,
    order: toInt(data.order) ?? 0,
  };
  if (data.id) {
    await prisma.exercise.update({ where: { id: data.id }, data: payload });
  } else {
    await prisma.exercise.create({ data: { ...payload, trainingPlanId: data.trainingPlanId } });
  }
  revalidatePath(`/admin/clients/${clientId}`);
}
export async function deleteExercise(id: string, clientId: string) {
  await requireTrainer();
  await prisma.exercise.delete({ where: { id } });
  revalidatePath(`/admin/clients/${clientId}`);
}

// ========= Habits =========
export async function saveHabit(clientId: string, data: Record<string, any>) {
  await requireTrainer();
  const payload = {
    title: data.title,
    icon: data.icon || "Target",
    order: toInt(data.order) ?? 0,
    active: true,
  };
  if (data.id) {
    await prisma.habit.update({ where: { id: data.id }, data: payload });
  } else {
    await prisma.habit.create({ data: { ...payload, clientId } });
  }
  revalidatePath(`/admin/clients/${clientId}`);
}
export async function deleteHabit(id: string, clientId: string) {
  await requireTrainer();
  await prisma.habit.delete({ where: { id } });
  revalidatePath(`/admin/clients/${clientId}`);
}

// ========= Reminders =========
export async function saveReminder(id: string, data: Record<string, any>) {
  await requireTrainer();
  const payload = {
    title: data.title,
    type: data.type || "other",
    datetime: new Date(data.datetime),
    done: false,
  };
  if (data.id) {
    await prisma.reminder.update({ where: { id: data.id }, data: payload });
  } else {
    await prisma.reminder.create({ data: { ...payload, clientId: id } });
  }
  revalidatePath(`/admin/clients/${id}`);
}
export async function deleteReminder(id: string, clientId: string) {
  await requireTrainer();
  await prisma.reminder.delete({ where: { id } });
  revalidatePath(`/admin/clients/${clientId}`);
}
