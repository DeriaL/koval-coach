import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui";
import { BookOpen } from "lucide-react";
import { RecipesGrid } from "./RecipesGrid";

export default async function RecipesPage() {
  await requireClient();
  const recipes = await prisma.recipeBook.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  if (recipes.length === 0) {
    return (
      <div className="space-y-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Рецепти</h1>
          <p className="text-sm text-muted mt-0.5">Збірки від тренера</p>
        </div>
        <EmptyState icon={BookOpen} title="Рецептів поки немає" text="Тренер скоро додасть збірки 🥗" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-2xl font-bold">Рецепти</h1>
        <p className="text-sm text-muted mt-0.5">Збірки від тренера · {recipes.length} матеріалів</p>
      </div>
      <RecipesGrid recipes={recipes} />
    </div>
  );
}
