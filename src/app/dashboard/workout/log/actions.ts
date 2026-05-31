"use server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { notifyAllTrainers, tgEscape } from "@/lib/telegram";

type SetInput = { weight: string | number | null; reps: string | number | null };
type ExerciseInput = { name: string; sets: SetInput[] };

export async function logManualWorkout(data: {
  clientId?: string;          // trainer can target a specific client; ignored for clients
  title: string;
  durationSec?: number | null;
  notes?: string;
  exercises: ExerciseInput[];
}) {
  const u = await requireUser();

  // Resolve target client. Clients can only log for themselves.
  let clientId: string;
  if (u.role === "TRAINER" && data.clientId) {
    clientId = data.clientId;
  } else {
    clientId = u.id;
  }

  const title = (data.title || "").trim() || "Тренування";
  const notes = (data.notes || "").trim() || null;
  const durationSec = data.durationSec && data.durationSec > 0 ? Math.round(data.durationSec) : null;

  // Build flat array of SessionSet rows.
  const setsCreate: any[] = [];
  let prsCount = 0;
  for (const ex of data.exercises ?? []) {
    const exName = (ex.name || "").trim();
    if (!exName) continue;
    ex.sets.forEach((s, i) => {
      const w = parseFloat(String(s.weight ?? "")) || null;
      const r = parseInt(String(s.reps ?? ""), 10) || null;
      if (!w && !r) return; // skip empty sets
      setsCreate.push({
        exerciseName: exName,
        setIndex: i,
        weight: w,
        reps: r,
        completed: true,
      });
    });
  }

  try {
    const session = await prisma.workoutSession.create({
      data: {
        clientId,
        title,
        date: new Date(),
        completed: true,
        // Mark trainer-logged sessions so the UI can show "записано тренером"
        // instead of "самостійно" (which now only means the client logged it themselves).
        confirmedByTrainer: u.role === "TRAINER",
        durationSec,
        notes,
        sets: setsCreate.length > 0 ? { create: setsCreate } : undefined,
      },
      include: { client: { select: { firstName: true, lastName: true } } },
    });

    // Notify trainer(s) when CLIENT logs a manual session (so they know it happened).
    if (u.role === "CLIENT") {
      const total = setsCreate.length;
      notifyAllTrainers(
        `💪 <b>${tgEscape(session.client.firstName)} ${tgEscape(session.client.lastName)}</b> записав(ла) самостійне тренування\n` +
        `«${tgEscape(title)}»${durationSec ? ` · ${Math.round(durationSec/60)} хв` : ""}${total ? ` · ${total} підходів` : ""}`
      ).catch(() => {});
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/workout");
    revalidatePath("/dashboard/sessions");
    revalidatePath(`/admin/clients/${clientId}`);
    revalidatePath("/admin/sessions");
    revalidatePath("/admin/activity");

    return { ok: true, id: session.id };
  } catch (e: any) {
    console.error("logManualWorkout error:", e);
    return { ok: false, error: e?.message ?? "Помилка збереження в БД" };
  }
}
