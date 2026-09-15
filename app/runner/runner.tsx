"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createRunner,
  duckRunner,
  jumpRunner,
  pauseRunner,
  readRunnerBest,
  tickRunner,
  type Runner,
} from "../../lib/runner";
import { drawRunner } from "../../lib/runner-draw";
import { runnerPalette } from "../../lib/runner-palette";
import { Chiptune } from "../../lib/music";
import styles from "./runner.module.css";
import GameShell from "../game-shell";
import PocketControls from "../pocket-controls";
import type { ArcadeResult } from "../../lib/leaderboard";

function snapshot(run: Runner) {
  return {
    phase: run.phase,
    score: run.score,
    cleared: run.cleared,
    speed: Math.round((run.speed / 270) * 100) / 100,
  };
}

export default function Dash() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const run = useRef(createRunner());
  const music = useRef<Chiptune | null>(null);
  const bestRef = useRef(0);
  const mutedRef = useRef(false);
  const restartAt = useRef(0);
  const touchDuck = useRef(false);
  const keyboardDuck = useRef(false);
  const [hud, setHud] = useState(() => snapshot(run.current));
  const [result, setResult] = useState<ArcadeResult | null>(null);
  const [best, setBest] = useState(0);
  const [muted, setMuted] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);

  const playMusic = useCallback(() => {
    if (mutedRef.current) return;
    music.current ??= new Chiptune();
    music.current.play();
  }, []);

  const releaseDuck = useCallback(() => {
    touchDuck.current = false;
    keyboardDuck.current = false;
    duckRunner(run.current, false);
  }, []);

  const action = useCallback(() => {
    const current = run.current;
    if (current.phase === "over" && performance.now() < restartAt.current)
      return;
    if (current.phase === "ready" || current.phase === "over") {
      setResult(null);
      releaseDuck();
      run.current = createRunner(
        current.width,
        Math.floor(Math.random() * 4294967296),
      );
      run.current.phase = "playing";
      playMusic();
    } else if (current.phase === "paused") {
      current.phase = "playing";
      playMusic();
    } else jumpRunner(current);
    setHud(snapshot(run.current));
  }, [playMusic, releaseDuck]);

  const pause = useCallback(() => {
    pauseRunner(run.current);
    releaseDuck();
    music.current?.pause();
    setHud(snapshot(run.current));
  }, [releaseDuck]);

  const togglePause = useCallback(() => {
    if (run.current.phase === "playing") pause();
    else if (run.current.phase === "paused") action();
  }, [pause, action]);

  useEffect(() => {
    try {
      bestRef.current = readRunnerBest(localStorage.getItem("tiger-dash-best"));
      setBest(bestRef.current);
      mutedRef.current = localStorage.getItem("tiger-dash-muted") === "1";
      setMuted(mutedRef.current);
    } catch {
      setStorageUnavailable(true);
    }
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let frame = 0,
      previous = performance.now(),
      lastHud = 0;
    let cssWidth = 900,
      cssHeight = 420;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      cssWidth = rect.width;
      cssHeight = rect.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      if (run.current.phase === "playing") pause();
      run.current.width = Math.max(
        600,
        Math.min(1200, (cssWidth / Math.max(1, cssHeight)) * 420),
      );
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    const animate = (now: number) => {
      const current = run.current;
      const wasPlaying = current.phase === "playing";
      tickRunner(current, (now - previous) / 1000);
      previous = now;
      if (wasPlaying && current.phase === "over") {
        setResult({ id: crypto.randomUUID(), score: current.score });
        music.current?.pause();
        releaseDuck();
        restartAt.current = now + 450;
        if (current.score > bestRef.current) {
          bestRef.current = current.score;
          setBest(current.score);
          try {
            localStorage.setItem("tiger-dash-best", String(current.score));
          } catch {
            setStorageUnavailable(true);
          }
        }
        setHud(snapshot(current));
      }
      if (now - lastHud > 100) {
        setHud(snapshot(current));
        lastHud = now;
      }
      const dpr = Math.min(devicePixelRatio || 1, 2);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.fillStyle = runnerPalette(current.distance).sky;
      context.fillRect(0, 0, cssWidth, cssHeight);
      const scale = Math.min(cssWidth / current.width, cssHeight / 420);
      context.translate(
        (cssWidth - current.width * scale) / 2,
        (cssHeight - 420 * scale) / 2,
      );
      context.scale(scale, scale);
      drawRunner(context, current, motion.matches);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    const isControl = (target: EventTarget | null) =>
      target instanceof Element &&
      !!target.closest("button,a,input,textarea,select");
    const keydown = (event: KeyboardEvent) => {
      if (["KeyP", "Escape"].includes(event.code) && !event.repeat) {
        event.preventDefault();
        togglePause();
        return;
      }
      if (isControl(event.target)) return;
      if (["Space", "ArrowUp", "KeyW"].includes(event.code)) {
        event.preventDefault();
        if (!event.repeat) action();
      } else if (["ArrowDown", "KeyS"].includes(event.code)) {
        event.preventDefault();
        keyboardDuck.current = true;
        duckRunner(run.current, true);
      }
    };
    const keyup = (event: KeyboardEvent) => {
      if (["ArrowDown", "KeyS"].includes(event.code)) {
        keyboardDuck.current = false;
        duckRunner(run.current, touchDuck.current);
      }
    };
    const hidden = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", hidden);
      music.current?.dispose();
      music.current = null;
    };
  }, [action, pause, togglePause, releaseDuck]);

  function toggleMusic() {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    if (mutedRef.current) music.current?.pause();
    else if (run.current.phase === "playing") playMusic();
    try {
      localStorage.setItem("tiger-dash-muted", mutedRef.current ? "1" : "0");
    } catch {
      setStorageUnavailable(true);
    }
  }

  return (
    <GameShell
      game="dash"
      phase={hud.phase}
      muted={muted}
      result={result}
      onMusic={toggleMusic}
      onPause={togglePause}
      status="SUNSET TRAIL / ENDLESS RUNNER"
      statusRight={`BEST ${best} · ${hud.speed.toFixed(2)}× PACE`}
      hint={<>
        <span><kbd>Space</kbd> Jump</span>
        <span><kbd>S</kbd> Hold to crouch</span>
        <span><kbd>P</kbd> Pause</span>
      </>}
      controls={
        <PocketControls
          phase={hud.phase}
          aLabel="JUMP"
          bLabel="CROUCH"
          hint="Space to jump. Hold S to crouch. On mobile: A / B."
          onA={action}
          onHoldB={(down) => {
            touchDuck.current = down;
            duckRunner(run.current, down || keyboardDuck.current);
          }}
          onStart={action}
          onPause={togglePause}
        />
      }
    >
      <section className={styles.stage} aria-label="Dash game">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          aria-label="Runner arena. Spacebar to jump. Hold S to crouch. P to pause."
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.currentTarget.focus({ preventScroll: true });
            action();
          }}
        />
        <div className={styles.hud}>
          <div>
            <span>DISTANCE</span>
            <strong>{String(hud.score).padStart(5, "0")}</strong>
          </div>
          <div>
            <span>PERSONAL BEST</span>
            <strong>{String(best).padStart(5, "0")}</strong>
          </div>
        </div>
        {hud.phase !== "playing" && (
          <div
            className={`${styles.overlay} ${hud.phase === "ready" ? styles.welcome : styles.scrim}`}
          >
            <div className={styles.panel}>
              <span className={styles.eyebrow}>
                {hud.phase === "ready"
                  ? "SMALL PAWS. NO BRAKES."
                  : hud.phase === "paused"
                    ? "A LITTLE BREATHING ROOM"
                    : "THE TRAIL ALWAYS CALLS BACK"}
              </span>
              <h1>
                {hud.phase === "ready" ? (
                  <>
                    Born to <em>run.</em>
                  </>
                ) : hud.phase === "paused" ? (
                  <>
                    Taking a <em>paws.</em>
                  </>
                ) : (
                  <>
                    Dust off.
                    <br />
                    <em>Dash again.</em>
                  </>
                )}
              </h1>
              <p>
                {hud.phase === "ready"
                  ? "Leap over cacti. Duck under the flock. See how far your paws can take you."
                  : hud.phase === "paused"
                    ? "Your trail will be right here."
                    : "One little stumble. Plenty of trail left."}
              </p>
              {hud.phase === "over" && (
                <div className={styles.results}>
                  <div>
                    <span>DISTANCE</span>
                    <b>{hud.score}</b>
                  </div>
                  <div>
                    <span>CLEARED</span>
                    <b>{hud.cleared}</b>
                  </div>
                  <div>
                    <span>BEST</span>
                    <b>{best}</b>
                  </div>
                </div>
              )}
              <button
                className={styles.primary}
                onClick={(event) => {
                  action();
                  event.currentTarget.blur();
                  canvasRef.current?.focus({ preventScroll: true });
                }}
              >
                {hud.phase === "ready"
                  ? "HIT THE TRAIL"
                  : hud.phase === "paused"
                    ? "KEEP RUNNING"
                    : "ONE MORE RUN"}
                <span aria-hidden="true">↗</span>
              </button>
              <small>
                {hud.phase === "ready"
                  ? "SPACEBAR TO JUMP · HOLD S TO CROUCH"
                  : hud.phase === "paused"
                    ? "P TO RESUME"
                    : "A NEW RUN. A NEW PERSONAL BEST?"}
              </small>
            </div>
          </div>
        )}
      </section>
      {storageUnavailable && (
        <p className={styles.storage} role="status">
          Scores can’t be saved in this browser session.
        </p>
      )}
    </GameShell>
  );
}
