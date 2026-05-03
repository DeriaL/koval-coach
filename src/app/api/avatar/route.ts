import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const u = await requireUser();
  const body = await req.json().catch(() => null);
  if (!body?.dataUrl || typeof body.dataUrl !== "string") {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }
  // Limit to ~400KB raw (data URL is base64-encoded so ~30% bigger)
  if (body.dataUrl.length > 600_000) {
    return NextResponse.json({ error: "Файл заделикий — стискуй до 200KB" }, { status: 413 });
  }
  if (!body.dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "Тільки зображення" }, { status: 400 });
  }
  await prisma.user.update({ where: { id: u.id }, data: { avatarUrl: body.dataUrl } });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const u = await requireUser();
  await prisma.user.update({ where: { id: u.id }, data: { avatarUrl: null } });
  return NextResponse.json({ ok: true });
}
