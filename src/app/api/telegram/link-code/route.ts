import { NextResponse } from "next/server";
import { getOrCreateLinkCode, botUsername } from "@/lib/telegram";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const u = await requireUser();
  const code = await getOrCreateLinkCode(u.id);
  return NextResponse.json({ code, botUsername: botUsername() });
}

export async function DELETE() {
  const u = await requireUser();
  await prisma.user.update({ where: { id: u.id }, data: { telegramChatId: null, telegramUsername: null, telegramLinkCode: null } });
  return NextResponse.json({ ok: true });
}
