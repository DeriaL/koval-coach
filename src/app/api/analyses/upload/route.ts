import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Upload a lab-analysis file (PDF or image). Both clients and trainers may use
// it — clients for themselves, trainers on behalf of a client.
export async function POST(req: Request) {
  await requireUser();

  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("multipart/form-data")) {
    return NextResponse.json({ error: "multipart/form-data required" }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Файл обовʼязковий" }, { status: 400 });

  const isPdf = file.type === "application/pdf";
  const isImg = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type);
  if (!isPdf && !isImg) {
    return NextResponse.json({ error: "Тільки PDF або зображення (JPG/PNG)" }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Максимум 20 МБ" }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Сховище файлів не налаштоване (BLOB_READ_WRITE_TOKEN)." },
      { status: 503 }
    );
  }

  const safeName = file.name.replace(/[^\w.-]+/g, "_") || (isPdf ? "analysis.pdf" : "analysis.jpg");
  try {
    const blob = await put(`analyses/${Date.now()}-${safeName}`, file, {
      access: "public",
      contentType: file.type || undefined,
    });
    return NextResponse.json({ url: blob.url, fileType: isPdf ? "pdf" : "image", name: file.name });
  } catch (e: any) {
    console.error("analysis upload failed:", e);
    return NextResponse.json({ error: e?.message ?? "Не вдалось завантажити файл" }, { status: 500 });
  }
}
