import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const NEW = [
  { imageUrl: "/Keysi/IMG_5682.webp", caption: "Жіноча трансформація: схуднення, тонус і впевненість у залі.", tag: "Тонус" },
  { imageUrl: "/Keysi/IMG_5683.webp", caption: "Рекомпозиція тіла: стрункіші ноги та підтягнута форма.", tag: "Форма" },
];

const last = await prisma.caseStudy.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
let order = (last?.order ?? -1) + 1;

for (const c of NEW) {
  const exists = await prisma.caseStudy.findFirst({ where: { imageUrl: c.imageUrl } });
  if (exists) { console.log(`skip (exists): ${c.imageUrl}`); continue; }
  await prisma.caseStudy.create({ data: { ...c, order: order++ } });
  console.log(`added: ${c.imageUrl} (order ${order - 1})`);
}
await prisma.$disconnect();
