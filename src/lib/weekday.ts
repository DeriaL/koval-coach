// Single source of truth for week-day ordering across the app.
// The training week starts on Monday (Пн) and ends on Sunday (Нд).
export const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"] as const;

// Sort key for a stored day label. Unknown/empty days go to the END (not the
// start) — using indexOf directly would return -1 and float them to the top.
export function weekdayIndex(day: string | null | undefined): number {
  const i = WEEKDAYS.indexOf((day ?? "") as (typeof WEEKDAYS)[number]);
  return i === -1 ? 99 : i;
}
