// Helper to query Mono invoice status and reconcile a pending Payment row.
// Used as a safety net when the webhook didn't fire (Mono retry / network).
import { prisma } from "@/lib/prisma";

const INVOICE_TAG = /Mono:([A-Za-z0-9_-]+)/;

export function extractInvoiceId(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const m = notes.match(INVOICE_TAG);
  return m ? m[1] : null;
}

// Mark a single Payment row as paid in-place.
async function markPaid(paymentId: string, prevNotes: string | null, invoiceId: string) {
  const tag = `Plata by Mono · ${invoiceId}`;
  const newNotes = prevNotes && !prevNotes.includes(invoiceId) ? `${prevNotes} · ${tag}` : (prevNotes ?? tag);
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "paid",
      date: new Date(),
      method: "monobank",
      notes: newNotes,
    },
  });
}

// Ask Mono whether the invoice is paid; if yes, reconcile the matching row.
export async function syncMonoInvoice(invoiceId: string): Promise<"paid" | "still-pending" | "skipped" | "error"> {
  const token = process.env.MONO_TOKEN;
  if (!token) return "skipped";
  try {
    const r = await fetch(
      `https://api.monobank.ua/api/merchant/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`,
      { headers: { "X-Token": token }, cache: "no-store" }
    );
    if (!r.ok) return "error";
    const data = await r.json();
    if (data.status !== "success") return "still-pending";

    const row = await prisma.payment.findFirst({
      where: { notes: { contains: invoiceId } },
    });
    if (!row) return "skipped";
    if (row.status === "paid") return "paid";

    await markPaid(row.id, row.notes, invoiceId);
    return "paid";
  } catch {
    return "error";
  }
}

// Reconcile every still-pending payment of a client that has an invoiceId tag.
export async function syncClientPendingPayments(clientId: string): Promise<number> {
  const pending = await prisma.payment.findMany({
    where: {
      clientId,
      status: { in: ["pending", "overdue"] },
      notes: { contains: "Mono:" },
    },
  });
  let updated = 0;
  for (const p of pending) {
    const id = extractInvoiceId(p.notes);
    if (!id) continue;
    const result = await syncMonoInvoice(id);
    if (result === "paid") updated++;
  }
  return updated;
}
