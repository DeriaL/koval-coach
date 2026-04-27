import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return session.user as { id: string; email: string; name: string; role: string };
}

export async function requireClient() {
  const u = await requireUser();
  if (u.role !== "CLIENT") redirect("/admin");
  return u;
}

export async function requireTrainer() {
  const u = await requireUser();
  if (u.role !== "TRAINER") redirect("/dashboard");
  return u;
}
