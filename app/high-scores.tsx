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
import {
  ScreenActions,
  ScreenButton,
  ScreenContent,
  ScreenHeader,
  ScreenView,
} from "./screen-ui";
import styles from "./high-scores.module.css";

export default function HighScores({
  game,
  container,
  result = null,
  onOpen,
  onVisibilityChange,
}: {
  game: ArcadeGame;
  container: HTMLElement | null;
  result?: ArcadeResult | null;
  onOpen?: () => void;
  onVisibilityChange?: (open: boolean) => void;
}) {
  const titleId = useId();
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
    onVisibilityChange?.(open);
    return () => onVisibilityChange?.(false);
  }, [open, onVisibilityChange]);

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
      <ScreenButton
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
      </ScreenButton>
      {open && container &&
        createPortal(
          <ScreenView container={container} titleId={titleId} onClose={close}>
            <ScreenHeader
              id={titleId}
              eyebrow={metadata.name.toUpperCase()}
              title={mode === "entry" ? "Leave your mark." : "The high rollers."}
              onClose={close}
              closeDisabled={saving}
              closeLabel="Close high scores"
            />
            <ScreenContent>
              {mode === "board" && <div className={styles.account}>
                <span>{account || "Playing as guest"}</span>
                <ScreenButton
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
                </ScreenButton>
              </div>}
              {mode === "entry" && result ? (
                <form
                  id={`${titleId}-entry`}
                  className={styles.entry}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                  }}
                >
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
                        <ScreenButton
                          type="button"
                          onClick={() => change(index, 1)}
                          aria-label={`Next letter ${index + 1}`}
                        >
                          <span aria-hidden="true">▲</span>
                        </ScreenButton>
                        <output
                          aria-label={`Letter ${index + 1}`}
                          aria-live="polite"
                        >
                          {initials[index]}
                        </output>
                        <ScreenButton
                          type="button"
                          onClick={() => change(index, -1)}
                          aria-label={`Previous letter ${index + 1}`}
                        >
                          <span aria-hidden="true">▼</span>
                        </ScreenButton>
                      </div>
                    ))}
                  </fieldset>
                  {error && (
                    <p className={styles.error} role="alert">
                      {error}
                    </p>
                  )}
                </form>
              ) : (
                <div>
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
                      <ScreenButton
                        className={styles.primary}
                        onClick={() => void refresh()}
                      >
                        TRY AGAIN <span>↗</span>
                      </ScreenButton>
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
                    </>
                  )}
                </div>
              )}
            </ScreenContent>
            <ScreenActions>
              {mode === "entry" ? (
                <>
                  <ScreenButton
                    className={styles.textButton}
                    disabled={saving}
                    onClick={() => { setMode("board"); void refresh(); }}
                  >
                    View board
                  </ScreenButton>
                  <ScreenButton
                    className={styles.primary}
                    type="submit"
                    form={`${titleId}-entry`}
                    disabled={saving || authBusy}
                  >
                    {saving ? "Saving…" : "Save high score"}
                    <span aria-hidden="true">↗</span>
                  </ScreenButton>
                </>
              ) : (
                <>
                  <ScreenButton className={styles.textButton} onClick={close}>
                    Back to game
                  </ScreenButton>
                  {canEnter && !loading && !error && (
                    <ScreenButton
                      className={styles.primary}
                      onClick={() => { setError(""); setMode("entry"); }}
                    >
                      Enter initials <span aria-hidden="true">↗</span>
                    </ScreenButton>
                  )}
                </>
              )}
            </ScreenActions>
          </ScreenView>,
          container,
        )}
    </>
  );
}
