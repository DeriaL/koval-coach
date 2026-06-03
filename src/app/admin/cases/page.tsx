import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { CasesAdmin } from "./CasesAdmin";

export const dynamic = "force-dynamic";

export default async function AdminCasesPage() {
  const cases: any[] = await (prisma as any).caseStudy.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Кейси / Результати"
        subtitle="Фото-результати клієнтів на головній сторінці сайту"
      />
      <CasesAdmin initial={cases} />
    </div>
  );
}
