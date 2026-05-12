import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Vercel Cron hits this hourly. Idempotent — safe to run any number of times.
// Auth: either Vercel adds Authorization: Bearer <CRON_SECRET> header,
// or we accept the request if it came from Vercel's cron infra.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  // Find ONLINE clients whose nextBillingDate has arrived
  const due: any[] = await (prisma as any).user.findMany({
    where: {
      role: "CLIENT",
      coachingPlan: "ONLINE",
      nextBillingDate: { lte: now },
      priceMonthly: { not: null },
    },
  });

  const created: string[] = [];
  for (const u of due) {
    const amount = u.priceMonthly as number;
    if (!amount || amount <= 0) continue;

    // Create the pending payment for this billing period
    const billingDate = new Date(u.nextBillingDate);
    const monthLabel = billingDate.toLocaleDateString("uk-UA", { month: "long", year: "numeric" });

    try {
      await prisma.payment.create({
        data: {
          clientId: u.id,
          amount,
          currency: "UAH",
          date: billingDate,
          status: "pending",
          notes: `Місячна підписка · ${monthLabel} (авто)`,
        },
      });

      // Advance the next billing date by 30 days
      const newNext = new Date(billingDate.getTime() + 30 * 86400_000);
      await (prisma as any).user.update({
        where: { id: u.id },
        data: { nextBillingDate: newNext },
      });

      // Notify the client via Telegram
      notifyUser(u.id, "payments",
        `💳 <b>Рахунок за ${monthLabel}</b>\n<b>${amount.toLocaleString("uk-UA")} ₴</b> — щомісячна підписка.\nДеталі у вкладці «Оплати».`
      ).catch(() => {});

      created.push(`${u.firstName} ${u.lastName} → ${amount} ₴ (${monthLabel})`);
    } catch (e) {
      console.error(`monthly-invoices: failed for client ${u.id}`, e);
    }
  }

  return NextResponse.json({
    ok: true,
    checked: due.length,
    created: created.length,
    items: created,
    ranAt: now.toISOString(),
  });
}

// Allow POST too for manual triggering from admin
export async function POST(req: Request) {
  return GET(req);
}
