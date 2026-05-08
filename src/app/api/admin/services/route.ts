import { NextResponse } from "next/server";
import { requireTrainer } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  await requireTrainer();
  const body = await req.json();
  const s = await (prisma as any).service.create({ data: body });
  return NextResponse.json(s);
}

export async function PATCH(req: Request) {
  await requireTrainer();
  const { id, ...data } = await req.json();
  const s = await (prisma as any).service.update({ where: { id }, data });
  return NextResponse.json(s);
}

export async function DELETE(req: Request) {
  await requireTrainer();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await (prisma as any).service.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
