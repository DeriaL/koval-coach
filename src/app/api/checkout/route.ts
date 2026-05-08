import { NextResponse } from "next/server";
import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireClient();

  const body = await req.json().catch(() => ({}));
  const amountUAH: number = body.amount; // e.g. 5000

  if (!amountUAH || amountUAH <= 0) {
    return NextResponse.json({ error: "invalid amount" }, { status: 400 });
  }

  const token = process.env.MONO_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "payment not configured" }, { status: 503 });
  }

  // Always use HTTPS — on Vercel internal requests arrive as http://
  const reqUrl = new URL(req.url);
  const host = reqUrl.host;
  const baseUrl =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
    `https://${host}`;
  const amountKopecks = Math.round(amountUAH * 100);

  // Fetch client full name
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { firstName: true, lastName: true },
  });
  const clientName = dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : user.name;

  const reference = `kovalfit-${user.id}-${Date.now()}`;

  const payload = {
    amount: amountKopecks,
    ccy: 980,
    merchantPaymInfo: {
      reference,
      destination: "Пакет 10 тренувань KovalFit",
      comment: `Клієнт: ${clientName}`,
      basketOrder: [
        {
          name: "Пакет 10 тренувань",
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

  console.log("Mono payload:", JSON.stringify({ redirectUrl: payload.redirectUrl, webHookUrl: payload.webHookUrl, amount: payload.amount }));

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
    return NextResponse.json({ error: `Mono ${monoRes.status}: ${err}` }, { status: 502 });
  }

  const data = await monoRes.json();
  // data = { invoiceId: "...", pageUrl: "https://pay.mbnk.biz/..." }
  return NextResponse.json({ pageUrl: data.pageUrl, invoiceId: data.invoiceId });
}
