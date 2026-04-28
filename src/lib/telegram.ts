import { prisma } from "./prisma";

const TG_API = "https://api.telegram.org/bot";

function token() {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  return t || null;
}

/** Low-level: send a Telegram message to a chatId. Silent fails if no token / no chatId. */
export async function sendTelegram(chatId: string | null | undefined, text: string, opts?: { keyboard?: any }) {
  const t = token();
  if (!t || !chatId) return { ok: false, reason: "no-token-or-chat" };
  try {
    const body: any = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };
    if (opts?.keyboard) body.reply_markup = opts.keyboard;
    const res = await fetch(`${TG_API}${t}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("telegram send failed", res.status, t);
    }
    return { ok: res.ok };
  } catch (e) {
    console.error("telegram send error", e);
    return { ok: false, reason: "fetch-error" };
  }
}

/** Send notification to a user by their userId (looks up chatId). */
export async function notifyUser(userId: string, text: string) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { telegramChatId: true } });
  if (!u?.telegramChatId) return;
  await sendTelegram(u.telegramChatId, text);
}

/** Send to all trainers (e.g. when a client cancels). */
export async function notifyAllTrainers(text: string) {
  const trainers = await prisma.user.findMany({
    where: { role: "TRAINER", telegramChatId: { not: null } },
    select: { telegramChatId: true },
  });
  await Promise.all(trainers.map(t => sendTelegram(t.telegramChatId, text)));
}

/** Generate a one-time link code and return it (creates if missing). */
export async function getOrCreateLinkCode(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { telegramLinkCode: true, telegramChatId: true } });
  if (!u) throw new Error("User not found");
  if (u.telegramChatId) return ""; // already linked
  if (u.telegramLinkCode) return u.telegramLinkCode;
  const code = `kc_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
  await prisma.user.update({ where: { id: userId }, data: { telegramLinkCode: code } });
  return code;
}

/** Public bot username (set via env). */
export function botUsername() {
  return process.env.TELEGRAM_BOT_USERNAME || "";
}
