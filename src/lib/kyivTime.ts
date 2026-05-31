// Helpers for converting <input type="datetime-local"> values (which have no
// timezone) to a real Date, treating the input as Kyiv local time. DST-aware
// — uses Intl to look up the correct Europe/Kyiv offset for the given date.

const KYIV_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Kyiv",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
  hour12: false,
});

function kyivOffsetMinutes(refUtc: Date): number {
  const parts = Object.fromEntries(
    KYIV_FMT.formatToParts(refUtc).map(p => [p.type, p.value])
  ) as Record<string, string>;
  const kyivAsUtc = Date.UTC(
    +parts.year, +parts.month - 1, +parts.day,
    +parts.hour, +parts.minute, +parts.second
  );
  return Math.round((kyivAsUtc - refUtc.getTime()) / 60000);
}

// "YYYY-MM-DDTHH:mm" string of a Date as it would read in Kyiv — used as the
// default value for <input type="datetime-local"> so what the picker shows
// matches the picker's "local time" semantics from the user's perspective.
export function formatKyivLocal(date: Date | null | undefined): string {
  const d = date ?? new Date();
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Kyiv",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
  // sv-SE formats as "YYYY-MM-DD HH:mm" — swap the space for the ISO 'T'.
  return fmt.format(d).replace(" ", "T");
}

/**
 * Parse a naive "YYYY-MM-DDTHH:mm[:ss]" string as Kyiv local time and return
 * a Date pointing at the correct UTC instant. Falls back to native parsing
 * for any other format (ISO with timezone, etc.).
 */
export function parseKyivLocal(input: string | null | undefined): Date {
  if (!input) return new Date();
  // Already has timezone → just parse natively.
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(input)) return new Date(input);

  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return new Date(input);

  const y = +m[1], mo = +m[2], d = +m[3], h = +m[4], mi = +m[5], s = +(m[6] ?? "0");
  // First take parts as-if-UTC to get a reference instant, then subtract the
  // Kyiv offset at that moment to get the true UTC time.
  const naiveUtc = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
  const offset = kyivOffsetMinutes(naiveUtc);
  return new Date(naiveUtc.getTime() - offset * 60000);
}
