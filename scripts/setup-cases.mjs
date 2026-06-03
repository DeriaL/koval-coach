// Creates the CaseStudy table (raw DDL, idempotent) and seeds the 8 starter
// cases if the table is empty. Run once: `node scripts/setup-cases.mjs`.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED = [
  { imageUrl: "/Keysi/IMG_5671.webp", caption: "Процес підготовки до змагань. Чотири роки якісного набору!", tag: "4 роки" },
  { imageUrl: "/Keysi/IMG_5673.webp", caption: "Якісний набір м'язової маси. Результат за 3 місяці роботи!", tag: "3 місяці" },
  { imageUrl: "/Keysi/IMG_5680.webp", caption: "Результат рекомпозиції тіла тривалістю 1.5 місяці!", tag: "1.5 місяці" },
  { imageUrl: "/Keysi/IMG_5681.webp", caption: "Підготовка до змагань. Результат роботи за один рік співпраці.", tag: "1 рік" },
  { imageUrl: "/Keysi/IMG_5678.webp", caption: "Схуднення, вихід із фази інсулінорезистентності та покращення показників аналізів і здоров'я!", tag: "Здоров'я" },
  { imageUrl: "/Keysi/IMG_5676.webp", caption: "Підготовка до змагань. Момент виступу!", tag: "Сцена" },
  { imageUrl: "/Keysi/IMG_5679.webp", caption: "Після нагородження з тренером. Підготовка до змагань!", tag: "Нагорода" },
  { imageUrl: "/Keysi/IMG_5672.webp", caption: "Момент з виступу на змаганнях!", tag: "Сцена" },
];

await prisma.$executeRawUnsafe(`
  CREATE TABLE IF NOT EXISTS "CaseStudy" (
    "id" TEXT PRIMARY KEY,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "tag" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);
await prisma.$executeRawUnsafe(
  `CREATE INDEX IF NOT EXISTS "CaseStudy_published_order_idx" ON "CaseStudy" ("published", "order");`
);
console.log("✓ CaseStudy table ready");

const count = await prisma.caseStudy.count();
if (count > 0) {
  console.log(`Table already has ${count} rows — skipping seed.`);
} else {
  for (let i = 0; i < SEED.length; i++) {
    await prisma.caseStudy.create({ data: { ...SEED[i], order: i } });
  }
  console.log(`✓ Seeded ${SEED.length} cases`);
}

await prisma.$disconnect();
