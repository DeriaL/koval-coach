"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";

async function compressImage(file: File, maxSize = 512, quality = 0.85): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", quality);
}

export function AvatarUpload({
  initialUrl,
  initials,
  size = 80,
  endpoint = "/api/avatar",
}: {
  initialUrl: string | null;
  initials: string;
  size?: number;
  endpoint?: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setErr(null);
    try {
      const dataUrl = await compressImage(f, 512, 0.85);
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Помилка");
      setUrl(dataUrl);
      router.refresh();
    } catch (e: any) {
      setErr(e.message ?? "Помилка");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    if (!window.confirm("Прибрати фото?")) return;
    setBusy(true);
    try {
      await fetch(endpoint, { method: "DELETE" });
      setUrl(null);
      router.refresh();
    } finally { setBusy(false); }
  }

  const px = `${size}px`;

  return (
    <div className="relative inline-block group" style={{ width: px, height: px }}>
      <div
        className="rounded-2xl overflow-hidden accent-shine flex items-center justify-center text-white text-3xl font-black w-full h-full"
        style={{ width: px, height: px }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          initials
        )}
        {busy && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title="Завантажити фото"
        className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center shadow-glow hover:border-accent/50 active:scale-90 transition"
      >
        <Camera className="w-4 h-4 text-accent" />
      </button>

      {url && !busy && (
        <button
          type="button"
          onClick={remove}
          title="Прибрати фото"
          className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center hover:border-danger/50 hover:text-danger active:scale-90 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} />

      {err && <div className="absolute left-0 top-full mt-1 text-[10px] text-danger whitespace-nowrap">{err}</div>}
    </div>
  );
}
