import { ImageResponse } from "next/og";

export const runtime = "edge";

const SIZES: Record<string, { w: number; h: number; tile: number; gap: number; font: number; radius: number; iconSize: number }> = {
  // Default — matches the splash header look (~340 × 96)
  default: { w: 1024, h: 320, tile: 200, gap: 28, font: 130, radius: 56, iconSize: 110 },
  // Small (favicon-style horizontal)
  sm:      { w: 512,  h: 160, tile: 100, gap: 14, font: 64,  radius: 28, iconSize: 56  },
  // Square — just the logo tile, no text
  square:  { w: 1024, h: 1024, tile: 800, gap: 0,  font: 0,   radius: 220, iconSize: 440 },
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const variant = url.searchParams.get("v") ?? "default";
  const cfg = SIZES[variant] ?? SIZES.default;
  const bg = url.searchParams.get("bg") ?? "transparent";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: cfg.gap,
          background:
            bg === "dark"
              ? "#090b1a"
              : bg === "light"
              ? "#f4f6ff"
              : "transparent",
          padding: variant === "square" ? 0 : 40,
        }}
      >
        {/* Tile with gradient + dumbbell */}
        <div
          style={{
            width: cfg.tile,
            height: cfg.tile,
            borderRadius: cfg.radius,
            background: "linear-gradient(135deg, #3884ff 0%, #6366f1 55%, #a78bfa 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 24px 80px -16px rgba(99,102,241,.55)",
          }}
        >
          <svg
            width={cfg.iconSize}
            height={cfg.iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.4 14.4 9.6 9.6" />
            <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" />
            <path d="m21.5 21.5-1.4-1.4" />
            <path d="M3.9 3.9 2.5 2.5" />
            <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" />
          </svg>
        </div>

        {/* Wordmark */}
        {variant !== "square" && (
          <div
            style={{
              display: "flex",
              fontSize: cfg.font,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: bg === "light" ? "#0f1226" : "#ffffff",
              fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
            }}
          >
            <span>Koval</span>
            <span
              style={{
                background: "linear-gradient(135deg, #6366f1, #3884ff)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Fit
            </span>
          </div>
        )}
      </div>
    ),
    { width: cfg.w, height: cfg.h }
  );
}
