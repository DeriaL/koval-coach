"use client";
import { useState, useRef, useTransition } from "react";
import { Plus, Trash2, ExternalLink, Upload, Link2, Loader2, X, Pencil, Check, Eye } from "lucide-react";
import { RecipePreviewModal } from "@/components/RecipePreviewModal";

const CATEGORIES = ["Сніданки", "Обіди", "Перекуси", "Вечері", "Десерти", "Інше"];
const EMOJIS = ["🥗", "🍳", "🥩", "🍝", "🥞", "🥑", "🍱", "🥦", "🍜", "🥙", "🍰", "🍫", "💪", "🫙", "🍽️"];

type Recipe = {
  id: string; title: string; category: string; description: string | null;
  fileUrl: string; fileType: string; emoji: string | null; order: number; createdAt: Date; updatedAt: Date;
};

// ── Shared form fields ────────────────────────────────────────────────────────
function RecipeFields({
  title, setTitle, emoji, setEmoji, category, setCategory, description, setDescription, fileUrl, setFileUrl,
}: {
  title: string; setTitle: (v: string) => void;
  emoji: string; setEmoji: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  fileUrl: string; setFileUrl: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="label">Назва збірки</label>
        <input className="input" placeholder="Наприклад: Обіди для схуднення"
          value={title} onChange={e => setTitle(e.target.value)} required />
      </div>

      {/* Emoji */}
      <div>
        <label className="label">Emoji</label>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
          {EMOJIS.map(e => (
            <button key={e} type="button" onClick={() => setEmoji(e)}
              className={`shrink-0 w-10 h-10 text-xl rounded-xl border flex items-center justify-center transition ${
                e === emoji
                  ? "border-accent bg-accent/15 shadow-[0_0_10px_-2px_rgb(var(--accent)/0.4)]"
                  : "border-border bg-surface hover:border-accent/40"
              }`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="label">Категорія</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button key={c} type="button" onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-xl border text-sm transition ${c === category ? "border-accent bg-accent/10 text-accent font-medium" : "border-border text-muted hover:border-accent/40"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="label">Опис <span className="text-muted font-normal">(необовʼязково)</span></label>
        <input className="input" placeholder="Наприклад: 15 рецептів для схуднення"
          value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      {/* URL */}
      <div>
        <label className="label">Посилання або URL файлу</label>
        <input className="input font-mono text-sm" placeholder="https://canva.link/..."
          value={fileUrl} onChange={e => setFileUrl(e.target.value)} />
        <div className="text-xs text-muted mt-1">Canva, Google Drive, Dropbox або пряме посилання на файл</div>
      </div>
    </div>
  );
}

// ── Inline edit row ───────────────────────────────────────────────────────────
function EditInline({ recipe, onSave, onCancel }: {
  recipe: Recipe;
  onSave: (updated: Recipe) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(recipe.title);
  const [emoji, setEmoji] = useState(recipe.emoji ?? "🥗");
  const [category, setCategory] = useState(recipe.category);
  const [description, setDescription] = useState(recipe.description ?? "");
  const [fileUrl, setFileUrl] = useState(recipe.fileUrl);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await fetch("/api/admin/recipes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: recipe.id, title, emoji, category, description, fileUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Помилка"); return; }
      onSave(data);
    });
  }

  return (
    <div className="card overflow-hidden mt-1">
      <div className="h-[3px] bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent2))]" />
      <div className="p-4">
        <form onSubmit={save} className="space-y-4">
          <RecipeFields {...{ title, setTitle, emoji, setEmoji, category, setCategory, description, setDescription, fileUrl, setFileUrl }} />
          {error && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">{error}</div>}
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="btn btn-primary flex-1 gap-2">
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Зберегти
            </button>
            <button type="button" onClick={onCancel} className="btn px-4">
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function RecipesAdmin({ initial }: { initial: Recipe[] }) {
  const [recipes, setRecipes] = useState<Recipe[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Recipe | null>(null);

  // Add form state
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Сніданки");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🥗");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setTitle(""); setCategory("Сніданки"); setDescription(""); setEmoji("🥗");
    setExternalUrl(""); setFile(null); setError(""); setShowForm(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      try {
        let res: Response;
        if (mode === "upload" && file) {
          const fd = new FormData();
          fd.append("file", file); fd.append("title", title);
          fd.append("category", category); fd.append("description", description);
          fd.append("emoji", emoji);
          res = await fetch("/api/admin/recipes", { method: "POST", body: fd });
        } else {
          res = await fetch("/api/admin/recipes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, category, description, emoji, fileUrl: externalUrl }),
          });
        }
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Помилка"); return; }
        setRecipes(prev => [data, ...prev]);
        reset();
      } catch { setError("Мережева помилка"); }
    });
  }

  async function deleteRecipe(id: string) {
    if (!confirm("Видалити?")) return;
    setDeletingId(id);
    await fetch(`/api/admin/recipes?id=${id}`, { method: "DELETE" });
    setRecipes(prev => prev.filter(r => r.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Рецепти</h1>
          <p className="text-sm text-muted mt-0.5">Управляй збірками рецептів для клієнтів</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn btn-primary gap-2">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Закрити" : "Додати"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent2))]" />
          <div className="p-5 space-y-4">
            <h2 className="font-semibold">Нова збірка рецептів</h2>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setMode("upload")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm transition ${mode === "upload" ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:border-accent/40"}`}>
                <Upload className="w-4 h-4" /> Завантажити файл
              </button>
              <button type="button" onClick={() => setMode("link")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm transition ${mode === "link" ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:border-accent/40"}`}>
                <Link2 className="w-4 h-4" /> Зовнішнє посилання
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Назва збірки</label>
                <input className="input" placeholder="Наприклад: Обіди для схуднення" value={title}
                  onChange={e => setTitle(e.target.value)} required />
              </div>
              <div>
                <label className="label">Emoji</label>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
                  {EMOJIS.map(e => (
                    <button key={e} type="button" onClick={() => setEmoji(e)}
                      className={`shrink-0 w-10 h-10 text-xl rounded-xl border flex items-center justify-center transition ${e === emoji ? "border-accent bg-accent/15" : "border-border bg-surface hover:border-accent/40"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Категорія</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} type="button" onClick={() => setCategory(c)}
                      className={`px-3 py-1.5 rounded-xl border text-sm transition ${c === category ? "border-accent bg-accent/10 text-accent font-medium" : "border-border text-muted hover:border-accent/40"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Опис <span className="text-muted font-normal">(необовʼязково)</span></label>
                <input className="input" placeholder="Наприклад: 15 рецептів для схуднення"
                  value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              {mode === "upload" ? (
                <div>
                  <label className="label">Файл (PDF або PPTX)</label>
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:border-accent/40 cursor-pointer transition">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                      <Upload className="w-4 h-4 text-accent" />
                    </div>
                    <div className="min-w-0">
                      {file
                        ? <><div className="text-sm font-medium truncate">{file.name}</div><div className="text-xs text-muted">{(file.size/1024/1024).toFixed(1)} MB</div></>
                        : <><div className="text-sm text-muted">Обери PDF або PPTX</div><div className="text-xs text-muted">до 50 MB</div></>}
                    </div>
                    <input ref={fileRef} type="file" accept=".pdf,.pptx,.ppt" className="sr-only"
                      onChange={e => setFile(e.target.files?.[0] ?? null)} required={mode === "upload"} />
                  </label>
                </div>
              ) : (
                <div>
                  <label className="label">Посилання</label>
                  <input className="input font-mono text-sm" placeholder="https://canva.link/..."
                    value={externalUrl} onChange={e => setExternalUrl(e.target.value)} required={mode === "link"} />
                  <div className="text-xs text-muted mt-1">Canva, Google Drive, Dropbox тощо</div>
                </div>
              )}

              {error && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">{error}</div>}
              <button type="submit" disabled={pending} className="btn btn-primary w-full gap-2">
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Додати збірку
              </button>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {recipes.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">🥗</div>
          <div className="font-semibold">Ще немає збірок</div>
          <div className="text-sm text-muted mt-1">Натисни «Додати» щоб завантажити першу</div>
        </div>
      ) : (
        CATEGORIES.map(cat => {
          const items = recipes.filter(r => r.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>{cat}</span>
                <span className="chip text-[10px] py-0 px-1.5">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map(r => (
                  <div key={r.id}>
                    {/* Card row */}
                    <div className={`card p-4 flex items-center gap-4 transition-colors ${editingId === r.id ? "border-accent/40 bg-accent/3" : ""}`}>
                      <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-2xl shrink-0">
                        {r.emoji ?? "📄"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{r.title}</div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="chip text-[10px] py-0 px-1.5">{r.category}</span>
                          <span className={`chip text-[10px] py-0 px-1.5 ${r.fileType === "link" ? "text-accent2" : "text-accent"}`}>
                            {r.fileType === "link" ? "🔗 посилання" : r.fileType.toUpperCase()}
                          </span>
                          {r.description && <span className="text-[11px] text-muted truncate">{r.description}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setPreview(r)}
                          className="btn text-xs py-2 px-3 gap-1 hover:border-accent/50 hover:text-accent">
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Переглянути</span>
                        </button>
                        <button
                          onClick={() => setEditingId(editingId === r.id ? null : r.id)}
                          className={`btn text-xs py-2 px-3 gap-1 ${editingId === r.id ? "border-accent/40 text-accent bg-accent/5" : "hover:border-accent/50 hover:text-accent"}`}>
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{editingId === r.id ? "Закрити" : "Редагувати"}</span>
                        </button>
                        <button onClick={() => deleteRecipe(r.id)} disabled={deletingId === r.id}
                          className="btn text-xs py-2 px-3 text-danger hover:border-danger/40 hover:bg-danger/5">
                          {deletingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Inline edit form */}
                    {editingId === r.id && (
                      <EditInline
                        recipe={r}
                        onSave={(updated) => {
                          setRecipes(prev => prev.map(x => x.id === updated.id ? updated : x));
                          setEditingId(null);
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Preview modal */}
      {preview && (
        <RecipePreviewModal
          title={preview.title}
          fileUrl={preview.fileUrl}
          fileType={preview.fileType}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
