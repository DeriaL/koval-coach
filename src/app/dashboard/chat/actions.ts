"use server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function sendMessage(clientId: string, authorRole: "CLIENT" | "TRAINER", body: string) {
  const u = await requireUser();
  // clients can only post in their own thread
  if (u.role === "CLIENT" && u.id !== clientId) throw new Error("forbidden");
  const m = await prisma.message.create({
    data: { clientId, authorRole, body },
  });
  return m;
}
