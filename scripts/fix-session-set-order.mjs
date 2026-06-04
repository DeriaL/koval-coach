// One-off: rewrite SessionSet.setIndex as a SESSION-WIDE running counter.
// Old data stored setIndex per-exercise (0,1,2 per exercise), so all "first
// sets" tied at 0 and exercise order shuffled on display. We reconstruct a
// stable order (by createdAt, then id — i.e. insertion order), keep each
// exercise's sets contiguous, and renumber globally 0..n.
// Run once: `node scripts/fix-session-set-order.mjs`.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const sessions = await prisma.workoutSession.findMany({
  where: { sets: { some: {} } },
  include: { sets: true },
});

let touchedSessions = 0, touchedSets = 0;
for (const sess of sessions) {
  // Reconstruct logged order: insertion order ≈ createdAt then id.
  const ordered = [...sess.sets].sort(
    (a, b) => (a.createdAt - b.createdAt) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
  // Group by exercise, preserving first-encounter order; within a group keep the
  // original per-exercise setIndex order.
  const groups = new Map();
  for (const s of ordered) {
    if (!groups.has(s.exerciseName)) groups.set(s.exerciseName, []);
    groups.get(s.exerciseName).push(s);
  }
  for (const arr of groups.values()) arr.sort((a, b) => a.setIndex - b.setIndex);

  // Assign a global running index.
  let seq = 0, changed = false;
  for (const arr of groups.values()) {
    for (const s of arr) {
      if (s.setIndex !== seq) {
        await prisma.sessionSet.update({ where: { id: s.id }, data: { setIndex: seq } });
        touchedSets++; changed = true;
      }
      seq++;
    }
  }
  if (changed) touchedSessions++;
}
console.log(`✓ Renumbered ${touchedSets} set(s) across ${touchedSessions} session(s) (of ${sessions.length} with sets).`);
await prisma.$disconnect();
