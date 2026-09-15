import type { ReactElement } from "react";

const GAMES = [
  { emoji: "🥚", label: "Eggswiper" },
  { emoji: "🐯", label: "Survival" },
  { emoji: "🦅", label: "Flight" },
  { emoji: "🏃", label: "Dash" },
];

export function arcadeCard(size: { width: number; height: number }): ReactElement {
  const scale = size.width / 1200;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8f7f1",
        color: "#293e31",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 160 * scale, lineHeight: 1, display: "flex" }}>🐯</div>
      <div style={{ fontSize: 76 * scale, fontWeight: 700, marginTop: 16 * scale, display: "flex" }}>
        TwisWua&apos;s Arcade Room
      </div>
      <div style={{ fontSize: 34 * scale, color: "#7a8274", marginTop: 12 * scale, display: "flex" }}>
        Retro-style browser games. Play instantly.
      </div>
      <div style={{ display: "flex", gap: 28 * scale, marginTop: 40 * scale }}>
        {GAMES.map((game) => (
          <div
            key={game.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "#fff",
              borderRadius: 20 * scale,
              padding: `${18 * scale}px ${26 * scale}px`,
              border: "2px solid #dedfd4",
            }}
          >
            <div style={{ fontSize: 44 * scale, display: "flex" }}>{game.emoji}</div>
            <div style={{ fontSize: 22 * scale, marginTop: 6 * scale, fontWeight: 600, display: "flex" }}>
              {game.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function arcadeMark(size: { width: number; height: number }): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#293e31",
      }}
    >
      <div style={{ fontSize: size.width * 0.62, display: "flex" }}>🐯</div>
    </div>
  );
}
