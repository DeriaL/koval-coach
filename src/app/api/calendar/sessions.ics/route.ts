import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { buildICS } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  const scope = url.searchParams.get("scope") || (role === "TRAINER" ? "all" : "mine");

  const where: any = {
    scheduledAt: { gte: new Date(Date.now() - 30 * 86400000) }, // last 30 days + future
  };
  if (role === "CLIENT" || scope === "mine") {
    where.clientId = userId;
  } else {
    where.client = { role: "CLIENT" };
  }

  const clientIdParam = url.searchParams.get("clientId");
  if (clientIdParam && role === "TRAINER") where.clientId = clientIdParam;

  const sessions = await prisma.workoutSession.findMany({
    where,
    include: { client: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { scheduledAt: "asc" },
  });

  const ics = buildICS(sessions, role === "TRAINER" ? "KovalFit · Тренування" : "KovalFit · Мої тренування");
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="koval-coach-sessions.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
