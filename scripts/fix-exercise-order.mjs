// One-off: renumber exercise `order` per (plan, day) so there are no ties.
// Existing rows mostly shared order=0, which let Postgres return them in a
// shifting sequence after edits. Run once: `node scripts/fix-exercise-order.mjs`.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const plans = await prisma.trainingPlan.findMany({
  include: { exercises: true },
});

let touched = 0;
for (const plan of plans) {
  // Group by day, sort each day by current order then createdAt (stable),
  // then assign 0..n. Preserves the trainer's intended sequence as best we can.
  const byDay = new Map();
  for (const ex of plan.exercises) {
    if (!byDay.has(ex.day)) byDay.set(ex.day, []);
    byDay.get(ex.day).push(ex);
  }
  for (const [, exs] of byDay) {
    exs.sort((a, b) => (a.order - b.order) || (a.createdAt - b.createdAt));
    for (let i = 0; i < exs.length; i++) {
      if (exs[i].order !== i) {
        await prisma.exercise.update({ where: { id: exs[i].id }, data: { order: i } });
        touched++;
      }
    }
  }
}
console.log(`✓ Renumbered ${touched} exercise(s) across ${plans.length} plan(s).`);
await prisma.$disconnect();
