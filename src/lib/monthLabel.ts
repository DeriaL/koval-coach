// Pure (no server deps) so both server and client components can use it.
// "2026-06" -> "Червень 2026"
export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const s = new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("uk-UA", {
    month: "long", year: "numeric", timeZone: "Europe/Kyiv",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
