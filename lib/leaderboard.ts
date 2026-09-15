export const LEADERBOARD_LIMIT = 10;
export const MAX_ARCADE_SCORE = 999999999;
export const ARCADE_GAMES = {
  eggswiper: { name: "Eggswiper", unit: "EGGS OPENED", note: "Little eggs. Big secrets." },
  survival: {
    name: "Survival",
    unit: "DUCKS DEFEATED",
    note: "Solo runs & co-op teams",
  },
  flight: {
    name: "Flight",
    unit: "POINTS",
    note: "Stars, streaks & clear skies",
  },
  dash: { name: "Dash", unit: "DISTANCE", note: "Small paws. Long trails." },
} as const;
export type ArcadeGame = keyof typeof ARCADE_GAMES;
export type ArcadeResult = { id: string; score: number };
export type HighScore = ArcadeResult & { initials: string; createdAt: number };

export function validScore(score: number) {
  return Number.isSafeInteger(score) && score > 0 && score <= MAX_ARCADE_SCORE;
}

export function validInitials(initials: string) {
  return /^[A-Z]{3}$/.test(initials);
}

export function cycleLetter(letter: string, direction: number) {
  return String.fromCharCode(
    65 + ((((letter.charCodeAt(0) - 65 + direction) % 26) + 26) % 26),
  );
}

export function rankScores(entries: HighScore[]) {
  return [...entries]
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.createdAt - b.createdAt ||
        a.id.localeCompare(b.id),
    )
    .slice(0, LEADERBOARD_LIMIT);
}

export function qualifies(score: number, entries: HighScore[]) {
  const ranked = rankScores(entries);
  return (
    validScore(score) &&
    (ranked.length < LEADERBOARD_LIMIT ||
      score > ranked[ranked.length - 1].score)
  );
}

export function scoreInsertion(result: ArcadeResult, entries: HighScore[]) {
  if (entries.some((entry) => entry.id === result.id))
    return { status: "existing" as const, dropped: "" };
  if (!qualifies(result.score, entries))
    return { status: "missed" as const, dropped: "" };
  const ranked = rankScores(entries);
  return {
    status: "insert" as const,
    dropped:
      ranked.length === LEADERBOARD_LIMIT ? ranked[ranked.length - 1].id : "",
  };
}
