import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
    const user = await prisma.user.findUnique({ where: { id: clientId } });
    if (!user) return NextResponse.json({ ok: true });

    const amountUAH = Math.round(amount / 100);
    const notesText = `Plata by Mono · ${invoiceId}`;
    const currency = ccy === 980 ? "UAH" : String(ccy);

    // 1) Look up by invoiceId first — checkout attaches "Mono:<invoiceId>" to
    //    the pending Payment row, so this is the most reliable match.
    const byInvoice = await prisma.payment.findFirst({
      where: { clientId, notes: { contains: invoiceId } },
    });

    if (byInvoice) {
      // Already marked paid → noop (Mono retries the webhook).
      if (byInvoice.status === "paid") {
        return NextResponse.json({ ok: true, dedup: true });
      }
      await prisma.payment.update({
        where: { id: byInvoice.id },
        data: {
          status: "paid",
          date: new Date(),
          method: "monobank",
          currency,
          notes: byInvoice.notes && !byInvoice.notes.includes(notesText)
            ? `${byInvoice.notes} · ${notesText}`
            : (byInvoice.notes ?? notesText),
        },
      });
    } else {
      // 2) Fallback: no row carries this invoiceId yet (e.g. old payment created
      //    before checkout could attach the tag). Match by amount, oldest first.
      const pending = await prisma.payment.findFirst({
        where: {
          clientId,
          amount: amountUAH,
          status: { in: ["pending", "overdue"] },
        },
        orderBy: { date: "asc" },
      });

      if (pending) {
        await prisma.payment.update({
          where: { id: pending.id },
          data: {
            status: "paid",
            date: new Date(),
            method: "monobank",
            currency,
            notes: pending.notes ? `${pending.notes} · ${notesText}` : notesText,
          },
        });
      } else {
        // 3) Nothing pending — record ad-hoc paid row.
        await prisma.payment.create({
          data: {
            clientId,
            amount: amountUAH,
            currency,
            date: new Date(),
            method: "monobank",
            status: "paid",
            notes: notesText,
          },
        });
      }
    }

    // Refresh client + admin views so the UI no longer shows "pending".
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/payments");
    revalidatePath(`/admin/clients/${clientId}`);
    revalidatePath("/admin/finance");
  } catch (e) {
    console.error("Webhook payment update error:", e);
  }

  return NextResponse.json({ ok: true });
}
