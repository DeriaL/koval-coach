import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await requireTrainer();
  const body = await req.json().catch(() => null);
  if (!body?.dataUrl || typeof body.dataUrl !== "string") {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }
  if (body.dataUrl.length > 600_000) {
    return NextResponse.json({ error: "Файл задорогий — стискуй до 200KB" }, { status: 413 });
  }
  if (!body.dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "Тільки зображення" }, { status: 400 });
  }
  const client = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, role: true } });
  if (!client || client.role !== "CLIENT") {
    return NextResponse.json({ error: "Клієнт не знайдений" }, { status: 404 });
  }
  await prisma.user.update({ where: { id: params.id }, data: { avatarUrl: body.dataUrl } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await requireTrainer();
  await prisma.user.update({ where: { id: params.id }, data: { avatarUrl: null } });
  return NextResponse.json({ ok: true });
}
