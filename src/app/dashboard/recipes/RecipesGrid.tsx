"use client";
import { useState } from "react";
import { FileText, Link2, Presentation, Eye, Layers } from "lucide-react";
import { RecipePreviewModal } from "@/components/RecipePreviewModal";

const CATEGORIES = ["Всі", "Сніданки", "Перекуси", "Обіди", "Вечері", "Десерти", "Інше"];

const CATEGORY_EMOJI: Record<string, string> = {
  "Всі":      "🍽️",
  "Сніданки": "🍳",
  "Перекуси": "🥪",
  "Обіди":    "🥘",
  "Вечері":   "🍝",
  "Десерти":  "🍰",
  "Інше":     "📖",
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  "Сніданки":  "from-amber-400/40 via-orange-400/25 to-yellow-300/20",
  "Перекуси":  "from-violet-400/40 via-purple-400/25 to-fuchsia-300/20",
  "Обіди":     "from-emerald-400/40 via-teal-400/25 to-green-300/20",
  "Вечері":    "from-blue-400/40 via-indigo-400/25 to-sky-300/20",
  "Десерти":   "from-pink-400/40 via-rose-400/25 to-red-300/20",
  "Інше":      "from-slate-400/30 via-gray-400/20 to-zinc-300/15",
};

const CATEGORY_ACCENT: Record<string, string> = {
  "Сніданки":  "from-amber-400 to-orange-500",
  "Перекуси":  "from-violet-400 to-purple-500",
  "Обіди":     "from-emerald-400 to-teal-500",
  "Вечері":    "from-blue-400 to-indigo-500",
  "Десерти":   "from-pink-400 to-rose-500",
  "Інше":      "from-slate-400 to-gray-500",
};

type Recipe = {
  id: string; title: string; category: string; description: string | null;
  fileUrl: string; fileType: string; emoji: string | null;
};

export function RecipesGrid({ recipes }: { recipes: Recipe[] }) {
  const [active, setActive] = useState("Всі");
  const [preview, setPreview] = useState<Recipe | null>(null);

  const cats = CATEGORIES.filter(c => c === "Всі" || recipes.some(r => r.category === c));

  const grouped = active === "Всі"
    ? cats.filter(c => c !== "Всі").map(cat => ({ cat, items: recipes.filter(r => r.category === cat) })).filter(g => g.items.length > 0)
    : [{ cat: active, items: recipes.filter(r => r.category === active) }];

  return (
    <>
      {/* Category filter tabs — горизонтальний скрол з emoji */}
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {cats.map(c => {
            const isActive = c === active;
            const count = c === "Всі" ? recipes.length : recipes.filter(r => r.category === c).length;
            return (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={[
                  "shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all active:scale-95",
                  isActive
                    ? "accent-shine text-white border-transparent shadow-glow"
                    : "bg-surface border-border text-text hover:border-accent/40",
                ].join(" ")}
              >
                <span className="text-base leading-none">{CATEGORY_EMOJI[c] ?? "📖"}</span>
                <span>{c}</span>
                <span className={[
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  isActive ? "bg-white/20" : "bg-card text-muted",
                ].join(" ")}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-8">
        {grouped.map(({ cat, items }) => (
          <div key={cat}>
            {active === "Всі" && (
              <div className="flex items-center gap-3 mb-4">
                <div className="text-base">{CATEGORY_EMOJI[cat] ?? "📖"}</div>
                <div className="text-sm font-semibold uppercase tracking-wider">{cat}</div>
                <div className="flex-1 h-px bg-border" />
                <div className="chip text-[10px] py-0 px-1.5">{items.length}</div>
              </div>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(r => (
                <RecipeCard key={r.id} recipe={r} onOpen={() => setPreview(r)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Preview modal */}
      {preview && (
        <RecipePreviewModal
          title={preview.title}
          fileUrl={preview.fileUrl}
          fileType={preview.fileType}
          emoji={preview.emoji}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}

function RecipeCard({ recipe: r, onOpen }: { recipe: Recipe; onOpen: () => void }) {
  const grad = CATEGORY_GRADIENTS[r.category] ?? CATEGORY_GRADIENTS["Інше"];
  const accent = CATEGORY_ACCENT[r.category] ?? CATEGORY_ACCENT["Інше"];

  const isSlides = r.fileType === "slides";
  const TypeIcon = isSlides ? Layers : r.fileType === "link" ? Link2 : r.fileType === "pptx" ? Presentation : FileText;
  const typeLabel = isSlides ? "Слайди" : r.fileType === "link" ? "Посилання" : r.fileType.toUpperCase();

  // For slide-decks, use first slide as background cover image
  const coverUrl = isSlides ? `${r.fileUrl}/01.jpg` : null;

  return (
    <button
      onClick={onOpen}
      className="block w-full text-left card overflow-hidden group hover:border-accent/40 hover:-translate-y-1 hover:shadow-glow transition-all duration-300 active:scale-[0.98] relative"
    >
      {/* Gradient top strip */}
      <div className={`h-[3px] bg-gradient-to-r ${accent}`} />

      {/* Hero panel: slide cover if available, else gradient with emoji */}
      {coverUrl ? (
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={r.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          {/* gradient overlay for legibility */}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          {/* category accent on hover */}
          <div aria-hidden className={`absolute inset-0 bg-gradient-to-br ${grad} opacity-0 group-hover:opacity-50 mix-blend-overlay transition-opacity duration-500`} />

          {/* Floating emoji badge */}
          <div className="absolute top-3 left-3 w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-2xl shadow-lg">
            {r.emoji ?? "📄"}
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-black text-xl leading-tight text-white drop-shadow-lg">
              {r.title}
            </h3>
            {r.description && (
              <p className="text-xs text-white/85 mt-1 line-clamp-2 leading-relaxed drop-shadow">{r.description}</p>
            )}
          </div>
        </div>
      ) : (
        <div className={`relative bg-gradient-to-br ${grad} p-5 pb-5 overflow-hidden`}>
          <div aria-hidden className={`absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500`} />
          <div className="relative">
            <div className="text-5xl md:text-6xl mb-4 leading-none transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 origin-bottom-left">
              {r.emoji ?? "📄"}
            </div>
            <h3 className="font-black text-xl leading-tight group-hover:text-accent transition-colors line-clamp-2">
              {r.title}
            </h3>
            {r.description && (
              <p className="text-xs text-muted/90 mt-1.5 line-clamp-2 leading-relaxed">{r.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between gap-2 border-t border-border/60 bg-card/40">
        <div className="flex items-center gap-1.5 text-xs text-muted shrink-0">
          <TypeIcon className="w-3.5 h-3.5" /> {typeLabel}
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-accent group-hover:gap-2 transition-all">
          <Eye className="w-3.5 h-3.5" />
          Переглянути
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
        </div>
      </div>
    </button>
  );
}
