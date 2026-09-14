import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cycleLetter,
  qualifies,
  rankScores,
  scoreInsertion,
  validInitials,
  validScore,
  type HighScore,
} from "../lib/leaderboard.ts";
import { runnerNightAmount, runnerPalette } from "../lib/runner-palette.ts";

const ten: HighScore[] = Array.from({ length: 10 }, (_, i) => ({
  id: `run_${i}`,
  initials: "AAA",
  score: (i + 1) * 10,
  createdAt: i,
}));

test("initials are exactly three uppercase letters and arrows wrap A/Z", () => {
  for (const invalid of ["", "AA", "AAAA", "abc", "A1B", "A B", "猫AB"])
    assert.equal(validInitials(invalid), false);
  assert.equal(validInitials("BOS"), true);
  assert.equal(cycleLetter("Z", 1), "A");
  assert.equal(cycleLetter("A", -1), "Z");
  assert.equal(cycleLetter("B", 1), "C");
});
test("top 10 are ordered descending, ties retain earlier entries", () => {
  assert.deepEqual(
    rankScores(ten).map((row) => row.score),
    [100, 90, 80, 70, 60, 50, 40, 30, 20, 10],
  );
  const candidates = [
    ...ten,
    { id: "later", initials: "NEW", score: 10, createdAt: 100 },
  ];
  assert.equal(rankScores(candidates).length, 10);
  assert.equal(rankScores(candidates).at(-1)?.id, "run_0");
});
test("only a qualifying run replaces the lowest entry; retries do not duplicate", () => {
  assert.equal(qualifies(10, ten), false);
  assert.equal(qualifies(11, ten), true);
  assert.equal(qualifies(1, []), true);
  assert.deepEqual(scoreInsertion({ id: "new", score: 101 }, ten), {
    status: "insert",
    dropped: "run_0",
  });
  assert.equal(scoreInsertion({ id: "new", score: 1 }, ten).status, "missed");
  assert.equal(
    scoreInsertion({ id: "run_5", score: 60 }, ten).status,
    "existing",
  );
  for (const score of [0, -1, Infinity, NaN, 1.5, 1000000000])
    assert.equal(validScore(score), false);
});
test("Dash fades continuously at every day/night boundary using fractional distance", () => {
  assert.equal(runnerNightAmount(0), 0);
  assert.equal(runnerNightAmount(4999), 0);
  assert.equal(runnerNightAmount(5300), 0.5);
  assert.equal(runnerNightAmount(5600), 1);
  assert.equal(runnerNightAmount(10300), 0.5);
  assert.equal(runnerNightAmount(10600), 0);
  for (const boundary of [5000, 5600, 10000, 10600, 15000, 20000]) {
    assert.ok(
      Math.abs(
        runnerNightAmount(boundary - 0.01) - runnerNightAmount(boundary + 0.01),
      ) < 0.0001,
    );
    assert.equal(
      runnerPalette(boundary - 0.01).sky,
      runnerPalette(boundary + 0.01).sky,
    );
  }
  assert.notEqual(runnerPalette(5300).sky, runnerPalette(5000).sky);
  assert.notEqual(runnerPalette(5300).sky, runnerPalette(5600).sky);
});
