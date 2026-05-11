import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegram, SECTIONS } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BTN_TRAINING = `${SECTIONS.training.emoji} ${SECTIONS.training.title}`;
const BTN_PAYMENTS = `${SECTIONS.payments.emoji} ${SECTIONS.payments.title}`;
const BTN_UPDATES  = `${SECTIONS.updates.emoji} ${SECTIONS.updates.title}`;

function fmtDateTime(d: Date) {
  return new Date(d).toLocaleString("uk-UA", {
    dateStyle: "short", timeStyle: "short", timeZone: "Europe/Kyiv",
  });
}
function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("uk-UA", { day: "2-digit", month: "long" });
}

export async function POST(req: Request) {
  // Optional shared secret check via header
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (got !== secret) return new NextResponse("forbidden", { status: 403 });
  }

  let update: any;
  try { update = await req.json(); } catch { return NextResponse.json({ ok: true }); }

  const msg = update?.message;
  if (!msg) return NextResponse.json({ ok: true });

  const chatId = String(msg.chat?.id || "");
  const username = msg.from?.username ? `@${msg.from.username}` : "";
  const text: string = msg.text || "";

  // /start <code>
  const startMatch = text.match(/^\/start(?:\s+(\S+))?/);
  if (startMatch) {
    const code = startMatch[1];
    if (!code) {
      await sendTelegram(chatId,
        `<b>👋 Вітаю у KovalFit!</b>\n\n` +
        `Щоб привʼязати акаунт, відкрий цей чат через посилання з кабінету (Профіль → Підключити Telegram).\n\n` +
        `Якщо акаунт вже привʼязаний — користуйся кнопками знизу або командами:\n` +
        `/training — мої тренування\n` +
        `/payments — мої оплати\n` +
        `/updates — оновлення в кабінеті\n` +
        `/help — список команд`
      );
      return NextResponse.json({ ok: true });
    }
    const user = await prisma.user.findUnique({ where: { telegramLinkCode: code } });
    if (!user) {
      await sendTelegram(chatId, `❌ Код невалідний або застарів. Згенеруй новий у кабінеті.`);
      return NextResponse.json({ ok: true });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { telegramChatId: chatId, telegramUsername: username || null, telegramLinkCode: null },
    });
    const role = user.role === "TRAINER" ? "тренер" : "клієнт";
    await sendTelegram(chatId,
      `✅ <b>Привʼязано!</b>\n\n` +
      `Акаунт: <b>${user.firstName} ${user.lastName}</b> (${role})\n\n` +
      `Тепер сюди приходитимуть сповіщення. Кнопки знизу — для швидкого доступу до розділів.\n\n` +
      `/help — список команд`
    );
    return NextResponse.json({ ok: true });
  }

  // For all other commands — require linked user
  const user = await prisma.user.findFirst({ where: { telegramChatId: chatId } });
  if (!user) {
    await sendTelegram(chatId, `Спочатку привʼяжи акаунт через /start <код> з кабінету.`);
    return NextResponse.json({ ok: true });
  }

  // ── /help ────────────────────────────────────────────────────────────────
  if (text.startsWith("/help")) {
    await sendTelegram(chatId,
      `<b>Команди:</b>\n` +
      `/training — ${SECTIONS.training.emoji} мої тренування\n` +
      `/payments — ${SECTIONS.payments.emoji} мої оплати\n` +
      `/updates — ${SECTIONS.updates.emoji} останні оновлення\n` +
      `/me — інформація про акаунт\n` +
      `/unlink — відʼєднати акаунт\n` +
      `/help — це повідомлення`
    );
    return NextResponse.json({ ok: true });
  }

  // ── /me ──────────────────────────────────────────────────────────────────
  if (text.startsWith("/me")) {
    await sendTelegram(chatId,
      `<b>${user.firstName} ${user.lastName}</b>\n${user.email}\nРоль: <b>${user.role === "TRAINER" ? "Тренер" : "Клієнт"}</b>${user.coachingPlan === "ONLINE" ? " · Онлайн" : user.role === "CLIENT" ? " · Офлайн" : ""}`
    );
    return NextResponse.json({ ok: true });
  }

  // ── /unlink ──────────────────────────────────────────────────────────────
  if (text.startsWith("/unlink")) {
    await prisma.user.update({ where: { id: user.id }, data: { telegramChatId: null, telegramUsername: null } });
    await sendTelegram(chatId, `✅ Акаунт відʼєднано. Щоб привʼязати знову — згенеруй новий код у кабінеті.`, { noKeyboard: true });
    return NextResponse.json({ ok: true });
  }

  // ── 🏋️ Мої тренування (/training, /sessions, button) ─────────────────────
  if (text.startsWith("/training") || text.startsWith("/sessions") || text === BTN_TRAINING) {
    const now = new Date();
    const upcoming = await prisma.workoutSession.findMany({
      where: user.role === "TRAINER"
        ? { scheduledAt: { gte: now }, completed: false, confirmedByTrainer: false, cancelledAt: null, client: { role: "CLIENT" } }
        : { clientId: user.id, scheduledAt: { gte: now }, completed: false, confirmedByTrainer: false, cancelledAt: null },
      include: { client: { select: { firstName: true, lastName: true } } },
      orderBy: { scheduledAt: "asc" },
      take: 7,
    });

    const recent = await prisma.workoutSession.findMany({
      where: user.role === "TRAINER"
        ? { OR: [{ completed: true }, { confirmedByTrainer: true }], client: { role: "CLIENT" } }
        : { clientId: user.id, OR: [{ completed: true }, { confirmedByTrainer: true }] },
      include: { client: { select: { firstName: true, lastName: true } } },
      orderBy: { date: "desc" },
      take: 5,
    });

    const head = `<b>${SECTIONS.training.emoji} ${SECTIONS.training.title}</b>\n`;
    const upcomingLines = upcoming.length
      ? upcoming.map(s => {
          const who = user.role === "TRAINER" ? ` · ${s.client.firstName} ${s.client.lastName}` : "";
          return `• <b>${fmtDateTime(s.scheduledAt!)}</b> — ${s.title}${who}`;
        }).join("\n")
      : "— немає запланованих";

    const recentLines = recent.length
      ? recent.map(s => {
          const who = user.role === "TRAINER" ? ` · ${s.client.firstName} ${s.client.lastName}` : "";
          return `• ${fmtDate(s.date)} — ${s.title}${who}`;
        }).join("\n")
      : "— ще не було тренувань";

    await sendTelegram(chatId,
      `${head}\n<b>📅 Найближчі:</b>\n${upcomingLines}\n\n<b>✅ Останні виконані:</b>\n${recentLines}`
    );
    return NextResponse.json({ ok: true });
  }

  // ── 💳 Мої оплати (/payments, button) ────────────────────────────────────
  if (text.startsWith("/payments") || text === BTN_PAYMENTS) {
    if (user.role === "TRAINER") {
      // Show pending invoices across all clients
      const pendings = await prisma.payment.findMany({
        where: { status: { in: ["pending", "overdue"] }, client: { role: "CLIENT" } },
        include: { client: { select: { firstName: true, lastName: true } } },
        orderBy: { date: "desc" },
        take: 10,
      });
      const head = `<b>${SECTIONS.payments.emoji} ${SECTIONS.payments.title}</b>\n`;
      if (pendings.length === 0) {
        await sendTelegram(chatId, `${head}\nНемає невиплачених рахунків.`);
      } else {
        const lines = pendings.map(p => {
          const status = p.status === "overdue" ? "⚠️ прострочено" : "очікує";
          return `• <b>${p.client.firstName} ${p.client.lastName}</b> · ${p.amount.toLocaleString("uk-UA")} ${p.currency} · ${status}`;
        }).join("\n");
        await sendTelegram(chatId, `${head}\n<b>🔻 До оплати:</b>\n${lines}`);
      }
      return NextResponse.json({ ok: true });
    }

    // Client: paid / pending overview + last few records
    const list = await prisma.payment.findMany({
      where: { clientId: user.id },
      orderBy: { date: "desc" },
      take: 8,
    });

    const paid = list.filter(p => p.status === "paid");
    const pending = list.filter(p => p.status === "pending" || p.status === "overdue");
    const totalPaid = paid.reduce((s, p) => s + p.amount, 0);

    const head = `<b>${SECTIONS.payments.emoji} ${SECTIONS.payments.title}</b>\n`;

    const pendingLine = pending.length
      ? `\n<b>⏳ Очікує оплати:</b> ${pending[0].amount.toLocaleString("uk-UA")} ${pending[0].currency}\n`
      : "";

    const historyLines = list.length
      ? list.slice(0, 6).map(p => {
          const icon = p.status === "paid" ? "✅" : p.status === "overdue" ? "⚠️" : "⏳";
          return `${icon} ${fmtDate(p.date)} — ${p.amount.toLocaleString("uk-UA")} ${p.currency}`;
        }).join("\n")
      : "— платежів поки немає";

    await sendTelegram(chatId,
      `${head}` +
      `\n<b>Загалом сплачено:</b> ${totalPaid.toLocaleString("uk-UA")} ₴` +
      `\n<b>Пакетів:</b> ${paid.length}` +
      pendingLine +
      `\n<b>📜 Історія:</b>\n${historyLines}`
    );
    return NextResponse.json({ ok: true });
  }

  // ── 🔔 Оновлення (/updates, button) ──────────────────────────────────────
  if (text.startsWith("/updates") || text === BTN_UPDATES) {
    const since = new Date(Date.now() - 14 * 86400_000); // last 14 days
    const head = `<b>${SECTIONS.updates.emoji} ${SECTIONS.updates.title}</b>\n<i>останні 14 днів</i>\n`;

    if (user.role === "TRAINER") {
      // Recent client activity feed
      const [sessions, checkIns, prs] = await Promise.all([
        prisma.workoutSession.findMany({
          where: { OR: [{ completed: true }, { confirmedByTrainer: true }], date: { gte: since }, client: { role: "CLIENT" } },
          include: { client: { select: { firstName: true, lastName: true } } },
          orderBy: { date: "desc" }, take: 8,
        }),
        prisma.checkIn.findMany({
          where: { date: { gte: since }, client: { role: "CLIENT" } },
          include: { client: { select: { firstName: true, lastName: true } } },
          orderBy: { date: "desc" }, take: 5,
        }),
        prisma.sessionSet.findMany({
          where: { isPR: true, session: { date: { gte: since }, completed: true, client: { role: "CLIENT" } } },
          include: { session: { include: { client: { select: { firstName: true, lastName: true } } } } },
          orderBy: { createdAt: "desc" }, take: 5,
        }),
      ]);

      const sLines = sessions.length
        ? sessions.map(s => `• ${fmtDate(s.date)} — <b>${s.client.firstName} ${s.client.lastName}</b> · ${s.title}`).join("\n")
        : "— немає";
      const cLines = checkIns.length
        ? checkIns.map(c => `• ${fmtDate(c.date)} — <b>${c.client.firstName} ${c.client.lastName}</b>${c.weight ? ` · ${c.weight.toFixed(1)} кг` : ""}`).join("\n")
        : "— немає";
      const pLines = prs.length
        ? prs.map(p => `• ${fmtDate(p.session.date)} — <b>${p.session.client.firstName} ${p.session.client.lastName}</b> · ${p.exerciseName} ${p.weight?.toFixed(1) ?? "?"}×${p.reps}`).join("\n")
        : "— немає";

      await sendTelegram(chatId,
        `${head}\n<b>💪 Тренування:</b>\n${sLines}\n\n<b>📝 Check-in:</b>\n${cLines}\n\n<b>🏆 Рекорди:</b>\n${pLines}`
      );
      return NextResponse.json({ ok: true });
    }

    // Client view: changes the trainer made in their cabinet recently
    const [nutritionPlans, trainingPlans, supplements, measurements, photos, achievements] = await Promise.all([
      prisma.nutritionPlan.findMany({ where: { clientId: user.id, updatedAt: { gte: since } }, orderBy: { updatedAt: "desc" }, take: 3 }),
      prisma.trainingPlan.findMany({ where: { clientId: user.id, updatedAt: { gte: since } }, orderBy: { updatedAt: "desc" }, take: 3 }),
      prisma.supplement.findMany({ where: { clientId: user.id, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.measurement.findMany({ where: { clientId: user.id, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 3 }),
      prisma.progressPhoto.findMany({ where: { clientId: user.id, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.achievement.findMany({ where: { clientId: user.id, earnedAt: { gte: since } }, orderBy: { earnedAt: "desc" }, take: 5 }),
    ]);

    const lines: string[] = [];
    if (trainingPlans.length) {
      lines.push(`<b>💪 Програми тренувань:</b>\n` + trainingPlans.map(p => `• ${fmtDate(p.updatedAt)} — «${p.title}»`).join("\n"));
    }
    if (nutritionPlans.length) {
      lines.push(`<b>🍎 Плани харчування:</b>\n` + nutritionPlans.map(p => `• ${fmtDate(p.updatedAt)} — «${p.title}»`).join("\n"));
    }
    if (supplements.length) {
      lines.push(`<b>💊 Добавки:</b>\n` + supplements.map(s => `• ${fmtDate(s.createdAt)} — «${s.name}»`).join("\n"));
    }
    if (measurements.length) {
      lines.push(`<b>📏 Заміри:</b>\n` + measurements.map(m => `• ${fmtDate(m.date)}${m.weight ? ` · ${m.weight.toFixed(1)} кг` : ""}`).join("\n"));
    }
    if (photos.length) {
      lines.push(`<b>📸 Фото:</b>\n` + photos.map(p => `• ${fmtDate(p.date)}${p.angle ? ` · ${p.angle}` : ""}`).join("\n"));
    }
    if (achievements.length) {
      lines.push(`<b>🏆 Ачівки:</b>\n` + achievements.map(a => `• ${fmtDate(a.earnedAt)} — «${a.title}»`).join("\n"));
    }

    const body = lines.length ? lines.join("\n\n") : "Без змін за цей період.";
    await sendTelegram(chatId, `${head}\n${body}`);
    return NextResponse.json({ ok: true });
  }

  // Default
  await sendTelegram(chatId, `Не розумію. Скористайся кнопками знизу або командою /help.`);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Telegram webhook endpoint" });
}
