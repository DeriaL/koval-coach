"use server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { notifyAllTrainers, notifyUser, tgEscape } from "@/lib/telegram";
import { parseKyivDate } from "@/lib/kyivTime";

// Create a lab-result entry. Clients add for themselves; trainers add for a
// specific client (clientId).
export async function createLabResult(data: {
  clientId?: string;
  title?: string;
  date?: string;
  fileUrl: string;
  fileType?: string;
  note?: string;
}) {
  const u = await requireUser();
  const clientId = u.role === "TRAINER" && data.clientId ? data.clientId : u.id;
  if (!data.fileUrl) return { ok: false, error: "Спочатку завантаж файл" };

  const isTrainer = u.role === "TRAINER";
  const created = await prisma.labResult.create({
    data: {
      clientId,
      title: (data.title || "").trim() || "Аналізи",
      date: parseKyivDate(data.date) ?? new Date(),
      fileUrl: data.fileUrl,
      fileType: data.fileType === "image" ? "image" : "pdf",
      uploadedBy: isTrainer ? "TRAINER" : "CLIENT",
      clientNote: !isTrainer ? ((data.note || "").trim() || null) : null,
      trainerNote: isTrainer ? ((data.note || "").trim() || null) : null,
    },
    include: { client: { select: { firstName: true, lastName: true } } },
  });

  if (!isTrainer) {
    notifyAllTrainers(
      `🧪 <b>${tgEscape(created.client.firstName)} ${tgEscape(created.client.lastName)}</b> додав(ла) аналізи\n«${tgEscape(created.title)}»`
    ).catch(() => {});
  } else {
    notifyUser(clientId, "updates", `🧪 <b>Я додав твої аналізи</b>\n«${tgEscape(created.title)}»\nГлянь у розділі «Аналізи».`).catch(() => {});
  }

  revalidatePath("/dashboard/analyses");
  revalidatePath(`/admin/clients/${clientId}`);
  return { ok: true, id: created.id };
}

// Update the note of the calling role (client edits clientNote, trainer edits trainerNote).
export async function updateLabNote(id: string, note: string) {
  const u = await requireUser();
  const row = await prisma.labResult.findUnique({ where: { id }, select: { clientId: true } });
  if (!row) return { ok: false, error: "Не знайдено" };
  if (u.role !== "TRAINER" && row.clientId !== u.id) return { ok: false, error: "Немає доступу" };

  const text = (note || "").trim() || null;
  await prisma.labResult.update({
    where: { id },
    data: u.role === "TRAINER" ? { trainerNote: text } : { clientNote: text },
  });
  revalidatePath("/dashboard/analyses");
  revalidatePath(`/admin/clients/${row.clientId}`);
  return { ok: true };
}

export async function deleteLabResult(id: string) {
  const u = await requireUser();
  const row = await prisma.labResult.findUnique({ where: { id }, select: { clientId: true } });
  if (!row) return { ok: false, error: "Не знайдено" };
  // Clients may delete their own; trainers may delete any.
  if (u.role !== "TRAINER" && row.clientId !== u.id) return { ok: false, error: "Немає доступу" };
  await prisma.labResult.delete({ where: { id } });
  revalidatePath("/dashboard/analyses");
  revalidatePath(`/admin/clients/${row.clientId}`);
  return { ok: true };
}
