import { NextResponse } from "next/server";
import { requireTrainer } from "@/lib/session";
import { put, del } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/admin/photos — upload a photo to Vercel Blob, returns its public URL
// Trainer-only. Used by progress photo picker on /admin/clients/[id].
export async function POST(req: Request) {
  await requireTrainer();

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "multipart/form-data required" }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const clientId = String(form.get("clientId") ?? "").trim();

  if (!file) return NextResponse.json({ error: "Файл обовʼязковий" }, { status: 400 });
  // SECURITY: whitelist raster image types only. SVG is excluded — it can carry
  // executable <script> and would run when opened from the public blob URL.
  const ALLOWED_IMG = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  if (!ALLOWED_IMG.includes(file.type)) {
    return NextResponse.json({ error: "Тільки JPEG, PNG або WebP" }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "Максимум 15 МБ" }, { status: 400 });
  }

  const folder = clientId ? `progress/${clientId}` : "progress";
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const blob = await put(`${folder}/${Date.now()}-${safeName}`, file, {
    access: "public",
    contentType: file.type,
  });

  return NextResponse.json({ url: blob.url });
}

// DELETE /api/admin/photos?url=… — remove blob (used after photo record deletion)
export async function DELETE(req: Request) {
  await requireTrainer();
  const url = new URL(req.url).searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
  if (url.includes("vercel-storage.com")) {
    try { await del(url); } catch { /* ignore — file may already be gone */ }
  }
  return NextResponse.json({ ok: true });
}
