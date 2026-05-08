import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { readdir } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Returns the list of image slide URLs for a given recipe folder.
// Folder is whitelisted by RecipeBook fileUrl prefix to prevent traversal.
export async function GET(req: Request) {
  await requireUser();

  const url = new URL(req.url);
  const folder = url.searchParams.get("folder");
  if (!folder) {
    return NextResponse.json({ error: "folder required" }, { status: 400 });
  }

  // Only allow folders inside /public/recipes/ — safe path
  const safe = folder.replace(/^\/+/, "").replace(/\.\.+/g, "");
  if (!safe.startsWith("recipes/")) {
    return NextResponse.json({ error: "invalid folder" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", safe);
  try {
    const files = await readdir(dir);
    const slides = files
      .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map(f => `/${safe}/${f}`);
    return NextResponse.json({ slides });
  } catch {
    return NextResponse.json({ slides: [] });
  }
}
