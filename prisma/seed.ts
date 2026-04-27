import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const trainerPwd = await bcrypt.hash("trainer123", 10);
  const clientPwd = await bcrypt.hash("client123", 10);

  await prisma.user.upsert({
    where: { email: "trainer@koval.fit" },
    update: {},
    create: {
      email: "trainer@koval.fit",
      password: trainerPwd,
      role: "TRAINER",
      firstName: "Дмитро",
      lastName: "Ковальчук",
      phone: "+380501112233",
    },
  });

  const client = await prisma.user.upsert({
    where: { email: "client@koval.fit" },
    update: {},
    create: {
      email: "client@koval.fit",
      password: clientPwd,
      role: "CLIENT",
      firstName: "Олег",
      lastName: "Петренко",
      phone: "+380671234567",
      birthday: new Date("1995-06-14"),
      goal: "Схуднути 8 кг та набрати м'язову масу",
      height: 182,
      startWeight: 92,
      notes: "Коліно ліве — обережно з присіданнями.",
    },
  });

  // wipe old demo data for this client
  await prisma.nutritionPlan.deleteMany({ where: { clientId: client.id } });
  await prisma.trainingPlan.deleteMany({ where: { clientId: client.id } });
  await prisma.supplement.deleteMany({ where: { clientId: client.id } });
  await prisma.payment.deleteMany({ where: { clientId: client.id } });
  await prisma.measurement.deleteMany({ where: { clientId: client.id } });
  await prisma.progressPhoto.deleteMany({ where: { clientId: client.id } });
  await prisma.checkIn.deleteMany({ where: { clientId: client.id } });
  await prisma.achievement.deleteMany({ where: { clientId: client.id } });
  await prisma.workoutLog.deleteMany({ where: { clientId: client.id } });
  await prisma.reminder.deleteMany({ where: { clientId: client.id } });
  await prisma.message.deleteMany({ where: { clientId: client.id } });
  await prisma.workoutSession.deleteMany({ where: { clientId: client.id } });
  await prisma.habit.deleteMany({ where: { clientId: client.id } });

  const plan = await prisma.trainingPlan.create({
    data: {
      clientId: client.id,
      title: "Сплит ПТГ × 4/тиж (з вправами)",
      daysPerWeek: 4,
      content: "Структурована програма з вправами — дивись «Почати тренування»",
      notes: "Розминка 10 хв, заминка 5 хв",
      exercises: {
        create: [
          { day: "Пн", order: 0, name: "Жим лежачи", targetSets: 4, targetReps: "8", restSec: 120, videoUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg" },
          { day: "Пн", order: 1, name: "Жим гантелей під кутом", targetSets: 3, targetReps: "10", restSec: 90 },
          { day: "Пн", order: 2, name: "Розведення в кросовері", targetSets: 3, targetReps: "12", restSec: 60 },
          { day: "Пн", order: 3, name: "Французький жим", targetSets: 3, targetReps: "12", restSec: 60 },
          { day: "Вт", order: 0, name: "Підтягування", targetSets: 4, targetReps: "max", restSec: 120 },
          { day: "Вт", order: 1, name: "Тяга штанги в нахилі", targetSets: 4, targetReps: "8", restSec: 120 },
          { day: "Вт", order: 2, name: "Тяга верхнього блоку", targetSets: 3, targetReps: "10", restSec: 90 },
          { day: "Вт", order: 3, name: "Молотки", targetSets: 3, targetReps: "12", restSec: 60 },
          { day: "Чт", order: 0, name: "Присідання зі штангою", targetSets: 4, targetReps: "8", restSec: 150, notes: "обережно з лівим коліном" },
          { day: "Чт", order: 1, name: "Жим ногами", targetSets: 4, targetReps: "12", restSec: 120 },
          { day: "Чт", order: 2, name: "Румунська тяга", targetSets: 3, targetReps: "10", restSec: 90 },
          { day: "Пт", order: 0, name: "Жим сидячи", targetSets: 4, targetReps: "8", restSec: 120 },
          { day: "Пт", order: 1, name: "Махи в сторони", targetSets: 3, targetReps: "12", restSec: 60 },
          { day: "Пт", order: 2, name: "Тяга до підборіддя", targetSets: 3, targetReps: "10", restSec: 60 },
        ],
      },
    },
  });

  // minimal habits
  await prisma.habit.createMany({
    data: [
      { clientId: client.id, title: "2.5л води", icon: "Droplet", order: 0 },
      { clientId: client.id, title: "Сон 7+ год", icon: "Moon", order: 1 },
      { clientId: client.id, title: "10k кроків", icon: "Footprints", order: 2 },
      { clientId: client.id, title: "Без цукру", icon: "Ban", order: 3 },
      { clientId: client.id, title: "Прийом добавок", icon: "Pill", order: 4 },
    ],
  });
  const habits = await prisma.habit.findMany({ where: { clientId: client.id } });
  // habit logs for last 14 days random
  for (const h of habits) {
    for (let i = 0; i < 14; i++) {
      if (Math.random() > 0.25) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        await prisma.habitLog.create({ data: { habitId: h.id, date: d, done: true } }).catch(() => {});
      }
    }
  }

  // workout sessions for last 10 workouts with sets
  const exercisesByDay: Record<string, string[]> = {
    "Пн": ["Жим лежачи", "Жим гантелей під кутом", "Розведення в кросовері", "Французький жим"],
    "Вт": ["Підтягування", "Тяга штанги в нахилі", "Тяга верхнього блоку", "Молотки"],
    "Чт": ["Присідання зі штангою", "Жим ногами", "Румунська тяга"],
    "Пт": ["Жим сидячи", "Махи в сторони", "Тяга до підборіддя"],
  };
  const days = Object.keys(exercisesByDay);
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i * 2);
    const day = days[i % days.length];
    const exs = exercisesByDay[day];
    const session = await prisma.workoutSession.create({
      data: {
        clientId: client.id,
        date: d,
        title: `Тренування: ${day}`,
        completed: true,
        durationSec: 60 * (50 + Math.round(Math.random() * 20)),
      },
    });
    for (const ex of exs) {
      const baseWeight = ex.includes("Жим лежачи") ? 80 + (12 - i) * 0.5
        : ex.includes("Присідання") ? 100 + (12 - i) * 0.7
        : ex.includes("Тяга штанги") ? 70 + (12 - i) * 0.3
        : 30 + Math.round(Math.random() * 10);
      for (let s = 0; s < 4; s++) {
        await prisma.sessionSet.create({
          data: {
            sessionId: session.id,
            exerciseName: ex,
            setIndex: s,
            weight: baseWeight + (Math.random() - 0.5) * 2,
            reps: 8 + Math.round(Math.random() * 2),
            completed: true,
          },
        });
      }
    }
  }

  await prisma.nutritionPlan.create({
    data: {
      clientId: client.id,
      title: "План харчування — дефіцит 400 ккал",
      calories: 2200,
      protein: 180,
      carbs: 220,
      fats: 70,
      content:
        "Сніданок: 3 яйця + вівсянка 80г + банан\nОбід: куряча грудка 200г + рис 150г + овочі\nПерекус: сир кисломолочний 200г + горіхи 20г\nВечеря: лосось 180г + броколі\n",
      notes: "Пити 2.5л води/день. Кава — до 14:00.",
    },
  });

  await prisma.trainingPlan.create({
    data: {
      clientId: client.id,
      title: "Сплит ПТГ × 4/тиж",
      daysPerWeek: 4,
      content:
        "Пн — Груди/Трицепс\n• Жим лежачи 4×8\n• Жим гантелей під кутом 3×10\n• Розведення 3×12\n• Французький жим 3×12\n\nВт — Спина/Біцепс\n• Підтягування 4× макс\n• Тяга штанги в нахилі 4×8\n• Тяга верхнього блоку 3×10\n• Молотки 3×12\n\nЧт — Ноги\n• Присідання 4×8 (обережно з лівим)\n• Жим ногами 4×12\n• Румунська тяга 3×10\n• Ікри 4×15\n\nПт — Плечі/Прес\n• Жим сидячи 4×8\n• Махи в сторони 3×12\n• Тяга до підборіддя 3×10\n• Прес 3×20",
      notes: "Розминка 10 хв, заминка 5 хв. Кардіо — 2 рази на тиждень по 25 хв.",
    },
  });

  await prisma.supplement.createMany({
    data: [
      { clientId: client.id, name: "Креатин моногідрат", dosage: "5г", schedule: "ранок", notes: "Щоденно, без циклу" },
      { clientId: client.id, name: "Whey протеїн", dosage: "30г", schedule: "після тренування", notes: "" },
      { clientId: client.id, name: "Омега-3", dosage: "2 капс", schedule: "з їжею", notes: "" },
      { clientId: client.id, name: "Вітамін D3", dosage: "2000 МО", schedule: "ранок", notes: "До квітня" },
    ],
  });

  await prisma.payment.createMany({
    data: [
      { clientId: client.id, amount: 4000, date: new Date("2026-01-05"), method: "card", status: "paid" },
      { clientId: client.id, amount: 4000, date: new Date("2026-02-05"), method: "card", status: "paid" },
      { clientId: client.id, amount: 4000, date: new Date("2026-03-05"), method: "card", status: "paid" },
      { clientId: client.id, amount: 4000, date: new Date("2026-04-05"), method: "cash", status: "paid" },
      { clientId: client.id, amount: 4000, date: new Date("2026-05-05"), method: "card", status: "pending" },
    ],
  });

  // 12 тижнів замірів
  const start = new Date("2026-02-01");
  for (let i = 0; i < 12; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    await prisma.measurement.create({
      data: {
        clientId: client.id,
        date: d,
        weight: 92 - i * 0.6 + (Math.random() - 0.5),
        waist: 96 - i * 0.5,
        chest: 104 + i * 0.1,
        arm: 36 + i * 0.05,
        hips: 102 - i * 0.3,
        bodyFat: 24 - i * 0.3,
      },
    });
  }

  // check-ins за 30 днів
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    await prisma.checkIn.create({
      data: {
        clientId: client.id,
        date: d,
        sleep: 6 + Math.random() * 2,
        mood: Math.ceil(3 + Math.random() * 2),
        energy: Math.ceil(3 + Math.random() * 2),
        weight: 88 - (30 - i) * 0.05 + (Math.random() - 0.5) * 0.3,
        water: 2 + Math.random(),
        steps: Math.round(6000 + Math.random() * 5000),
      },
    });
  }

  await prisma.achievement.createMany({
    data: [
      { clientId: client.id, title: "Перший тиждень!", description: "7 днів поспіль check-in", icon: "Flame" },
      { clientId: client.id, title: "-3 кг", description: "Перша вагова віха", icon: "TrendingDown" },
      { clientId: client.id, title: "10 тренувань", description: "Проведено і відмічено", icon: "Dumbbell" },
    ],
  });

  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() !== 0 && d.getDay() !== 3) {
      await prisma.workoutLog.create({
        data: {
          clientId: client.id,
          date: d,
          title: ["Груди/Трицепс", "Спина/Біцепс", "Ноги", "Плечі/Прес"][i % 4],
          completed: Math.random() > 0.2,
        },
      });
    }
  }

  await prisma.reminder.createMany({
    data: [
      { clientId: client.id, title: "Тренування: Ноги", type: "training", datetime: new Date(Date.now() + 86400000) },
      { clientId: client.id, title: "Прийняти креатин", type: "supplement", datetime: new Date(Date.now() + 3600000) },
      { clientId: client.id, title: "Щоденний check-in", type: "checkin", datetime: new Date(Date.now() + 7200000) },
    ],
  });

  await prisma.message.createMany({
    data: [
      { clientId: client.id, authorRole: "TRAINER", body: "Як почуваєш себе після вчорашнього?" },
      { clientId: client.id, authorRole: "CLIENT", body: "Тримаюсь! Коліно не турбує." },
    ],
  });

  // другий клієнт для адмінки
  const client2Pwd = await bcrypt.hash("client123", 10);
  await prisma.user.upsert({
    where: { email: "maria@koval.fit" },
    update: {},
    create: {
      email: "maria@koval.fit",
      password: client2Pwd,
      role: "CLIENT",
      firstName: "Марія",
      lastName: "Іваненко",
      phone: "+380999998877",
      birthday: new Date("1998-03-22"),
      goal: "Тонус + 3 кг м'язів",
      height: 168,
      startWeight: 58,
    },
  });

  console.log("✓ Seed complete");
  console.log("Trainer: trainer@koval.fit / trainer123");
  console.log("Client:  client@koval.fit  / client123");
}

main().finally(() => prisma.$disconnect());
