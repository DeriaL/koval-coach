import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { Camera } from "lucide-react";
import { PhotoCompare } from "./compare";

export default async function PhotosPage() {
  const u = await requireClient();
  const photos = await prisma.progressPhoto.findMany({ where: { clientId: u.id }, orderBy: { date: "asc" } });

  if (photos.length === 0)
    return (
      <div>
        <PageHeader title="Фото-прогрес" />
        <EmptyState icon={Camera} title="Фото ще не додано" text="Я завантажу фото після першої сесії" />
      </div>
    );

  const first = photos[0];
  const last = photos.at(-1)!;

  return (
    <div>
      <PageHeader title="Фото-прогрес" subtitle="Твій шлях у кадрах" />

      {first.id !== last.id && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-4">Порівняння «до/після»</h3>
          <PhotoCompare before={first.url} after={last.url} />
          <div className="flex justify-between text-xs text-muted mt-2">
            <span>{first.date.toLocaleDateString("uk-UA")}</span>
            <span>{last.date.toLocaleDateString("uk-UA")}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((p) => (
          <div key={p.id} className="card overflow-hidden group">
            <div className="aspect-[3/4] bg-surface">
              <img src={p.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
            </div>
            <div className="p-3">
              <div className="text-sm font-medium">{p.date.toLocaleDateString("uk-UA")}</div>
              <div className="text-xs text-muted">{p.angle || "—"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
