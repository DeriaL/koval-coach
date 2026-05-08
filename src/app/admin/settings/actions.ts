"use server";
import { requireTrainer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveSiteConfig(data: {
  phone?: string; email?: string; city?: string;
  instagram?: string; telegram?: string;
  priceOnline?: string; priceOffline?: string; priceNote?: string;
}) {
  await requireTrainer();
  await prisma.siteConfig.upsert({
    where: { id: "main" },
    create: { id: "main", ...data },
    update: data,
  });
  revalidatePath("/");
  revalidatePath("/admin/settings");
}
