import sharp from "sharp";
import { stat, unlink } from "node:fs/promises";
import path from "node:path";

const dir = path.resolve("public/Keysi");
const jobs = [
  { src: "К_9 (2).png", out: "IMG_5682.webp" },
  { src: "К_10 (2).png", out: "IMG_5683.webp" },
];

for (const { src, out } of jobs) {
  const inPath = path.join(dir, src);
  const outPath = path.join(dir, out);
  const inSize = (await stat(inPath)).size;
  await sharp(inPath).resize({ width: 1080, withoutEnlargement: true }).webp({ quality: 80 }).toFile(outPath);
  const outSize = (await stat(outPath)).size;
  await unlink(inPath);
  console.log(`${src} -> ${out}  ${(inSize / 1024).toFixed(0)}KB -> ${(outSize / 1024).toFixed(0)}KB`);
}
console.log("done");
