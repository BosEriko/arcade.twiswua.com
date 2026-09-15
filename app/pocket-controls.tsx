"use client";

import { useEffect, useRef } from "react";
import styles from "./game-shell.module.css";

export default function PocketControls({
  phase,
  aLabel,
  bLabel,
  hint,
  onA,
  onB,
  onHoldB,
  onStart,
  onPause,
}: {
  phase: string;
  aLabel: string;
  bLabel: string;
  hint: string;
  onA: () => void;
  onB?: () => void;
  onHoldB?: (down: boolean) => void;
  onStart: () => void;
  onPause: () => void;
}) {
  const pointers = useRef(new Set<number>());
  useEffect(() => {
    if (phase !== "playing") pointers.current.clear();
  }, [phase]);
  return (
    <section className="handheld-controls" data-controls="buttons" aria-label="Handheld controller">
      <div className="console-wordmark">
        TWISWUA <span className="console-model-pocket">pocket</span><span className="console-model-advance">advance</span>
        <small>8-BIT ARCADE EDITION</small>
      </div>
      <div className="control-row">
        <div className={styles.pocketHint}>
          <span aria-hidden="true">✦</span>
          <strong>ONE MORE TRY.</strong>
          <p>{hint}</p>
        </div>
        <div className="action-buttons">
          <div className="action-group action-b">
            <button
              className="console-action"
              aria-label={`B: ${bLabel}`}
              disabled={
                onHoldB
                  ? phase !== "playing"
                  : phase !== "playing" && phase !== "paused"
              }
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.preventDefault();
                if (onHoldB) {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  pointers.current.add(event.pointerId);
                  onHoldB(true);
                } else onB?.();
              }}
              onPointerUp={(event) => {
                pointers.current.delete(event.pointerId);
                onHoldB?.(pointers.current.size > 0);
              }}
              onPointerCancel={(event) => {
                pointers.current.delete(event.pointerId);
                onHoldB?.(pointers.current.size > 0);
              }}
              onLostPointerCapture={(event) => {
                pointers.current.delete(event.pointerId);
                onHoldB?.(pointers.current.size > 0);
              }}
              onKeyDown={(event) => {
                if (onHoldB && ["Space", "Enter"].includes(event.code)) {
                  event.preventDefault();
                  onHoldB(true);
                }
              }}
              onKeyUp={() => onHoldB?.(false)}
              onBlur={() => onHoldB?.(false)}
              onClick={(event) => {
                if (event.detail === 0 && !onHoldB) onB?.();
              }}
            >
              B
            </button>
            <span className="control-caption">{bLabel}</span>
          </div>
          <div className="action-group action-a">
            <button
              className="console-action"
              aria-label={`A: ${aLabel}`}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                event.preventDefault();
                onA();
              }}
              onClick={(event) => {
                if (event.detail === 0) onA();
              }}
            >
              A
            </button>
            <span className="control-caption">{aLabel}</span>
          </div>
        </div>
      </div>
      <div className="console-bottom">
        <div className="console-system-buttons">
          <button
            onClick={onPause}
            disabled={phase !== "playing" && phase !== "paused"}
          >
            <span />
            {phase === "paused" ? "RESUME" : "PAUSE"}
          </button>
          <button
            onClick={phase === "paused" ? onPause : onStart}
            disabled={phase === "playing"}
          >
            <span />
            START
          </button>
        </div>
        <div className="speaker" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i} />
          ))}
        </div>
      </div>
      <p className="console-hint">{hint}</p>
    </section>
  );
}
