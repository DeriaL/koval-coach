import sharp from "sharp";
import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";

const dir = path.resolve("public/Keysi");
const files = (await readdir(dir)).filter((f) => /\.png$/i.test(f));

let before = 0, after = 0;
for (const f of files) {
  const src = path.join(dir, f);
  const out = path.join(dir, f.replace(/\.png$/i, ".webp"));
  const inSize = (await stat(src)).size;
  await sharp(src)
    .resize({ width: 1080, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(out);
  const outSize = (await stat(out)).size;
  await unlink(src); // remove original PNG
  before += inSize; after += outSize;
  console.log(`${f} -> ${path.basename(out)}  ${(inSize / 1024).toFixed(0)}KB -> ${(outSize / 1024).toFixed(0)}KB`);
}
console.log(`\nTotal: ${(before / 1024 / 1024).toFixed(1)}MB -> ${(after / 1024 / 1024).toFixed(2)}MB  (${(100 - after / before * 100).toFixed(0)}% smaller)`);
