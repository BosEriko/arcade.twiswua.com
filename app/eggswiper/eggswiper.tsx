"use client";

import { useEffect, useRef, useState } from "react";
import GameShell from "../game-shell";
import HandheldControls from "../handheld-controls";
import { createNest, openEgg, flagEgg, NEST_SIZE, DUCK_COUNT } from "../../lib/eggswiper";
import { Chiptune } from "../../lib/music";
import type { ArcadeResult } from "../../lib/leaderboard";
import styles from "./eggswiper.module.css";

export default function Eggswiper() {
  const [nest, setNest] = useState(createNest);
  const [selected, setSelected] = useState(0);
  const [flagMode, setFlagMode] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(true);
  const [result, setResult] = useState<ArcadeResult | null>(null);
  const music = useRef<Chiptune | null>(null);
  const direction = useRef("");
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const finished = nest.phase === "lost" || nest.phase === "won";
  const flags = nest.eggs.filter((egg) => egg.flagged).length;

  useEffect(() => {
    if (!nest.planted || nest.phase !== "playing") return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [nest.planted, nest.phase]);

  useEffect(() => {
    if (!muted && nest.phase === "playing" && nest.planted) {
      music.current ??= new Chiptune();
      music.current.play();
    } else music.current?.pause();
    return () => music.current?.pause();
  }, [muted, nest.phase, nest.planted]);

  useEffect(() => {
    const pause = () => {
      if (document.hidden) setNest((current) => current.phase === "playing" ? { ...current, phase: "paused" } : current);
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);

  function restart() {
    setNest(createNest());
    setSelected(0);
    setSeconds(0);
    setFlagMode(false);
    setResult(null);
    direction.current = "";
  }

  function pause() {
    direction.current = "";
    setNest((current) => current.phase === "playing" ? { ...current, phase: "paused" }
      : current.phase === "paused" ? { ...current, phase: "playing" } : current);
  }

  function move(x: number, y: number) {
    if (nest.phase !== "playing") return;
    const horizontal = Math.abs(x) >= Math.abs(y);
    const axis = horizontal ? x : y;
    const next = Math.abs(axis) < 0.4 ? "" : `${horizontal ? "x" : "y"}${Math.sign(axis)}`;
    if (next && next !== direction.current) {
      setSelected((current) => {
        const row = Math.floor(current / NEST_SIZE);
        const col = current % NEST_SIZE;
        return horizontal
          ? row * NEST_SIZE + Math.max(0, Math.min(NEST_SIZE - 1, col + Math.sign(axis)))
          : Math.max(0, Math.min(NEST_SIZE - 1, row + Math.sign(axis))) * NEST_SIZE + col;
      });
    }
    direction.current = next;
  }

  return (
    <GameShell
      game="eggswiper"
      phase={finished ? "over" : nest.phase === "paused" ? "paused" : "playing"}
      muted={muted}
      onMusic={() => setMuted((value) => !value)}
      onPause={pause}
      result={result}
      status="THE SECRET NEST"
      statusRight={`${nest.opened} / ${NEST_SIZE ** 2 - DUCK_COUNT} EGGS OPENED`}
      hint="Click an egg to open · Right-click or F to flag · Arrow keys to select"
      extraActions={<button onClick={restart} aria-label="New nest">↻</button>}
      controls={
        <HandheldControls
          dpad
          phase={finished ? "over" : nest.phase === "paused" ? "paused" : "playing"}
          dashCooldown={0}
          roarCooldown={0}
          aLabel="Open egg"
          bLabel="Flag"
          hint="D-pad to select · A opens an egg · B flags a duck"
          onMove={move}
          onDash={() => setNest((current) => openEgg(current, selected))}
          onRoar={() => setNest((current) => flagEgg(current, selected))}
          onStart={restart}
          onPause={pause}
        />
      }
    >
      <section className={styles.game} aria-label="Eggswiper nest">
        <div className={styles.guide}>
          <span className={styles.tiger} role="img" aria-label="Your tiger companion">🐯</span>
          <div>
            <h1>Eggswiper</h1>
            <p>{nest.phase === "lost" ? "That egg had a quack in it."
              : nest.phase === "won" ? "Every egg is safe. Pawsome work!"
              : "Little eggs. Big secrets."}</p>
          </div>
          <span className={styles.clock}>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</span>
        </div>
        <div className={styles.toolbar}>
          <span>🦆 {DUCK_COUNT} hidden · ⚑ {flags} marked</span>
          <button aria-pressed={flagMode} onClick={() => setFlagMode((value) => !value)} disabled={finished || nest.phase === "paused"}>
            {flagMode ? "⚑ Flag mode" : "🥚 Open mode"}
          </button>
        </div>
        <div className={styles.boardArea}>
          {nest.phase === "paused" ? (
            <div className={styles.paused}>
              <h2>Nest nap.</h2>
              <button onClick={pause}>Resume</button>
            </div>
          ) : (
            <div className={styles.board} role="group" aria-label="8 by 8 egg field">
              {nest.eggs.map((egg, index) => {
                const duck = egg.duck && (egg.open || finished);
                const label = duck ? "Duck" : egg.open ? egg.nearby ? `${egg.nearby} nearby ducks` : "Empty nest" : egg.flagged ? "Flagged egg" : "Unopened egg";
                return (
                  <button
                    key={index}
                    ref={(element) => { cells.current[index] = element; }}
                    className={styles.cell}
                    data-open={egg.open}
                    data-selected={index === selected}
                    data-hit={index === nest.hit}
                    data-count={egg.nearby}
                    aria-label={`Row ${Math.floor(index / NEST_SIZE) + 1}, column ${index % NEST_SIZE + 1}: ${label}`}
                    aria-disabled={finished}
                    tabIndex={index === selected ? 0 : -1}
                    onFocus={() => setSelected(index)}
                    onClick={() => {
                      setSelected(index);
                      setNest((current) => flagMode ? flagEgg(current, index) : openEgg(current, index));
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setSelected(index);
                      setNest((current) => flagEgg(current, index));
                    }}
                    onKeyDown={(event) => {
                      const row = Math.floor(index / NEST_SIZE);
                      const col = index % NEST_SIZE;
                      let next = index;
                      if (event.key === "ArrowLeft") next = row * NEST_SIZE + Math.max(0, col - 1);
                      else if (event.key === "ArrowRight") next = row * NEST_SIZE + Math.min(NEST_SIZE - 1, col + 1);
                      else if (event.key === "ArrowUp") next = Math.max(0, row - 1) * NEST_SIZE + col;
                      else if (event.key === "ArrowDown") next = Math.min(NEST_SIZE - 1, row + 1) * NEST_SIZE + col;
                      else if (event.key.toLowerCase() === "f") {
                        event.preventDefault();
                        if (!event.repeat) setNest((current) => flagEgg(current, index));
                        return;
                      } else return;
                      event.preventDefault();
                      cells.current[next]?.focus({ preventScroll: true });
                    }}
                  >
                    {duck ? "🦆" : egg.flagged && !egg.open ? "⚑" : egg.open ? egg.nearby || "·" : "🥚"}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className={styles.message} aria-live="polite">
          {finished ? (
            <>
              <strong>{nest.phase === "won" ? "Nest cleared!" : "You found a duck!"} {nest.opened} eggs opened.</strong>
              <div className={styles.endActions}>
                <button onClick={restart}>New nest ↗</button>
                {nest.opened > 0 && <button disabled={!!result} onClick={() => setResult({ id: crypto.randomUUID(), score: nest.opened })}>Save score</button>}
              </div>
            </>
          ) : <span>{nest.planted ? "Numbers count ducks in the eight surrounding eggs." : "Open any egg. Your first pick is always safe."}</span>}
        </div>
      </section>
    </GameShell>
  );
}
