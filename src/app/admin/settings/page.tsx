import { requireTrainer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SiteConfigForm } from "./SiteConfigForm";
import { ServicesEditor } from "./ServicesEditor";

export default async function SettingsPage() {
  await requireTrainer();
  const p = prisma as any;
  const [cfg, services] = await Promise.all([
    p.siteConfig.findUnique({ where: { id: "main" } }).catch(() => null),
    p.service.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }).catch(() => []),
  ]);
  return (
    <div className="space-y-6 pb-8 max-w-2xl">
      <SiteConfigForm initial={cfg} />
      <ServicesEditor initial={services} />
    </div>
  );
}
