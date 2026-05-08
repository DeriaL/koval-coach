import { requireTrainer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { RecipesAdmin } from "./RecipesAdmin";

export default async function AdminRecipesPage() {
  await requireTrainer();
  const recipes = await prisma.recipeBook.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }, { createdAt: "desc" }] });
  return <RecipesAdmin initial={recipes} />;
}
