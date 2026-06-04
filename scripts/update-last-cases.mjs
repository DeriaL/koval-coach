import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const CAPTION = "Результат роботи зі схуднення протягом 6 місяців, а також досягнення у покращенні показників аналізів та стану здоров'я.";
const TARGETS = ["/Keysi/IMG_5682.webp", "/Keysi/IMG_5683.webp"];

for (const imageUrl of TARGETS) {
  const res = await prisma.caseStudy.updateMany({
    where: { imageUrl },
    data: { caption: CAPTION, tag: "6 місяців" },
  });
  console.log(`${imageUrl}: updated ${res.count}`);
}
await prisma.$disconnect();
