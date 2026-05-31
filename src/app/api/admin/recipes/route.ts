import { NextResponse } from "next/server";
import { requireTrainer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/admin/recipes — create recipe (multipart OR json with external URL)
export async function POST(req: Request) {
  await requireTrainer();

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const title = String(form.get("title") ?? "").trim();
    const category = String(form.get("category") ?? "Інше").trim();
    const description = String(form.get("description") ?? "").trim() || null;
    const emoji = String(form.get("emoji") ?? "").trim() || null;

    if (!title || !file) {
      return NextResponse.json({ error: "Назва і файл обовʼязкові" }, { status: 400 });
    }

    // SECURITY: whitelist document types only. Public-blob files reachable by
    // URL, so an HTML/SVG/exe disguised as a recipe would be a stored-XSS /
    // malware vector. Validate BOTH extension and the browser MIME type.
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const ALLOWED_EXT = ["pdf", "pptx", "ppt"];
    const ALLOWED_MIME = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
    ];
    if (!ALLOWED_EXT.includes(ext) || (file.type && !ALLOWED_MIME.includes(file.type))) {
      return NextResponse.json({ error: "Дозволені лише файли PDF або PPTX" }, { status: 400 });
    }
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Максимум 25 МБ" }, { status: 400 });
    }
    const fileType = ext === "pptx" || ext === "ppt" ? "pptx" : "pdf";
    // Sanitise the stored filename — never reflect raw user input into the path.
    const safeName = file.name.replace(/[^\w.-]+/g, "_");
    const blob = await put(`recipes/${Date.now()}-${safeName}`, file, {
      access: "public",
      contentType: fileType === "pdf" ? "application/pdf" : file.type,
    });

    const recipe = await prisma.recipeBook.create({
      data: { title, category, description, emoji, fileUrl: blob.url, fileType },
    });

    return NextResponse.json(recipe);
  }

  // JSON body — external link
  const body = await req.json().catch(() => ({}));
  const { title, category, description, fileUrl, emoji } = body;

  if (!title || !fileUrl) {
    return NextResponse.json({ error: "Назва і посилання обовʼязкові" }, { status: 400 });
  }

  const recipe = await prisma.recipeBook.create({
    data: {
      title: String(title).trim(),
      category: String(category ?? "Інше").trim(),
      description: description ? String(description).trim() : null,
      emoji: emoji ? String(emoji).trim() : null,
      fileUrl: String(fileUrl).trim(),
      fileType: "link",
    },
  });

  return NextResponse.json(recipe);
}

// PATCH /api/admin/recipes — update metadata (title, category, description, emoji, fileUrl)
export async function PATCH(req: Request) {
  await requireTrainer();
  const body = await req.json().catch(() => ({}));
  const { id, title, category, description, emoji, fileUrl } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: any = {};
  if (title !== undefined) data.title = String(title).trim();
  if (category !== undefined) data.category = String(category).trim();
  if (description !== undefined) data.description = description ? String(description).trim() : null;
  if (emoji !== undefined) data.emoji = emoji ? String(emoji).trim() : null;
  if (fileUrl !== undefined) data.fileUrl = String(fileUrl).trim();

  const updated = await prisma.recipeBook.update({ where: { id }, data });
  return NextResponse.json(updated);
}

// DELETE /api/admin/recipes?id=xxx
export async function DELETE(req: Request) {
  await requireTrainer();
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const recipe = await prisma.recipeBook.findUnique({ where: { id } });
  if (!recipe) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Delete from Vercel Blob if it's a blob URL
  if (recipe.fileType !== "link" && recipe.fileUrl.includes("vercel-storage.com")) {
    await del(recipe.fileUrl).catch(() => {});
  }

  await prisma.recipeBook.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
