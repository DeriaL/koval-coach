import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegram } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
        `<b>👋 Вітаю у Koval Coach!</b>\n\nЩоб привʼязати акаунт — відкрий цей чат через посилання з кабінету (Профіль → Підключити Telegram).\n\nЯкщо акаунт вже привʼязаний — використовуй команди:\n/help — список команд\n/sessions — найближчі тренування\n/unlink — відʼєднати акаунт`
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
      `✅ <b>Привʼязано!</b>\n\nАкаунт: <b>${user.firstName} ${user.lastName}</b> (${role})\n\nТепер сюди приходитимуть сповіщення про тренування, підтвердження, оплати тощо.\n\n/help — команди\n/unlink — відʼєднати`
    );
    return NextResponse.json({ ok: true });
  }

  // For all other commands — require linked user
  const user = await prisma.user.findFirst({ where: { telegramChatId: chatId } });
  if (!user) {
    await sendTelegram(chatId, `Спочатку привʼяжи акаунт через /start <код> з кабінету.`);
    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("/help")) {
    await sendTelegram(chatId,
      `<b>Команди:</b>\n` +
      `/sessions — найближчі тренування\n` +
      `/me — інформація про акаунт\n` +
      `/unlink — відʼєднати акаунт\n` +
      `/help — це повідомлення`
    );
    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("/me")) {
    await sendTelegram(chatId,
      `<b>${user.firstName} ${user.lastName}</b>\n${user.email}\nРоль: <b>${user.role === "TRAINER" ? "Тренер" : "Клієнт"}</b>${user.coachingPlan === "ONLINE" ? " · Онлайн" : user.role === "CLIENT" ? " · Офлайн" : ""}`
    );
    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("/unlink")) {
    await prisma.user.update({ where: { id: user.id }, data: { telegramChatId: null, telegramUsername: null } });
    await sendTelegram(chatId, `✅ Акаунт відʼєднано. Щоб привʼязати знову — згенеруй новий код у кабінеті.`);
    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("/sessions")) {
    const now = new Date();
    const upcoming = await prisma.workoutSession.findMany({
      where: user.role === "TRAINER"
        ? { scheduledAt: { gte: now }, completed: false, confirmedByTrainer: false, cancelledAt: null, client: { role: "CLIENT" } }
        : { clientId: user.id, scheduledAt: { gte: now }, completed: false, confirmedByTrainer: false, cancelledAt: null },
      include: { client: { select: { firstName: true, lastName: true } } },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    });
    if (upcoming.length === 0) {
      await sendTelegram(chatId, `Найближчих тренувань немає.`);
    } else {
      const lines = upcoming.map(s => {
        const dt = new Date(s.scheduledAt!).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" });
        const who = user.role === "TRAINER" ? ` · ${s.client.firstName} ${s.client.lastName}` : "";
        return `• <b>${dt}</b> — ${s.title}${who}`;
      });
      await sendTelegram(chatId, `<b>Найближчі тренування:</b>\n${lines.join("\n")}`);
    }
    return NextResponse.json({ ok: true });
  }

  // Default
  await sendTelegram(chatId, `Не розумію команду. /help — список доступних.`);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Telegram webhook endpoint" });
}
