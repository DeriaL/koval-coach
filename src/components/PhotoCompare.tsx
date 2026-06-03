"use client";
import { useMemo, useState } from "react";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import { ArrowLeftRight } from "lucide-react";

// Before/after progress photo slider — shared by the client photos page and the
// trainer's admin photos section.
export function PhotoCompare({ before, after }: { before: string; after: string }) {
  return (
    <ReactCompareSlider
      itemOne={<ReactCompareSliderImage src={before} alt="до" />}
      itemTwo={<ReactCompareSliderImage src={after} alt="після" />}
      style={{ borderRadius: 16, maxHeight: "70vh", aspectRatio: "3 / 4" }}
    />
  );
}

const ANGLE_LABEL: Record<string, string> = { front: "Спереду", side: "Збоку", back: "Ззаду" };

type CmpPhoto = { id: string; url: string; date: string | Date; angle?: string | null };

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv" });
}

// Interactive comparison: pick any two photos and optionally filter by angle.
// Falls back to a simple oldest-vs-newest when fewer than 2 photos.
export function PhotoComparePicker({ photos }: { photos: CmpPhoto[] }) {
  // Sorted oldest → newest, normalised dates.
  const sorted = useMemo(
    () => [...photos].sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    [photos]
  );

  // Which angles are present, in a stable order.
  const angles = useMemo(() => {
    const order = ["front", "side", "back"];
    const present = new Set(sorted.map((p) => p.angle || "").filter(Boolean));
    return order.filter((a) => present.has(a));
  }, [sorted]);

  const [angle, setAngle] = useState<string>(""); // "" = всі ракурси

  // Photos available after the angle filter.
  const filtered = useMemo(
    () => (angle ? sorted.filter((p) => (p.angle || "") === angle) : sorted),
    [sorted, angle]
  );

  // Default: oldest as "before", newest as "after".
  const [beforeId, setBeforeId] = useState<string>(sorted[0]?.id ?? "");
  const [afterId, setAfterId] = useState<string>(sorted.at(-1)?.id ?? "");

  // When the angle filter changes, snap the picks back into the available set.
  const beforePhoto =
    filtered.find((p) => p.id === beforeId) ?? filtered[0];
  const afterPhoto =
    filtered.find((p) => p.id === afterId) ?? filtered.at(-1);

  if (sorted.length < 2) return null;

  const enoughInAngle = filtered.length >= 2;

  return (
    <div>
      {/* Angle filter */}
      {angles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button
            type="button"
            onClick={() => setAngle("")}
            className={`chip text-xs ${angle === "" ? "border-accent text-accent bg-accent/10" : "text-muted"}`}
          >
            Усі ракурси
          </button>
          {angles.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAngle(a)}
              className={`chip text-xs ${angle === a ? "border-accent text-accent bg-accent/10" : "text-muted"}`}
            >
              {ANGLE_LABEL[a] ?? a}
            </button>
          ))}
        </div>
      )}

      {!enoughInAngle ? (
        <div className="card p-6 text-center text-sm text-muted">
          У цьому ракурсі поки менше двох фото
        </div>
      ) : (
        <>
          {/* Photo pickers */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 mb-3">
            <div>
              <label className="label flex items-center gap-1 text-xs">До</label>
              <select
                className="select text-sm"
                value={beforePhoto?.id ?? ""}
                onChange={(e) => setBeforeId(e.target.value)}
              >
                {filtered.map((p) => (
                  <option key={p.id} value={p.id}>
                    {fmtDate(p.date)}
                    {p.angle ? ` · ${ANGLE_LABEL[p.angle] ?? p.angle}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                setBeforeId(afterPhoto?.id ?? "");
                setAfterId(beforePhoto?.id ?? "");
              }}
              className="btn px-3 py-2 mb-0.5"
              aria-label="Поміняти місцями"
              title="Поміняти місцями"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <div>
              <label className="label flex items-center gap-1 text-xs">Після</label>
              <select
                className="select text-sm"
                value={afterPhoto?.id ?? ""}
                onChange={(e) => setAfterId(e.target.value)}
              >
                {filtered.map((p) => (
                  <option key={p.id} value={p.id}>
                    {fmtDate(p.date)}
                    {p.angle ? ` · ${ANGLE_LABEL[p.angle] ?? p.angle}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {beforePhoto && afterPhoto && (
            <>
              <PhotoCompare before={beforePhoto.url} after={afterPhoto.url} />
              <div className="flex justify-between text-xs text-muted mt-2">
                <span>{fmtDate(beforePhoto.date)}</span>
                <span>{fmtDate(afterPhoto.date)}</span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
