import { prisma } from "./prisma";
import { randomBytes } from "crypto";

const TG_API = "https://api.telegram.org/bot";

/**
 * Escape HTML special chars before inserting USER-CONTROLLED text into a
 * parse_mode:"HTML" Telegram message. Without this, a client whose name or
 * review contains "<" / ">" / "&" could break formatting or inject markup.
 * Apply ONLY to dynamic/user data — never to the literal <b> tags we add.
 */
export function tgEscape(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function token() {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  return t || null;
}

// ── Sections ────────────────────────────────────────────────────────────────
// Used as headers on outgoing notifications so the user can scroll back
// and immediately see WHICH part of the app the message is about.
export const SECTIONS = {
  training: { emoji: "🏋️", title: "Мої тренування", command: "training" },
  payments: { emoji: "💳", title: "Мої оплати",    command: "payments" },
  updates:  { emoji: "🔔", title: "Оновлення",      command: "updates" },
} as const;

export type Section = keyof typeof SECTIONS;

/** Build the section header line prepended to a notification. */
function sectionHeader(section: Section): string {
  const s = SECTIONS[section];
  return `<b>${s.emoji} ${s.title}</b>\n`;
}

/** Persistent reply keyboard with the three section buttons. */
export const MAIN_KEYBOARD = {
  keyboard: [
    [{ text: `${SECTIONS.training.emoji} ${SECTIONS.training.title}` }],
    [
      { text: `${SECTIONS.payments.emoji} ${SECTIONS.payments.title}` },
      { text: `${SECTIONS.updates.emoji} ${SECTIONS.updates.title}` },
    ],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

/** Low-level: send a Telegram message to a chatId. Silent fails if no token / no chatId. */
export async function sendTelegram(chatId: string | null | undefined, text: string, opts?: { keyboard?: any; noKeyboard?: boolean }) {
  const t = token();
  if (!t || !chatId) return { ok: false, reason: "no-token-or-chat" };
  try {
    const body: any = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };
    // Default to the persistent main keyboard unless caller opts out or provides a custom one
    if (opts?.keyboard) body.reply_markup = opts.keyboard;
    else if (!opts?.noKeyboard) body.reply_markup = MAIN_KEYBOARD;

    const res = await fetch(`${TG_API}${t}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("telegram send failed", res.status, errText);
    }
    return { ok: res.ok };
  } catch (e) {
    console.error("telegram send error", e);
    return { ok: false, reason: "fetch-error" };
  }
}

/** Send notification to a user by their userId, prefixed with a section header. */
export async function notifyUser(userId: string, section: Section, text: string) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { telegramChatId: true } });
  if (!u?.telegramChatId) return;
  await sendTelegram(u.telegramChatId, sectionHeader(section) + text);
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
  // Cryptographically-secure, 128-bit link code (not guessable/enumerable).
  const code = `kc_${randomBytes(16).toString("hex")}`;
  await prisma.user.update({ where: { id: userId }, data: { telegramLinkCode: code } });
  return code;
}

/** Public bot username (set via env). */
export function botUsername() {
  return process.env.TELEGRAM_BOT_USERNAME || "";
}
