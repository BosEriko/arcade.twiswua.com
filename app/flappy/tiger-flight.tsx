"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createFlight,
  flapFlight,
  flightMedal,
  FLIGHT_HEIGHT,
  pauseFlight,
  readFlightBest,
  resizeFlight,
  resumeFlight,
  startFlight,
  tickFlight,
  type Flight,
} from "../../lib/flight";
import { drawFlight } from "../../lib/flight-draw";
import { FlightAudio } from "../../lib/flight-audio";
import styles from "./tiger-flight.module.css";

function snapshot(run: Flight) {
  return {
    phase: run.phase,
    score: run.score,
    gates: run.gatesPassed,
    stars: run.stars,
    combo: run.combo,
    bestCombo: run.bestCombo,
    shield: run.shield,
    distance: Math.floor(run.distance / 10),
    notice: run.notice,
    noticeTime: run.noticeTime,
  };
}

export default function TwisWuaFlight() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const runRef = useRef(createFlight());
  const audioRef = useRef<FlightAudio | null>(null);
  const bestRef = useRef(0);
  const previousBest = useRef(0);
  const mutedRef = useRef(false);
  const restartAt = useRef(0);
  const [hud, setHud] = useState(() => snapshot(runRef.current));
  const [best, setBest] = useState(0);
  const [muted, setMuted] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);

  const playAudio = useCallback(() => {
    audioRef.current ??= new FlightAudio();
    audioRef.current.setMuted(mutedRef.current);
    audioRef.current.play();
  }, []);

  const pause = useCallback(() => {
    pauseFlight(runRef.current);
    audioRef.current?.pause();
    setHud(snapshot(runRef.current));
  }, []);

  const action = useCallback(() => {
    const current = runRef.current;
    if (current.phase === "over" && performance.now() < restartAt.current)
      return;
    if (current.phase === "ready" || current.phase === "over") {
      previousBest.current = bestRef.current;
      runRef.current = createFlight(
        current.width,
        Math.floor(Math.random() * 4294967296),
      );
      startFlight(runRef.current);
      playAudio();
    } else if (current.phase === "paused") {
      resumeFlight(current);
      playAudio();
    } else flapFlight(current);
    setHud(snapshot(runRef.current));
  }, [playAudio]);

  const togglePause = useCallback(() => {
    if (runRef.current.phase === "playing") pause();
    else if (runRef.current.phase === "paused") action();
  }, [action, pause]);

  useEffect(() => {
    try {
      bestRef.current = readFlightBest(
        localStorage.getItem("tiger-flight-best"),
      );
      previousBest.current = bestRef.current;
      setBest(bestRef.current);
      mutedRef.current = localStorage.getItem("tiger-flight-muted") === "1";
      setMuted(mutedRef.current);
    } catch {
      setStorageUnavailable(true);
    }

    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const c = canvas?.getContext("2d");
    if (!canvas || !stage || !c) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      last = 0,
      lastHud = 0;
    const resize = () => {
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const width = (rect.width / rect.height) * FLIGHT_HEIGHT;
      if (
        Math.abs(width - runRef.current.width) > 20 &&
        runRef.current.phase === "playing"
      )
        pause();
      resizeFlight(runRef.current, width);
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();

    const render = (now: number) => {
      const run = runRef.current;
      const before = run.phase;
      tickFlight(run, last ? (now - last) / 1000 : 0);
      last = now;
      for (const event of run.events) audioRef.current?.sound(event);
      run.events = [];
      if (before === "playing" && run.phase === "over") {
        restartAt.current = now + 450;
        audioRef.current?.stopMusic();
        bestRef.current = Math.max(bestRef.current, run.score);
        setBest(bestRef.current);
        try {
          localStorage.setItem("tiger-flight-best", String(bestRef.current));
        } catch {
          setStorageUnavailable(true);
        }
      }
      c.setTransform(
        canvas.width / run.width,
        0,
        0,
        canvas.height / FLIGHT_HEIGHT,
        0,
        0,
      );
      drawFlight(c, run, now / 1000, reducedMotion.matches);
      if (now - lastHud > 100 || before !== run.phase) {
        setHud(snapshot(run));
        lastHud = now;
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    const keydown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey)
        return;
      const interactive =
        event.target instanceof HTMLElement &&
        !!event.target.closest("button, a, input, select, textarea");
      if (event.code === "Space" || event.code === "ArrowUp") {
        if (interactive && event.code === "Space") return;
        event.preventDefault();
        action();
      } else if (event.code === "KeyP" || event.code === "Escape") {
        event.preventDefault();
        togglePause();
      }
    };
    const hide = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", hide);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", hide);
      audioRef.current?.dispose();
      audioRef.current = null;
    };
  }, [action, pause, togglePause]);

  const toggleMusic = () => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    audioRef.current?.setMuted(mutedRef.current);
    if (!mutedRef.current && runRef.current.phase === "playing") playAudio();
    try {
      localStorage.setItem("tiger-flight-muted", mutedRef.current ? "1" : "0");
    } catch {
      setStorageUnavailable(true);
    }
  };
  const playing = hud.phase === "playing";
  const over = hud.phase === "over";
  const ready = hud.phase === "ready";
  const milestone = hud.gates < 5 ? 5 : hud.gates < 15 ? 15 : 30;
  const isRecord = over && hud.score > previousBest.current;

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.back} aria-label="Back to the arcade">
          <span aria-hidden="true">←</span> <span>ARCADE ROOM</span>
        </Link>
        <div className={styles.brand}>
          <span aria-hidden="true">🐯</span>
          <div>
            TWISWUA <strong>FLIGHT</strong>
            <small>THE SKY IS NOT THE LIMIT.</small>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.iconButton}
            onClick={toggleMusic}
            aria-label={muted ? "Turn sound on" : "Mute sound"}
            aria-pressed={!muted}
          >
            <span aria-hidden="true">{muted ? "♪" : "♫"}</span>
            <span className={styles.soundLabel}>{muted ? "OFF" : "ON"}</span>
          </button>
          <button
            className={styles.iconButton}
            onClick={togglePause}
            disabled={ready || over}
            aria-label={
              hud.phase === "paused" ? "Resume flight" : "Pause flight"
            }
          >
            <span aria-hidden="true">{hud.phase === "paused" ? "▷" : "Ⅱ"}</span>
          </button>
        </div>
      </header>

      <div className={styles.expeditionBar}>
        <span>
          <i /> ENDLESS EXPEDITION
        </span>
        <span>
          01 — {hud.gates >= 15 ? "THE MISTY HIGHLANDS" : "THE SUNLIT CANOPY"}
        </span>
        <span className={styles.bestLabel}>
          PERSONAL BEST <b>{String(best).padStart(2, "0")}</b>
        </span>
      </div>
      <section
        ref={stageRef}
        className={styles.game}
        aria-label="TwisWua Flight game"
      >
        <canvas
          ref={canvasRef}
          tabIndex={0}
          aria-label="Flight arena. Tap, click, or press Space to flap. P pauses."
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            canvasRef.current?.focus({ preventScroll: true });
            if (playing) action();
          }}
        />
        {!ready && (
          <div className={styles.hud}>
            <div className={styles.score}>
              <span>SCORE</span>
              <strong>{String(hud.score).padStart(2, "0")}</strong>
            </div>
            <div className={styles.runStats}>
              <span>
                <b>✦</b> {hud.stars}
              </span>
              <span>
                {hud.distance} <small>m</small>
              </span>
              <span
                className={`${styles.shieldStatus} ${hud.shield ? styles.shieldOn : ""}`}
              >
                {hud.shield ? "◇ SHIELD READY" : "◇ NO SHIELD"}
              </span>
            </div>
          </div>
        )}
        {playing && hud.noticeTime > 0 && (
          <div className={styles.notice} key={hud.notice}>
            {hud.notice}
          </div>
        )}
        {playing && hud.combo > 1 && (
          <span className={styles.combo}>
            PERFECT STREAK <b>×{hud.combo}</b>
          </span>
        )}

        {ready && (
          <div className={`${styles.overlay} ${styles.readyOverlay}`}>
            <div className={styles.launchPanel}>
              <span className={styles.eyebrow}>
                SMALL TIGER. WILD BLUE YONDER.
              </span>
              <h1>
                Born to <em>fly.</em>
              </h1>
              <p>
                A little courage. A well-timed flap.
                <br />
                There’s a whole jungle up here.
              </p>
              <button
                className={styles.primary}
                onClick={() => {
                  action();
                  canvasRef.current?.focus({ preventScroll: true });
                }}
              >
                LET’S FLY <span aria-hidden="true">↗</span>
              </button>
              <span className={styles.startHint}>
                TAP OR PRESS SPACE TO FLAP
              </span>
              <div className={styles.briefing}>
                <span>
                  <b>✦</b> Collect stars
                </span>
                <span>
                  <b>◇</b> One free shield
                </span>
                <span>
                  <b>↑</b> Find your rhythm
                </span>
              </div>
            </div>
          </div>
        )}
        {hud.phase === "paused" && (
          <div className={`${styles.overlay} ${styles.scrim}`}>
            <div className={styles.resultPanel}>
              <span className={styles.eyebrow}>A LITTLE BREATHING ROOM</span>
              <h2>
                On cloud <em>pause.</em>
              </h2>
              <p>Your flight is safe. Ready when you are.</p>
              <button
                className={styles.primary}
                onClick={() => {
                  action();
                  canvasRef.current?.focus({ preventScroll: true });
                }}
              >
                KEEP FLYING <span aria-hidden="true">↗</span>
              </button>
              <span className={styles.startHint}>P OR ESC TO RESUME</span>
            </div>
          </div>
        )}
        {over && (
          <div className={`${styles.overlay} ${styles.scrim}`}>
            <div className={styles.resultPanel}>
              <span className={styles.eyebrow}>
                {isRecord
                  ? "A NEW PERSONAL BEST!"
                  : "GOOD FLIGHT. GREAT EXCUSE TO GO AGAIN."}
              </span>
              <div
                className={`${styles.medal} ${hud.gates >= 5 ? styles.earnedMedal : ""}`}
                aria-hidden="true"
              >
                {hud.gates >= 30 ? "✹" : hud.gates >= 15 ? "✷" : "✦"}
              </div>
              <h2>
                {isRecord ? (
                  <>
                    Look at you <em>soar.</em>
                  </>
                ) : (
                  <>
                    Another round
                    <br />
                    of <em>altitude?</em>
                  </>
                )}
              </h2>
              <span className={styles.medalName}>{flightMedal(hud.gates)}</span>
              <div className={styles.results}>
                <div>
                  <span>SCORE</span>
                  <strong>{hud.score}</strong>
                </div>
                <div>
                  <span>BEST</span>
                  <strong>{best}</strong>
                </div>
                <div>
                  <span>STARS</span>
                  <strong>{hud.stars}</strong>
                </div>
              </div>
              <p className={styles.resultDetail}>
                {hud.gates} gates cleared · {hud.distance} m flown
                {hud.bestCombo > 1 ? ` · ×${hud.bestCombo} best streak` : ""}
              </p>
              <button
                className={styles.primary}
                onClick={() => {
                  action();
                  canvasRef.current?.focus({ preventScroll: true });
                }}
              >
                ONE MORE FLIGHT <span aria-hidden="true">↻</span>
              </button>
              <Link href="/" className={styles.returnLink}>
                Back to the arcade
              </Link>
            </div>
          </div>
        )}
        <div className={styles.screenLabel} aria-hidden="true">
          <span>TW / FLIGHT</span>
          <span>EST. FOR THE FUN OF IT</span>
        </div>
      </section>

      <footer className={styles.controls}>
        <div className={styles.controlTip}>
          <span className={styles.keycap}>↑</span>
          <div>
            <strong>ONE TAP. ONE FLAP.</strong>
            <span>
              Click, tap, or press <kbd>SPACE</kbd>
            </span>
          </div>
        </div>
        <div className={styles.medalProgress}>
          <span>
            {hud.gates >= 30
              ? "GOLD WINGS EARNED"
              : `NEXT WINGS · ${hud.gates} / ${milestone} GATES`}
          </span>
          <div>
            <i
              style={{
                width: `${Math.min(100, (hud.gates / milestone) * 100)}%`,
              }}
            />
          </div>
        </div>
        <button
          className={styles.flapButton}
          onPointerDown={(event) => {
            event.preventDefault();
            action();
          }}
          onClick={(event) => {
            if (event.detail === 0) action();
          }}
          aria-label={
            playing
              ? "Flap wings"
              : hud.phase === "paused"
                ? "Resume flight with flap"
                : "Start flight"
          }
        >
          FLAP <span aria-hidden="true">↑</span>
        </button>
        <span className={styles.desktopNote}>
          CHASE STARS.
          <br />
          <b>NOT THE GROUND.</b>
        </span>
      </footer>
      {storageUnavailable && (
        <p className={styles.storageNotice} role="status">
          Scores can’t be saved in this browser. You can still play.
        </p>
      )}
    </main>
  );
}
