import { NextResponse } from "next/server";
import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireClient();

  const body = await req.json().catch(() => ({}));
  const amountUAH: number = Math.round(Number(body.amount));

  if (!Number.isFinite(amountUAH) || amountUAH <= 0) {
    return NextResponse.json({ error: "invalid amount" }, { status: 400 });
  }

  const token = process.env.MONO_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "payment not configured" }, { status: 503 });
  }

  // Always use HTTPS — on Vercel internal requests arrive as http://
  const reqUrl = new URL(req.url);
  const host = reqUrl.host;
  const baseUrl = (
    process.env.NEXTAUTH_URL?.trim().replace(/\/$/, "") ??
    `https://${host}`
  );

  // Fetch client full name + their configured prices + invoice template.
  const [dbUser, cfg, pendingPayments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { firstName: true, lastName: true, pricePer10: true, priceMonthly: true, pricePerSession: true },
    }),
    (prisma as any).siteConfig.findUnique({ where: { id: "main" } }).catch(() => null),
    prisma.payment.findMany({
      where: { clientId: user.id, status: { in: ["pending", "overdue"] } },
      select: { amount: true },
    }),
  ]);

  // SECURITY: never trust a client-supplied amount. It must match one of the
  // prices the trainer configured for THIS client, or the exact amount of a
  // pending invoice. Otherwise a client could pay 1₴ for a 5000₴ package.
  const allowedAmounts = new Set<number>();
  if (dbUser?.pricePer10) allowedAmounts.add(Math.round(dbUser.pricePer10));
  if (dbUser?.priceMonthly) allowedAmounts.add(Math.round(dbUser.priceMonthly));
  if (dbUser?.pricePerSession) allowedAmounts.add(Math.round(dbUser.pricePerSession));
  for (const p of pendingPayments) allowedAmounts.add(Math.round(p.amount));
  if (!allowedAmounts.has(amountUAH)) {
    return NextResponse.json({ error: "Сума не відповідає вашому тарифу" }, { status: 403 });
  }

  const amountKopecks = Math.round(amountUAH * 100);
  const clientName = dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : user.name;

  // Apply template substitutions: {client} {amount}
  const template: string = (cfg?.paymentDescription?.trim()) || "Пакет 10 тренувань · {client}";
  const description = template
    .replace(/\{client\}/gi, clientName)
    .replace(/\{amount\}/gi, `${amountUAH.toLocaleString("uk-UA")} ₴`);

  const reference = `kovalfit-${user.id}-${Date.now()}`;

  const payload = {
    amount: amountKopecks,
    ccy: 980,
    merchantPaymInfo: {
      reference,
      destination: description,
      comment: `Клієнт: ${clientName}`,
      basketOrder: [
        {
          name: description,
          qty: 1,
          sum: amountKopecks,
          unit: "шт.",
        },
      ],
    },
    redirectUrl: `${baseUrl}/dashboard/payments`,
    webHookUrl: `${baseUrl}/api/mono/webhook`,
    validity: 3600, // 1 hour
    paymentType: "debit",
  };


  const monoRes = await fetch(
    "https://api.monobank.ua/api/merchant/invoice/create",
    {
      method: "POST",
      headers: {
        "X-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!monoRes.ok) {
    const err = await monoRes.text();
    console.error("Mono invoice error:", monoRes.status, err);
    return NextResponse.json({
      error: `Mono ${monoRes.status}: ${err}`,
      debug: { redirectUrl: payload.redirectUrl, webHookUrl: payload.webHookUrl },
    }, { status: 502 });
  }

  const data = await monoRes.json();
  // data = { invoiceId: "...", pageUrl: "https://pay.mbnk.biz/..." }

  // Attach the Mono invoiceId to the pending Payment row so the webhook (and
  // the page-load sync) can find it deterministically. If there is no pending
  // row for this amount yet, leave it — the webhook fallback still works by
  // amount matching, and a pending row may exist with a slightly different
  // amount (e.g. a discount).
  try {
    const tag = `Mono:${data.invoiceId}`;
    const pending = await prisma.payment.findFirst({
      where: {
        clientId: user.id,
        amount: amountUAH,
        status: { in: ["pending", "overdue"] },
      },
      orderBy: { date: "asc" },
    });
    if (pending && !(pending.notes ?? "").includes(data.invoiceId)) {
      await prisma.payment.update({
        where: { id: pending.id },
        data: { notes: pending.notes ? `${pending.notes} · ${tag}` : tag },
      });
    }
  } catch (e) {
    console.error("attach invoiceId to pending payment failed:", e);
  }

  return NextResponse.json({ pageUrl: data.pageUrl, invoiceId: data.invoiceId });
}
