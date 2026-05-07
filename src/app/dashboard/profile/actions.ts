"use server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: true } | { error: string }> {
  const u = await requireClient();
  const user = await prisma.user.findUnique({ where: { id: u.id } });
  if (!user) return { error: "Користувача не знайдено" };

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return { error: "Поточний пароль невірний" };

  if (newPassword.length < 6) return { error: "Новий пароль має бути не менше 6 символів" };

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: u.id }, data: { password: hash } });
  return { success: true };
}
