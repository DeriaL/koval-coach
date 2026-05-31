// Helpers for storing/parsing supplement schedule as a tag string in the
// existing Supplement.schedule column. Format: "Ранок, Вечір · разом з їжею".
// Tags are time-of-day buckets; everything after "·" is free-text detail.

export const TIME_SLOTS = [
  { key: "morning",   label: "Ранок", emoji: "🌅" },
  { key: "day",       label: "День",  emoji: "☀️" },
  { key: "evening",   label: "Вечір", emoji: "🌙" },
] as const;

export type TimeSlotKey = (typeof TIME_SLOTS)[number]["key"];
export const TIME_SLOT_LABELS = TIME_SLOTS.map(s => s.label);

const NORMALIZE: Record<string, TimeSlotKey> = {
  "ранок": "morning", "ранку": "morning", "ранкою": "morning", "morning": "morning",
  "день": "day", "обід": "day", "обіду": "day", "вдень": "day", "day": "day",
  "вечір": "evening", "вечера": "evening", "ввечері": "evening", "вечером": "evening", "evening": "evening", "ніч": "evening",
};

export type ParsedSchedule = { slots: TimeSlotKey[]; extra: string };

export function parseSchedule(raw: string | null | undefined): ParsedSchedule {
  if (!raw) return { slots: [], extra: "" };
  const [head, ...rest] = raw.split("·");
  const extra = rest.join("·").trim();
  const slots = new Set<TimeSlotKey>();
  for (const tok of head.split(/[,;/]/).map(t => t.trim().toLowerCase()).filter(Boolean)) {
    const k = NORMALIZE[tok];
    if (k) slots.add(k);
  }
  return { slots: Array.from(slots), extra };
}

export function formatSchedule(slots: TimeSlotKey[], extra: string): string {
  const labels = TIME_SLOTS.filter(s => slots.includes(s.key)).map(s => s.label);
  const head = labels.join(", ");
  const tail = extra.trim();
  if (head && tail) return `${head} · ${tail}`;
  return head || tail;
}
