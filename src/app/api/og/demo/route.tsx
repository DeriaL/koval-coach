import { ImageResponse } from "next/og";

export const runtime = "edge";

// Phone-screen-shaped mockups (390 × 844 — iPhone 14 viewport) of key
// product screens. Used by the landing-page showcase section.
//
// /api/og/demo?screen=dashboard
// /api/og/demo?screen=training
// /api/og/demo?screen=recipes
// /api/og/demo?screen=analytics

const W = 390;
const H = 844;

// Common style helpers
const BG = "#090b1a";
const SURFACE = "#0f1226";
const CARD = "#13162b";
const BORDER = "#262940";
const TEXT = "#e9ebf5";
const MUTED = "#8b8fa8";
const ACCENT = "#6366f1";
const ACCENT2 = "#3884ff";
const SUCCESS = "#10b981";
const DANGER = "#ef4444";
const YELLOW = "#facc15";

function StatusBar() {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "12px 22px 8px", fontSize: 13, fontWeight: 600, color: TEXT,
    }}>
      <span>11:42</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 11, opacity: 0.9 }}>●●●</span>
        <span style={{ fontSize: 11, opacity: 0.9 }}>📶</span>
        <span style={{ fontSize: 11, opacity: 0.9 }}>🔋</span>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 16px 16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: `linear-gradient(135deg, ${ACCENT2}, ${ACCENT})`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ color: "white", fontSize: 18, fontWeight: 900 }}>K</span>
        </div>
        <span style={{ color: TEXT, fontWeight: 900, fontSize: 18 }}>
          Koval<span style={{
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
            backgroundClip: "text", color: "transparent",
          }}>Fit</span>
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12, background: CARD,
          border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center",
          color: ACCENT, fontSize: 16,
        }}>🌙</div>
        <div style={{
          width: 36, height: 36, borderRadius: 12, background: CARD,
          border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center",
          color: TEXT, fontSize: 16,
        }}>≡</div>
      </div>
    </div>
  );
}

function BottomNav() {
  const items = ["Головна", "Check-in", "В залі", "Аналітика", "Профіль"];
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: SURFACE, borderTop: `1px solid ${BORDER}`,
      display: "flex", justifyContent: "space-around", padding: "8px 0 20px",
    }}>
      {items.map((label, i) => (
        <div key={label} style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 4, fontSize: 10, color: i === 0 ? ACCENT : MUTED,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: i === 0 ? `${ACCENT}33` : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14,
          }}>{["⬚", "🔥", "▶", "📈", "👤"][i]}</div>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SCREEN 1: Dashboard with progress rings
// ────────────────────────────────────────────────────────────────────────────
function DashboardScreen() {
  return (
    <div style={{
      width: W, height: H, background: BG, color: TEXT, position: "relative",
      display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif",
    }}>
      <StatusBar />
      <TopBar />

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column" }}>
        <div style={{
          fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em",
          background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
          backgroundClip: "text", color: "transparent",
        }}>Привіт, Антон 👋</div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>Час підкорювати новий день! 🚀</div>
      </div>

      {/* Rings card */}
      <div style={{
        margin: "20px 16px 0", padding: 20, background: CARD,
        border: `1px solid ${BORDER}`, borderRadius: 24,
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Сьогоднішні кільця</span>
          <span style={{ fontSize: 11, color: MUTED }}>понеділок, 9 травня</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
          <Ring label="CHECK-IN" value="1/1" color={ACCENT} pct={100} />
          <Ring label="ЗВИЧКИ" value="3/4" color={ACCENT2} pct={75} />
          <Ring label="ВОДА" value="2/3" color="#60a5fa" pct={66} />
          <Ring label="КРОКИ" value="7.5k/10k" color="#f472b6" pct={75} />
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ margin: "16px 16px 0", display: "flex", gap: 10 }}>
        <ActionCard label="Check-in ✓" color={SUCCESS} icon="🔥" />
        <ActionCard label="В зал" color={ACCENT} icon="▶" filled />
      </div>

      <BottomNav />
    </div>
  );
}

function Ring({ label, value, color, pct }: any) {
  const R = 38;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - pct / 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={92} height={92}>
        <circle cx={46} cy={46} r={R} stroke={BORDER} strokeWidth={7} fill="none" />
        <circle cx={46} cy={46} r={R} stroke={color} strokeWidth={7} fill="none"
          strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 46 46)" />
      </svg>
      <div style={{
        marginTop: -64, fontSize: 18, fontWeight: 900, color: TEXT,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        {value}
      </div>
      <div style={{ marginTop: 30, fontSize: 9, color: MUTED, letterSpacing: 1 }}>{label}</div>
    </div>
  );
}

function ActionCard({ label, color, icon, filled }: any) {
  return (
    <div style={{
      flex: 1, padding: 14, borderRadius: 18,
      background: filled ? color : CARD,
      border: filled ? "none" : `1px solid ${BORDER}`,
      display: "flex", flexDirection: "column", gap: 8,
      color: filled ? "white" : TEXT,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: filled ? "rgba(255,255,255,0.2)" : `${color}22`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
      }}>{icon}</div>
      <span style={{ fontWeight: 700, fontSize: 14 }}>{label}</span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SCREEN 2: Training/Workout (gym mode)
// ────────────────────────────────────────────────────────────────────────────
function TrainingScreen() {
  return (
    <div style={{
      width: W, height: H, background: BG, color: TEXT, position: "relative",
      display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif",
    }}>
      <StatusBar />
      <TopBar />

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em" }}>
          Тренування спини
        </div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Пн · 8 вправ · 4×10 · 90с відпочинок</div>
      </div>

      {/* Timer card */}
      <div style={{
        margin: "16px 16px 0", padding: 18, background: CARD,
        border: `1px solid ${ACCENT}55`, borderRadius: 20,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1 }}>ЧАС ТРЕНУВАННЯ</div>
          <div style={{
            fontSize: 36, fontWeight: 900, fontFamily: "monospace",
            color: TEXT, marginTop: 2,
          }}>24:18</div>
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: 16,
          background: `linear-gradient(135deg, ${ACCENT2}, ${ACCENT})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, color: "white",
        }}>▶</div>
      </div>

      {/* Exercise row 1 */}
      <ExerciseRow
        num={1}
        name="Тяга вертикального блоку"
        active
        sets={[{ w: 45, r: 12, done: true }, { w: 50, r: 10, done: true }, { w: 50, r: 10, done: false }, { w: 50, r: 0, done: false }]}
      />
      <ExerciseRow
        num={2}
        name="Тяга гантелі однією рукою"
        sets={[{ w: 20, r: 12, done: false }, { w: 20, r: 12, done: false }, { w: 20, r: 0, done: false }, { w: 20, r: 0, done: false }]}
      />
      <ExerciseRow
        num={3}
        name="Тяга канатиків до чола"
        sets={[{ w: 0, r: 0, done: false }, { w: 0, r: 0, done: false }, { w: 0, r: 0, done: false }, { w: 0, r: 0, done: false }]}
      />

      <BottomNav />
    </div>
  );
}

function ExerciseRow({ num, name, active, sets }: any) {
  return (
    <div style={{
      margin: "10px 16px 0", padding: 14, background: CARD,
      border: `1px solid ${active ? ACCENT : BORDER}`, borderRadius: 16,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: active ? ACCENT : SURFACE, color: active ? "white" : MUTED,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 13,
        }}>{num}</div>
        <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{name}</span>
        <span style={{
          fontSize: 10, padding: "2px 8px", borderRadius: 999,
          background: SURFACE, border: `1px solid ${BORDER}`, color: MUTED, fontFamily: "monospace",
        }}>4×10</span>
      </div>
      {active && (
        <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
          {sets.map((s: any, i: number) => (
            <div key={i} style={{
              flex: 1, padding: "8px 0", textAlign: "center", borderRadius: 8,
              background: s.done ? `${SUCCESS}22` : SURFACE,
              border: `1px solid ${s.done ? SUCCESS : BORDER}`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            }}>
              <span style={{ fontSize: 10, color: MUTED }}>#{i + 1}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: s.done ? SUCCESS : TEXT }}>
                {s.w > 0 ? `${s.w}×${s.r}` : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SCREEN 3: Recipes gallery
// ────────────────────────────────────────────────────────────────────────────
function RecipesScreen() {
  const cats = [
    { e: "🍳", name: "Сніданки", grad: "linear-gradient(135deg, #fbbf24aa, #f97316aa)" },
    { e: "🥪", name: "Перекуси", grad: "linear-gradient(135deg, #a78bfaaa, #c084fcaa)" },
    { e: "🥘", name: "Обіди",    grad: "linear-gradient(135deg, #34d399aa, #14b8a6aa)" },
    { e: "🍝", name: "Вечері",   grad: "linear-gradient(135deg, #60a5faaa, #6366f1aa)" },
    { e: "🍰", name: "Десерти",  grad: "linear-gradient(135deg, #f472b6aa, #fb7185aa)" },
    { e: "📖", name: "Інше",     grad: "linear-gradient(135deg, #94a3b8aa, #64748baa)" },
  ];

  return (
    <div style={{
      width: W, height: H, background: BG, color: TEXT, position: "relative",
      display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif",
    }}>
      <StatusBar />
      <TopBar />

      {/* Hero */}
      <div style={{
        margin: "0 16px", padding: 16, background: CARD,
        border: `1px solid ${BORDER}`, borderRadius: 20,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: `linear-gradient(135deg, ${ACCENT2}, ${ACCENT})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
        }}>🍴</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 999,
            background: SURFACE, border: `1px solid ${BORDER}`, color: MUTED, alignSelf: "flex-start",
            display: "flex", alignItems: "center", gap: 4,
          }}>✨ Кулінарна книга</span>
          <span style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>Рецепти</span>
          <span style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Збірки від тренера · 5 категорій</span>
        </div>
      </div>

      {/* 2×2 grid via nested flex rows */}
      <div style={{ margin: "16px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {[[0, 1], [2, 3]].map((pair, rowIdx) => (
          <div key={rowIdx} style={{ display: "flex", gap: 10 }}>
            {pair.map(i => {
              const c = cats[i];
              return (
                <div key={c.name} style={{
                  flex: 1, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16,
                  overflow: "hidden", display: "flex", flexDirection: "column",
                }}>
                  <div style={{
                    height: 110, background: c.grad, position: "relative",
                    display: "flex", alignItems: "flex-end", justifyContent: "flex-start",
                    padding: 12,
                  }}>
                    <div style={{
                      position: "absolute", top: 8, left: 8,
                      width: 32, height: 32, borderRadius: 10,
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 17,
                    }}>{c.e}</div>
                    <div style={{
                      fontWeight: 900, fontSize: 18, color: "white",
                    }}>{c.name}</div>
                  </div>
                  <div style={{
                    padding: "8px 12px", display: "flex", justifyContent: "space-between",
                    fontSize: 10, color: ACCENT, fontWeight: 600,
                  }}>
                    <span style={{ color: MUTED }}>📑 Слайди</span>
                    <span>Переглянути →</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SCREEN 4: Analytics (weight chart)
// ────────────────────────────────────────────────────────────────────────────
function AnalyticsScreen() {
  // simple weight trend data
  const data = [78, 77.5, 76.8, 76.2, 75.5, 75.0, 74.6, 74.1];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const chartW = W - 64;
  const chartH = 160;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * chartW;
    const y = chartH - ((v - min) / (max - min)) * chartH;
    return [x, y];
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const areaPath = `${linePath} L${chartW},${chartH} L0,${chartH} Z`;

  return (
    <div style={{
      width: W, height: H, background: BG, color: TEXT, position: "relative",
      display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif",
    }}>
      <StatusBar />
      <TopBar />

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 24, fontWeight: 900 }}>Аналітика</div>
        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Твої цифри — твій шлях</div>
      </div>

      {/* KPI row */}
      <div style={{ margin: "16px 16px 0", display: "flex", gap: 8 }}>
        <Kpi value="−3.9 кг" label="ВТРАЧЕНО" color={SUCCESS} />
        <Kpi value="74.1" label="ВАГА (КГ)" color={TEXT} />
        <Kpi value="12.3%" label="% ЖИРУ" color={ACCENT} />
      </div>

      {/* Chart card */}
      <div style={{
        margin: "12px 16px 0", padding: 16, background: CARD,
        border: `1px solid ${BORDER}`, borderRadius: 20,
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
        }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Динаміка ваги</span>
          <span style={{ fontSize: 11, color: SUCCESS }}>↓ −5%</span>
        </div>
        <svg width={chartW} height={chartH}>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity="0.4" />
              <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#grad)" />
          <path d={linePath} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={3} fill={ACCENT} />
          ))}
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: MUTED }}>
          <span>1 кв</span>
          <span>2 кв</span>
          <span>3 кв</span>
          <span>4 кв</span>
        </div>
      </div>

      {/* Streak chip */}
      <div style={{
        margin: "12px 16px 0", padding: 14, background: CARD,
        border: `1px solid ${BORDER}`, borderRadius: 16,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${YELLOW}22`, color: YELLOW,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>🔥</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 18, fontWeight: 900 }}>14 днів streak</span>
          <span style={{ fontSize: 11, color: MUTED }}>Без пропусків check-in</span>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function Kpi({ value, label, color }: any) {
  return (
    <div style={{
      flex: 1, padding: 12, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14,
      display: "flex", flexDirection: "column", gap: 2,
    }}>
      <span style={{ fontSize: 9, color: MUTED, letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 900, color }}>{value}</span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const screen = new URL(req.url).searchParams.get("screen") ?? "dashboard";

  let content: any;
  switch (screen) {
    case "training":  content = <TrainingScreen />; break;
    case "recipes":   content = <RecipesScreen />; break;
    case "analytics": content = <AnalyticsScreen />; break;
    case "dashboard":
    default:          content = <DashboardScreen />; break;
  }

  return new ImageResponse(content, { width: W, height: H });
}
