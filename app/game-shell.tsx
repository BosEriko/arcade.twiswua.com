"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import HighScores from "./high-scores";
import {
  ARCADE_GAMES,
  type ArcadeGame,
  type ArcadeResult,
} from "../lib/leaderboard";
import styles from "./game-shell.module.css";

type Props = {
  children: ReactNode;
  controls: ReactNode;
  status: string;
  statusRight?: ReactNode;
  hint: string;
  extraActions?: ReactNode;
  sidebar?: ReactNode;
  overlays?: ReactNode;
} & (
  | {
      game: ArcadeGame;
      phase: string;
      muted: boolean;
      onMusic: () => void;
      onPause: () => void;
      result: ArcadeResult | null;
    }
  | {
      game?: never;
      phase?: never;
      muted?: never;
      onMusic?: never;
      onPause?: never;
      result?: never;
    }
);

export default function GameShell({
  game,
  phase,
  muted,
  onMusic,
  onPause,
  result,
  children,
  controls,
  status,
  statusRight,
  hint,
  extraActions,
  sidebar,
  overlays,
}: Props) {
  const title = game ? ARCADE_GAMES[game].name : "Arcade Room";
  return (
    <main className={`${styles.shell} ${game ? "" : styles.menuShell}`} data-game={game}>
      <header className={styles.header}>
        {game ? (
          <Link href="/" className={styles.back} aria-label="Back to the arcade">
            ←<span>ARCADE ROOM</span>
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
        <div className={styles.brand}>
          <span aria-hidden="true">🐯</span>
          <span>
            TWISWUA <strong>{title.toUpperCase()}</strong>
          </span>
        </div>
        <div className={styles.actions}>
          {extraActions}
          {game && (
            <>
              <HighScores
                game={game}
                result={result}
                onOpen={() => {
                  if (phase === "playing") onPause();
                }}
              />
              <button
                onClick={onMusic}
                aria-label={muted ? "Enable music" : "Mute music"}
                aria-pressed={!muted}
              >
                ♫
              </button>
              <button
                onClick={onPause}
                disabled={phase !== "playing" && phase !== "paused"}
                aria-label={phase === "paused" ? "Resume game" : "Pause game"}
              >
                {phase === "paused" ? "▷" : "Ⅱ"}
              </button>
            </>
          )}
        </div>
      </header>
      <div className={styles.cabinetSlot} data-game={game}>
        <section
          className={styles.cabinet}
          aria-label={game ? `${title} game console` : "Arcade Room console"}
        >
          <div className={styles.status}>
            <span>● {status}</span>
            <span>{statusRight}</span>
          </div>
          <div
            className={`${styles.viewport} ${sidebar ? styles.withSidebar : ""}`}
          >
            <div className={`${styles.screen} ${game ? "" : styles.menuScreen}`}>
              {children}
            </div>
            {sidebar && <div className={styles.sidebar}>{sidebar}</div>}
          </div>
        </section>
      </div>
      <div className={styles.controls}>
        <p className={styles.desktopHint}>{hint}</p>
        {controls}
      </div>
      {overlays}
    </main>
  );
}
