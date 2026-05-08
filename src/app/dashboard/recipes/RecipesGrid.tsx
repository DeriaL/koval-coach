"use client";
import { useState } from "react";
import { ExternalLink, FileText, Link2 } from "lucide-react";

const CATEGORIES = ["Всі", "Сніданки", "Обіди", "Перекуси", "Вечері", "Десерти", "Інше"];

const CATEGORY_GRADIENTS: Record<string, string> = {
  "Сніданки":  "from-amber-400/30 to-orange-400/20",
  "Обіди":     "from-emerald-400/30 to-teal-400/20",
  "Перекуси":  "from-violet-400/30 to-purple-400/20",
  "Вечері":    "from-blue-400/30 to-indigo-400/20",
  "Десерти":   "from-pink-400/30 to-rose-400/20",
  "Інше":      "from-slate-400/30 to-gray-400/20",
};

const CATEGORY_ACCENT: Record<string, string> = {
  "Сніданки":  "from-amber-400 to-orange-400",
  "Обіди":     "from-emerald-400 to-teal-400",
  "Перекуси":  "from-violet-400 to-purple-400",
  "Вечері":    "from-blue-400 to-indigo-400",
  "Десерти":   "from-pink-400 to-rose-400",
  "Інше":      "from-slate-400 to-gray-400",
};

type Recipe = {
  id: string; title: string; category: string; description: string | null;
  fileUrl: string; fileType: string; emoji: string | null;
};

export function RecipesGrid({ recipes }: { recipes: Recipe[] }) {
  const [active, setActive] = useState("Всі");

  const cats = CATEGORIES.filter(c => c === "Всі" || recipes.some(r => r.category === c));
  const filtered = active === "Всі" ? recipes : recipes.filter(r => r.category === active);

  // Group by category for "Всі" view
  const grouped = active === "Всі"
    ? cats.filter(c => c !== "Всі").map(cat => ({ cat, items: recipes.filter(r => r.category === cat) })).filter(g => g.items.length > 0)
    : [{ cat: active, items: filtered }];

  return (
    <div>
      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin -mx-1 px-1 mb-6">
        {cats.map(c => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={[
              "flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-all",
              c === active
                ? "border-accent bg-accent/10 text-accent shadow-[0_0_16px_-4px_rgb(var(--accent)/0.3)]"
                : "border-border text-muted hover:border-accent/40 hover:text-text",
            ].join(" ")}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-8">
        {grouped.map(({ cat, items }) => (
          <div key={cat}>
            {active === "Всі" && (
              <div className="flex items-center gap-3 mb-4">
                <div className="text-sm font-semibold text-muted uppercase tracking-wider">{cat}</div>
                <div className="flex-1 h-px bg-border" />
                <div className="chip text-[10px] py-0 px-1.5">{items.length}</div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(r => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecipeCard({ recipe: r }: { recipe: Recipe }) {
  const grad = CATEGORY_GRADIENTS[r.category] ?? CATEGORY_GRADIENTS["Інше"];
  const accent = CATEGORY_ACCENT[r.category] ?? CATEGORY_ACCENT["Інше"];

  return (
    <a
      href={r.fileUrl}
      target="_blank"
      rel="noreferrer"
      className="block card overflow-hidden group hover:border-accent/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
    >
      {/* Gradient top strip */}
      <div className={`h-[3px] bg-gradient-to-r ${accent}`} />

      {/* Gradient bg panel */}
      <div className={`relative bg-gradient-to-br ${grad} p-5 pb-4`}>
        {/* Big emoji */}
        <div className="text-4xl mb-3 leading-none">{r.emoji ?? "📄"}</div>

        {/* Category chip */}
        <span className="chip text-[10px] py-0.5 px-2 mb-3 inline-flex">{r.category}</span>

        <h3 className="font-bold text-base leading-snug group-hover:text-accent transition-colors line-clamp-2">
          {r.title}
        </h3>

        {r.description && (
          <p className="text-sm text-muted mt-1.5 line-clamp-2">{r.description}</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 flex items-center justify-between border-t border-border/60">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          {r.fileType === "link"
            ? <><Link2 className="w-3.5 h-3.5" /> Посилання</>
            : <><FileText className="w-3.5 h-3.5" /> {r.fileType.toUpperCase()}</>}
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
          Відкрити <ExternalLink className="w-3 h-3" />
        </div>
      </div>
    </a>
  );
}
