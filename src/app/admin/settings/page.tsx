import { requireTrainer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SiteConfigForm } from "./SiteConfigForm";

export default async function SettingsPage() {
  await requireTrainer();
  const cfg = await prisma.siteConfig.findUnique({ where: { id: "main" } });
  return <SiteConfigForm initial={cfg} />;
}
