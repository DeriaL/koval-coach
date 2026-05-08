import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Mono calls this when invoice status changes
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  const { invoiceId, status, reference, amount, ccy } = body;

  // Only handle successful payments
  if (status !== "success") {
    return NextResponse.json({ ok: true });
  }

  // reference format: "kovalfit-{userId}-{timestamp}"
  const match = (reference as string)?.match(/^kovalfit-(.+?)-\d+$/);
  if (!match) return NextResponse.json({ ok: true });

  const clientId = match[1];

  try {
    // Check client exists
    const user = await prisma.user.findUnique({ where: { id: clientId } });
    if (!user) return NextResponse.json({ ok: true });

    const amountUAH = Math.round(amount / 100);

    await prisma.payment.create({
      data: {
        clientId,
        amount: amountUAH,
        currency: ccy === 980 ? "UAH" : String(ccy),
        date: new Date(),
        method: "monobank",
        status: "paid",
        notes: `Plata by Mono · ${invoiceId}`,
      },
    });
  } catch (e) {
    console.error("Webhook payment create error:", e);
  }

  return NextResponse.json({ ok: true });
}
