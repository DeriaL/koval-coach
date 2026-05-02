// Helpers to generate Google Calendar links and ICS files

type Sess = {
  id: string;
  title: string;
  scheduledAt: Date | string | null;
  date?: Date | string | null;
  notes?: string | null;
  durationSec?: number | null;
  client?: { firstName: string; lastName: string; email?: string | null } | null;
};

function pad(n: number) { return String(n).padStart(2, "0"); }
function toICSDate(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}
function escapeICS(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function startEnd(s: Sess) {
  const start = new Date(s.scheduledAt ?? s.date ?? new Date());
  const durMs = (s.durationSec ?? 60 * 60) * 1000; // default 60 min
  const end = new Date(start.getTime() + durMs);
  return { start, end };
}

/** Single event URL for Google Calendar quick-add */
export function googleCalendarUrl(s: Sess): string {
  const { start, end } = startEnd(s);
  const text = `${s.title}${s.client ? ` · ${s.client.firstName} ${s.client.lastName}` : ""}`;
  const details = [
    s.notes ? `Нотатка: ${s.notes}` : null,
    s.client ? `Клієнт: ${s.client.firstName} ${s.client.lastName}` : null,
    "Створено через KCoach",
  ].filter(Boolean).join("\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text,
    dates: `${toICSDate(start)}/${toICSDate(end)}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Generate ICS text for one or more sessions */
export function buildICS(sessions: Sess[], calName = "KCoach"): string {
  const now = toICSDate(new Date());
  const events = sessions.map((s) => {
    const { start, end } = startEnd(s);
    const summary = `${s.title}${s.client ? ` · ${s.client.firstName} ${s.client.lastName}` : ""}`;
    const desc = [
      s.notes ? `Нотатка: ${s.notes}` : null,
      s.client ? `Клієнт: ${s.client.firstName} ${s.client.lastName}` : null,
      "Створено через KCoach",
    ].filter(Boolean).join("\\n");
    return [
      "BEGIN:VEVENT",
      `UID:${s.id}@koval.coach`,
      `DTSTAMP:${now}`,
      `DTSTART:${toICSDate(start)}`,
      `DTEND:${toICSDate(end)}`,
      `SUMMARY:${escapeICS(summary)}`,
      `DESCRIPTION:${escapeICS(desc)}`,
      "END:VEVENT",
    ].join("\r\n");
  }).join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//KCoach//${calName}//UK`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICS(calName)}`,
    events,
    "END:VCALENDAR",
  ].join("\r\n");
}
