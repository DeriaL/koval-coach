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

  // Backfill nextBillingDate for ONLINE clients who never had one set —
  // otherwise the cron never fires for them.
  await (prisma as any).user.updateMany({
    where: {
      role: "CLIENT",
      coachingPlan: "ONLINE",
      priceMonthly: { not: null },
      nextBillingDate: null,
    },
    data: { nextBillingDate: now },
  }).catch((e: any) => console.error("backfill nextBillingDate failed", e));

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
      // Idempotency: don't double-invoice for the same period (cron runs hourly).
      const alreadyForThisPeriod = await prisma.payment.findFirst({
        where: {
          clientId: u.id,
          notes: { contains: `Місячна підписка · ${monthLabel}` },
        },
        select: { id: true },
      });
      if (alreadyForThisPeriod) {
        // Just advance billing date and skip — payment already exists.
        const newNext = new Date(billingDate.getTime() + 30 * 86400_000);
        await (prisma as any).user.update({
          where: { id: u.id },
          data: { nextBillingDate: newNext },
        });
        continue;
      }

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

      // In-app reminder so the bell shows on the dashboard even if Telegram
      // isn't linked or notifications are off.
      await prisma.reminder.create({
        data: {
          clientId: u.id,
          title: `💳 Рахунок за ${monthLabel} — ${amount.toLocaleString("uk-UA")} ₴`,
          type: "payment",
          datetime: now,
          done: false,
        },
      }).catch(() => {});

      // Advance the next billing date by 30 days
      const newNext = new Date(billingDate.getTime() + 30 * 86400_000);
      await (prisma as any).user.update({
        where: { id: u.id },
        data: { nextBillingDate: newNext },
      });

      // Notify the client via Telegram (no-op if not linked)
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
