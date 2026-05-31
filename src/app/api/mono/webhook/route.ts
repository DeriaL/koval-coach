import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fetchMonoInvoiceStatus } from "@/lib/monoSync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Mono calls this when an invoice status changes.
//
// SECURITY: a webhook body is UNAUTHENTICATED and trivially forgeable — anyone
// who knows this URL could POST {status:"success", reference:"kovalfit-<id>-…"}
// and mark an invoice paid without paying. So we NEVER trust the body's status
// or amount. We take only the invoiceId from it (a notification "ping") and
// re-fetch the authoritative status from Mono's API using our merchant token.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  const invoiceId = typeof body.invoiceId === "string" ? body.invoiceId : "";
  if (!invoiceId || !/^[\w-]+$/.test(invoiceId)) return NextResponse.json({ ok: true });

  // ── Authoritative verification ──
  const verified = await fetchMonoInvoiceStatus(invoiceId);
  if (!verified.ok || verified.status !== "success") {
    // Forged ping, or invoice not actually paid → ignore silently.
    return NextResponse.json({ ok: true });
  }

  // Use the VERIFIED reference/amount from Mono, not the request body.
  const reference = verified.reference ?? "";
  const match = reference.match(/^kovalfit-(.+?)-\d+$/);
  if (!match) return NextResponse.json({ ok: true });
  const clientId = match[1];

  try {
    const user = await prisma.user.findUnique({ where: { id: clientId } });
    if (!user) return NextResponse.json({ ok: true });

    const amountUAH = Math.round((verified.amount ?? 0) / 100);
    const notesText = `Plata by Mono · ${invoiceId}`;
    const currency = verified.ccy === 980 ? "UAH" : String(verified.ccy ?? "UAH");

    // 1) Look up by invoiceId first — checkout attaches "Mono:<invoiceId>" to
    //    the pending Payment row, so this is the most reliable match.
    const byInvoice = await prisma.payment.findFirst({
      where: { clientId, notes: { contains: invoiceId } },
    });

    if (byInvoice) {
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
      // 2) Fallback: match an existing pending invoice by amount, oldest first.
      const pending = await prisma.payment.findFirst({
        where: { clientId, amount: amountUAH, status: { in: ["pending", "overdue"] } },
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
        // 3) Nothing pending — record ad-hoc paid row (verified amount).
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

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/payments");
    revalidatePath(`/admin/clients/${clientId}`);
    revalidatePath("/admin/finance");
  } catch (e) {
    console.error("Webhook payment update error:", e);
  }

  return NextResponse.json({ ok: true });
}
