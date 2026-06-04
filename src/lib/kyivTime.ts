// ============================================================================
// Single source of truth for ALL timezone handling in the app.
//
// The app's users are in Ukraine (Europe/Kyiv). Vercel servers run in UTC, so
// any naive Date math/formatting silently drifts by 2-3 hours. To avoid the
// recurring "time is off by 3 hours" bug, EVERY date operation that the user
// can see must go through one of the helpers below. Never call `new Date(str)`
// on a form value, `.toLocaleString()` without a timeZone, or
// `.toISOString().slice(0,10)` for day-bucketing again.
// ============================================================================

export const KYIV_TZ = "Europe/Kyiv";

// ── internal: parts of a Date as seen in Kyiv ──────────────────────────────
const KYIV_PARTS_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: KYIV_TZ,
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
  hour12: false,
});

function kyivParts(d: Date) {
  const p = Object.fromEntries(
    KYIV_PARTS_FMT.formatToParts(d).map(x => [x.type, x.value])
  ) as Record<string, string>;
  let hour = +p.hour;
  if (hour === 24) hour = 0; // some engines emit "24" for midnight
  return {
    year: +p.year, month: +p.month, day: +p.day,
    hour, minute: +p.minute, second: +p.second,
  };
}

function kyivOffsetMinutes(refUtc: Date): number {
  const p = kyivParts(refUtc);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - refUtc.getTime()) / 60000);
}

// ── INPUT: string → Date ────────────────────────────────────────────────────

/**
 * Parse a naive "YYYY-MM-DDTHH:mm[:ss]" string (from <input type="datetime-local">)
 * as Kyiv local time → returns the correct UTC instant. DST-aware.
 */
export function parseKyivLocal(input: string | null | undefined): Date {
  if (!input) return new Date();
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(input)) return new Date(input); // already zoned
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return new Date(input);
  const y = +m[1], mo = +m[2], d = +m[3], h = +m[4], mi = +m[5], s = +(m[6] ?? "0");
  const naiveUtc = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
  const offset = kyivOffsetMinutes(naiveUtc);
  return new Date(naiveUtc.getTime() - offset * 60000);
}

/**
 * Parse a naive "YYYY-MM-DD" string (from <input type="date">) as Kyiv local
 * midnight → returns the correct UTC instant. Use for measurement/payment/photo
 * dates so they don't shift to the previous day on a UTC server.
 */
export function parseKyivDate(input: string | null | undefined): Date | null {
  if (!input) return null;
  const datePart = input.length > 10 ? input.slice(0, 10) : input;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  return parseKyivLocal(`${datePart}T00:00`);
}

// ── INPUT DEFAULTS: Date → string for <input> ───────────────────────────────

/** "YYYY-MM-DDTHH:mm" of a Date as it reads in Kyiv — default for datetime-local. */
export function formatKyivLocal(date: Date | null | undefined): string {
  const p = kyivParts(date ?? new Date());
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** "YYYY-MM-DD" of a Date as it reads in Kyiv — default for date inputs & day keys. */
export function kyivDayKey(date: Date | null | undefined): string {
  const p = kyivParts(date ?? new Date());
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

// "YYYY-MM" for the calendar month a moment falls into, in Kyiv time. Used to
// group sessions/payments into monthly buckets for the stats archive.
export function kyivMonthKey(date: Date | null | undefined): string {
  const p = kyivParts(date ?? new Date());
  return `${p.year}-${String(p.month).padStart(2, "0")}`;
}

// ── DAY-BOUNDARY MATH ───────────────────────────────────────────────────────

/**
 * The UTC instant of Kyiv midnight for "today" (or for the day containing `ref`).
 * Use everywhere you previously wrote `const t = new Date(); t.setHours(0,0,0,0)`.
 * A value `>= kyivStartOfToday()` correctly means "happened today in Kyiv".
 */
export function kyivStartOfDay(ref: Date = new Date()): Date {
  return parseKyivLocal(`${kyivDayKey(ref)}T00:00`);
}

export function kyivStartOfToday(): Date {
  return kyivStartOfDay(new Date());
}

/** UTC instant of Kyiv midnight on the 1st of the current month. */
export function kyivStartOfMonth(ref: Date = new Date()): Date {
  const p = kyivParts(ref);
  const pad = (n: number) => String(n).padStart(2, "0");
  return parseKyivLocal(`${p.year}-${pad(p.month)}-01T00:00`);
}

/** Add N whole days to a Kyiv-midnight instant (DST-safe — re-snaps to midnight). */
export function kyivAddDays(start: Date, days: number): Date {
  // Shift by ~days then re-snap to Kyiv midnight to survive DST transitions.
  const approx = new Date(start.getTime() + days * 86400000);
  return kyivStartOfDay(approx);
}

/** Weekday in Kyiv, Monday=0 … Sunday=6. */
export function kyivWeekday(date: Date): number {
  const p = kyivParts(date);
  // Build a UTC date from Kyiv Y/M/D and read its UTC weekday (stable).
  const dow = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay(); // Sun=0
  return (dow + 6) % 7; // Mon=0
}

// ── DISPLAY: Date → user-facing string (always Kyiv) ───────────────────────

type DateInput = Date | string | number | null | undefined;
function asDate(d: DateInput): Date | null {
  if (d == null) return null;
  const x = d instanceof Date ? d : new Date(d);
  return isNaN(x.getTime()) ? null : x;
}

/** Date only, e.g. "30.05.2026". Pass extra Intl options to customise. */
export function fmtKyivDate(d: DateInput, opts: Intl.DateTimeFormatOptions = {}): string {
  const date = asDate(d);
  if (!date) return "";
  return date.toLocaleDateString("uk-UA", { timeZone: KYIV_TZ, ...opts });
}

/** Date + time, e.g. "30.05.26, 15:30". */
export function fmtKyivDateTime(d: DateInput, opts: Intl.DateTimeFormatOptions = {}): string {
  const date = asDate(d);
  if (!date) return "";
  return date.toLocaleString("uk-UA", {
    timeZone: KYIV_TZ, dateStyle: "short", timeStyle: "short", ...opts,
  });
}

/** Time only, e.g. "15:30". */
export function fmtKyivTime(d: DateInput, opts: Intl.DateTimeFormatOptions = {}): string {
  const date = asDate(d);
  if (!date) return "";
  return date.toLocaleTimeString("uk-UA", {
    timeZone: KYIV_TZ, hour: "2-digit", minute: "2-digit", ...opts,
  });
}
