"use server";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/session";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateTrainerLogin(data: { email?: string; firstName?: string; lastName?: string; phone?: string }) {
  const u = await requireTrainer();
  const email = (data.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Невалідний email" };
  }
  // Make sure new email isn't already used by another user
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== u.id) {
    return { error: "Цей email вже використовується іншим акаунтом" };
  }
  await prisma.user.update({
    where: { id: u.id },
    data: {
      email,
      firstName: (data.firstName ?? "").trim() || undefined,
      lastName: (data.lastName ?? "").trim() || undefined,
      phone: (data.phone ?? "").trim() || null,
    },
  });
  revalidatePath("/admin/profile");
  return { ok: true };
}

export async function updateTrainerPassword(data: { currentPassword: string; newPassword: string }) {
  const u = await requireTrainer();
  const user = await prisma.user.findUnique({ where: { id: u.id } });
  if (!user) return { error: "Користувача не знайдено" };

  const ok = await bcrypt.compare(data.currentPassword, user.password);
  if (!ok) return { error: "Поточний пароль невірний" };

  if (!data.newPassword || data.newPassword.length < 6) {
    return { error: "Новий пароль має бути ≥ 6 символів" };
  }
  const hash = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({ where: { id: u.id }, data: { password: hash } });
  return { ok: true };
}
