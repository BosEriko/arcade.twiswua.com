"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ARCADE_GAMES,
  cycleLetter,
  qualifies,
  validInitials,
  type ArcadeGame,
  type ArcadeResult,
  type HighScore,
} from "../lib/leaderboard";
import {
  leaderboardError,
  loadHighScores,
  saveHighScore,
  observeScoreAccount,
  signInForScores,
  signOutOfScores,
} from "../lib/leaderboard-store";
import styles from "./high-scores.module.css";

export default function HighScores({
  game,
  container,
  result = null,
  onOpen,
}: {
  game: ArcadeGame;
  container: HTMLElement | null;
  result?: ArcadeResult | null;
  onOpen?: () => void;
}) {
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const request = useRef(0);
  const submitting = useRef(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"board" | "entry">("board");
  const [entries, setEntries] = useState<HighScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [initials, setInitials] = useState("AAA");
  const [submitted, setSubmitted] = useState("");
  const [account, setAccount] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const metadata = ARCADE_GAMES[game];

  useEffect(() => {
    try {
      const saved = localStorage.getItem("arcade-initials");
      if (saved && validInitials(saved)) setInitials(saved);
    } catch {}
    try {
      return observeScoreAccount(setAccount);
    } catch {}
  }, []);

  useEffect(() => {
    const panel = dialog.current;
    if (!open || !container || !panel) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const background: Array<{ element: HTMLElement; inert: boolean }> = [];
    panel.focus({ preventScroll: true });
    let current: HTMLElement = panel.parentElement!;
    while (current.parentElement) {
      for (const sibling of current.parentElement.children) {
        if (sibling !== current && sibling instanceof HTMLElement) {
          background.push({ element: sibling, inert: sibling.inert });
          sibling.inert = true;
        }
      }
      current = current.parentElement;
      if (current === document.body) break;
    }
    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !panel.contains(event.target)) {
        panel.focus({ preventScroll: true });
      }
    };
    document.addEventListener("focusin", containFocus);
    return () => {
      document.removeEventListener("focusin", containFocus);
      background.forEach(({ element, inert }) => { element.inert = inert; });
      if (previousFocus?.isConnected && previousFocus !== document.body) {
        previousFocus.focus({ preventScroll: true });
      } else trigger.current?.focus({ preventScroll: true });
    };
  }, [open, container]);

  useEffect(() => {
    const id = ++request.current;
    setOpen(false);
    setMessage("");
    if (!result || result.score <= 0)
      return () => {
        request.current++;
      };
    setLoading(true);
    setError("");
    void loadHighScores(game)
      .then((rows) => {
        if (id !== request.current) return;
        setEntries(rows);
        if (
          qualifies(result.score, rows) &&
          !rows.some((row) => row.id === result.id)
        ) {
          setMode("entry");
          setOpen(true);
        }
      })
      .catch((reason) => {
        if (id === request.current) setError(leaderboardError(reason));
      })
      .finally(() => {
        if (id === request.current) setLoading(false);
      });
    return () => {
      request.current++;
    };
  }, [game, result?.id, result?.score]);

  async function refresh() {
    const id = ++request.current;
    setLoading(true);
    setError("");
    try {
      const rows = await loadHighScores(game);
      if (id === request.current) setEntries(rows);
    } catch (reason) {
      if (id === request.current) setError(leaderboardError(reason));
    } finally {
      if (id === request.current) setLoading(false);
    }
  }

  function close() {
    if (submitting.current) return;
    setOpen(false);
  }

  function change(index: number, direction: number) {
    setInitials(
      (current) =>
        current.slice(0, index) +
        cycleLetter(current[index], direction) +
        current.slice(index + 1),
    );
  }

  async function submit() {
    if (!result || submitting.current || authBusy || submitted === result.id)
      return;
    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      const status = await saveHighScore(game, result, initials);
      setSubmitted(result.id);
      setMode("board");
      setMessage(
        status === "missed"
          ? "Someone just raised the bar. This run missed the top 10."
          : "Your initials are on the board. Nice run!",
      );
      try {
        localStorage.setItem("arcade-initials", initials);
      } catch {}
      await refresh();
    } catch (reason) {
      setError(leaderboardError(reason));
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  const canEnter =
    !!result &&
    submitted !== result.id &&
    !entries.some((row) => row.id === result.id) &&
    qualifies(result.score, entries);
  return (
    <>
      <button
        ref={trigger}
        className={styles.trigger}
        aria-label={`${metadata.name} high scores`}
        title="High scores"
        onClick={() => {
          onOpen?.();
          setMode("board");
          setMessage("");
          setOpen(true);
          void refresh();
        }}
      >
        <span aria-hidden="true">♛</span>
        <span>TOP 10</span>
      </button>
      {open && container &&
        createPortal(
          <div className={styles.overlay}>
          <div
            ref={dialog}
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Escape") {
                event.preventDefault();
                close();
              }
              if (event.key === "Tab") {
                const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
                  'button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]',
                )).filter((element) => element.getClientRects().length > 0);
                const first = focusable[0];
                const last = focusable.at(-1);
                if (!first || !last) {
                  event.preventDefault();
                  event.currentTarget.focus();
                } else if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
                  event.preventDefault();
                  last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first.focus();
                }
              }
            }}
            onKeyUp={(event) => event.stopPropagation()}
          >
            <header className={styles.header}>
              <div>
                <span>
                  TWISWUA&apos;S ARCADE / {metadata.name.toUpperCase()}
                </span>
                <h2 id={titleId}>
                  {mode === "entry" ? "Leave your mark." : "The high rollers."}
                </h2>
              </div>
              <button
                className={styles.close}
                onClick={close}
                disabled={saving}
                aria-label="Close high scores"
              >
                ×
              </button>
            </header>
            <div className={styles.account}>
              <span>
                {account
                  ? `ACCOUNT · ${account}`
                  : "GUEST ACCOUNT · PLAY WITHOUT SIGNING IN"}
              </span>
              <button
                className={styles.textButton}
                disabled={saving || authBusy}
                onClick={async () => {
                  setAuthBusy(true);
                  setError("");
                  try {
                    if (account) await signOutOfScores();
                    else await signInForScores();
                  } catch (reason) {
                    setError(leaderboardError(reason));
                  } finally {
                    setAuthBusy(false);
                  }
                }}
              >
                {authBusy ? "Connecting…" : account ? "Sign out" : "Sign in"}
              </button>
            </div>
            {mode === "entry" && result ? (
              <form
                className={styles.entry}
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit();
                }}
              >
                <p className={styles.qualifier}>
                  A TOP-10 RUN. THREE LETTERS. YOUR LEGACY.
                </p>
                <div className={styles.newScore}>
                  <strong>{result.score.toLocaleString("en-US")}</strong>
                  <span>{metadata.unit}</span>
                </div>
                <fieldset
                  className={styles.letters}
                  disabled={saving || authBusy}
                >
                  <legend>CHOOSE YOUR INITIALS</legend>
                  {[0, 1, 2].map((index) => (
                    <div className={styles.letter} key={index}>
                      <button
                        type="button"
                        onClick={() => change(index, 1)}
                        aria-label={`Next letter ${index + 1}`}
                      >
                        <span aria-hidden="true">▲</span>
                      </button>
                      <output
                        aria-label={`Letter ${index + 1}`}
                        aria-live="polite"
                      >
                        {initials[index]}
                      </output>
                      <button
                        type="button"
                        onClick={() => change(index, -1)}
                        aria-label={`Previous letter ${index + 1}`}
                      >
                        <span aria-hidden="true">▼</span>
                      </button>
                    </div>
                  ))}
                </fieldset>
                {error && (
                  <p className={styles.error} role="alert">
                    {error}
                  </p>
                )}
                <button
                  className={styles.primary}
                  type="submit"
                  disabled={saving || authBusy}
                >
                  {saving ? "SAVING YOUR SPOT…" : "SAVE HIGH SCORE"}
                  <span aria-hidden="true">↗</span>
                </button>
                <button
                  className={styles.textButton}
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setMode("board");
                    void refresh();
                  }}
                >
                  View the board first
                </button>
              </form>
            ) : (
              <div className={styles.board}>
                <div className={styles.subheading}>
                  <span>TOP 10 · {metadata.unit}</span>
                  <span>{metadata.note}</span>
                </div>
                {message && (
                  <p className={styles.message} role="status">
                    {message}
                  </p>
                )}
                {loading ? (
                  <p className={styles.state} role="status">
                    Warming up the scoreboard…
                  </p>
                ) : error ? (
                  <div className={styles.state}>
                    <p role="alert">{error}</p>
                    <button
                      className={styles.primary}
                      onClick={() => void refresh()}
                    >
                      TRY AGAIN <span>↗</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <ol
                      className={styles.list}
                      aria-label={`${metadata.name} top 10`}
                    >
                      {Array.from({ length: 10 }, (_, index) => {
                        const row = entries[index];
                        return (
                          <li
                            key={row?.id || index}
                            className={
                              row?.id === submitted
                                ? styles.yourScore
                                : undefined
                            }
                          >
                            <span className={styles.rank}>
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <strong>{row?.initials || "---"}</strong>
                            <span className={styles.score}>
                              {row ? row.score.toLocaleString("en-US") : "—"}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                    {!entries.length && (
                      <p className={styles.empty}>
                        A fresh machine. Be the first to leave your initials.
                      </p>
                    )}
                    {canEnter && (
                      <button
                        className={styles.primary}
                        onClick={() => {
                          setError("");
                          setMode("entry");
                        }}
                      >
                        ENTER YOUR INITIALS <span aria-hidden="true">↗</span>
                      </button>
                    )}
                  </>
                )}
                <div className={styles.footer}>
                  <span>THREE LETTERS. TEN LEGENDS.</span>
                  <button className={styles.textButton} onClick={close}>
                    Back to the game
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>,
          container,
        )}
    </>
  );
}
