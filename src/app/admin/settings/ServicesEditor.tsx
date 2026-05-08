"use client";
import { useState, useTransition } from "react";
import { Plus, Trash2, Pencil, Check, X, Loader2, Star, Eye, EyeOff, GripVertical } from "lucide-react";

type Service = {
  id: string; title: string; description: string | null; price: string | null;
  priceNote: string | null; emoji: string | null; perks: string | null;
  featured: boolean; active: boolean; order: number;
};

const EMOJIS = ["💪", "👑", "🏋️", "🥗", "⚡", "🎯", "🔥", "🌟", "💎", "🚀", "✨", "🏆"];

function ServiceForm({
  initial, onSave, onCancel, saving,
}: {
  initial?: Partial<Service>;
  onSave: (data: Partial<Service>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [priceNote, setPriceNote] = useState(initial?.priceNote ?? "пакет 10 тренувань");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "💪");
  const [perks, setPerks] = useState(initial?.perks ?? "");
  const [featured, setFeatured] = useState(initial?.featured ?? false);

  return (
    <div className="space-y-4 p-4 bg-surface rounded-xl border border-border mt-1">
      {/* Emoji + Title */}
      <div className="flex gap-2 items-start">
        <div className="shrink-0">
          <label className="label text-[10px]">Emoji</label>
          <div className="flex gap-1.5 flex-wrap max-w-[160px]">
            {EMOJIS.map(e => (
              <button key={e} type="button" onClick={() => setEmoji(e)}
                className={`w-9 h-9 text-lg rounded-xl border flex items-center justify-center transition ${
                  e === emoji ? "border-accent bg-accent/15" : "border-border bg-surface hover:border-accent/40"
                }`}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <label className="label">Назва послуги</label>
          <input className="input" placeholder="Онлайн-тренування" value={title}
            onChange={e => setTitle(e.target.value)} required />
          <label className="label mt-2">Підзаголовок</label>
          <input className="input" placeholder="тренуєшся сам, я веду онлайн" value={description}
            onChange={e => setDescription(e.target.value)} />
        </div>
      </div>

      {/* Price */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Ціна (грн)</label>
          <div className="relative">
            <input className="input pr-7" placeholder="5 000" value={price}
              onChange={e => setPrice(e.target.value)} />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted text-sm">₴</span>
          </div>
        </div>
        <div>
          <label className="label">Підпис до ціни</label>
          <input className="input" placeholder="пакет 10 тренувань" value={priceNote}
            onChange={e => setPriceNote(e.target.value)} />
        </div>
      </div>

      {/* Perks */}
      <div>
        <label className="label">Що входить <span className="font-normal text-muted">(кожен пункт з нового рядка)</span></label>
        <textarea className="input min-h-[100px] resize-y font-sans" placeholder={"Персональна програма тренувань\nПлан харчування\nЩоденний check-in"}
          value={perks} onChange={e => setPerks(e.target.value)} />
      </div>

      {/* Featured toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div onClick={() => setFeatured(v => !v)}
          className={`w-10 h-6 rounded-full transition-colors relative ${featured ? "bg-accent" : "bg-border"}`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${featured ? "translate-x-5" : "translate-x-1"}`} />
        </div>
        <span className="text-sm flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-accent" /> Виділена картка (популярна)
        </span>
      </label>

      <div className="flex gap-2">
        <button type="button" disabled={saving || !title}
          onClick={() => onSave({ title, description: description || null, price: price || null, priceNote: priceNote || null, emoji, perks: perks || null, featured })}
          className="btn btn-primary flex-1 gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Зберегти
        </button>
        <button type="button" onClick={onCancel} className="btn px-4"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

export function ServicesEditor({ initial }: { initial: Service[] }) {
  const [services, setServices] = useState<Service[]>(initial);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function createService(data: Partial<Service>) {
    start(async () => {
      const res = await fetch("/api/admin/services", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, order: services.length }),
      });
      const s = await res.json();
      setServices(prev => [...prev, s]);
      setAdding(false);
    });
  }

  async function updateService(id: string, data: Partial<Service>) {
    start(async () => {
      const res = await fetch("/api/admin/services", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      const s = await res.json();
      setServices(prev => prev.map(x => x.id === id ? s : x));
      setEditingId(null);
    });
  }

  async function toggleActive(s: Service) {
    start(async () => {
      await fetch("/api/admin/services", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id, active: !s.active }),
      });
      setServices(prev => prev.map(x => x.id === s.id ? { ...x, active: !x.active } : x));
    });
  }

  async function deleteService(id: string) {
    if (!confirm("Видалити послугу?")) return;
    setDeletingId(id);
    await fetch(`/api/admin/services?id=${id}`, { method: "DELETE" });
    setServices(prev => prev.filter(x => x.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="card overflow-hidden">
      <div className="h-[3px] bg-gradient-to-r from-[rgb(var(--accent))] to-[rgb(var(--accent2))]" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider">Послуги на лендингу</div>
            <div className="text-xs text-muted mt-0.5">Відображаються в розділі #Тарифи</div>
          </div>
          <button onClick={() => { setAdding(true); setEditingId(null); }}
            className="btn btn-primary gap-1.5 text-sm py-2">
            <Plus className="w-4 h-4" /> Додати
          </button>
        </div>

        {adding && (
          <ServiceForm onSave={createService} onCancel={() => setAdding(false)} saving={pending} />
        )}

        {services.length === 0 && !adding ? (
          <div className="text-center py-8 text-muted text-sm">
            Ще немає послуг. Натисни «Додати» щоб створити першу.
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {services.map(s => (
              <div key={s.id}>
                <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${!s.active ? "opacity-50 bg-surface" : "bg-card border-border"}`}>
                  <div className="text-2xl w-8 text-center shrink-0">{s.emoji ?? "💪"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm flex items-center gap-2 flex-wrap">
                      {s.title}
                      {s.featured && <span className="chip text-[9px] py-0 px-1.5 text-accent border-accent/30">⭐ популярна</span>}
                      {!s.active && <span className="chip text-[9px] py-0 px-1.5 text-muted">прихована</span>}
                    </div>
                    {s.price && (
                      <div className="text-xs text-accent font-mono mt-0.5">{s.price} ₴ / {s.priceNote}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActive(s)}
                      title={s.active ? "Приховати" : "Показати"}
                      className="btn text-xs py-1.5 px-2">
                      {s.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-muted" />}
                    </button>
                    <button onClick={() => { setEditingId(editingId === s.id ? null : s.id); setAdding(false); }}
                      className={`btn text-xs py-1.5 px-2 ${editingId === s.id ? "border-accent/40 text-accent" : ""}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteService(s.id)} disabled={deletingId === s.id}
                      className="btn text-xs py-1.5 px-2 text-danger hover:border-danger/40">
                      {deletingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                {editingId === s.id && (
                  <ServiceForm
                    initial={s}
                    onSave={data => updateService(s.id, data)}
                    onCancel={() => setEditingId(null)}
                    saving={pending}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
