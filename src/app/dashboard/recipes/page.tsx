import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui";
import { BookOpen, ChefHat, Sparkles } from "lucide-react";
import { RecipesGrid } from "./RecipesGrid";

export default async function RecipesPage() {
  await requireClient();
  const recipes = await prisma.recipeBook.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  if (recipes.length === 0) {
    return (
      <div className="space-y-6 pb-4">
        <Hero count={0} />
        <EmptyState icon={BookOpen} title="Рецептів поки немає" text="Тренер скоро додасть збірки 🥗" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <Hero count={recipes.length} />
      <RecipesGrid recipes={recipes} />
    </div>
  );
}

function Hero({ count }: { count: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl card p-5 md:p-7">
      {/* decorative gradient blobs */}
      <div aria-hidden className="absolute inset-0 -z-10 opacity-50">
        <div className="absolute -top-12 -right-8 w-48 h-48 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 w-48 h-48 rounded-full bg-accent2/20 blur-3xl" />
      </div>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl accent-shine flex items-center justify-center text-white shadow-glow shrink-0">
          <ChefHat className="w-6 h-6 md:w-7 md:h-7" strokeWidth={1.7} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="chip text-[10px] py-0.5 px-2 mb-2 inline-flex">
            <Sparkles className="w-3 h-3" /> Кулінарна книга
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Рецепти</h1>
          <p className="text-sm text-muted mt-1">
            {count > 0
              ? <>Збірки від тренера · <b className="text-text">{count}</b> {count === 1 ? "категорія" : count < 5 ? "категорії" : "категорій"}</>
              : "Тренер скоро додасть збірки"}
          </p>
        </div>
      </div>
    </div>
  );
}
