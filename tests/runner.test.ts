import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createRunner,
  jumpRunner,
  duckRunner,
  pauseRunner,
  tickRunner,
  runnerBody,
  readRunnerBest,
  RUNNER_GROUND,
  type Runner,
} from "../lib/runner.ts";

function playing(): Runner {
  const run = createRunner(900, 42);
  run.phase = "playing";
  return run;
}

test("runner waits to start and distance scores increase only during play", () => {
  const run = createRunner();
  tickRunner(run, 1);
  assert.equal(run.score, 0);
  assert.equal(run.y, RUNNER_GROUND);
  run.phase = "playing";
  tickRunner(run, 0.1);
  assert.ok(run.score > 0);
});

test("jump clears a cactus, rejects midair jumps, and lands back on the trail", () => {
  const run = playing();
  jumpRunner(run);
  tickRunner(run, 0.1);
  const velocity = run.velocity;
  jumpRunner(run);
  assert.equal(run.velocity, velocity);
  tickRunner(run, 0.1);
  run.obstacles = [
    {
      id: 1,
      kind: "cactus",
      x: 120,
      y: RUNNER_GROUND - 48,
      width: 30,
      height: 48,
    },
  ];
  tickRunner(run, 0.1);
  assert.equal(run.phase, "playing");
  for (let i = 0; i < 6; i++) tickRunner(run, 0.1);
  assert.equal(run.y, RUNNER_GROUND);
  assert.equal(run.velocity, 0);
});

test("ducking passes beneath birds; standing hits them", () => {
  for (const ducking of [false, true]) {
    const run = playing();
    duckRunner(run, ducking);
    run.obstacles = [
      {
        id: 1,
        kind: "bird",
        x: 125,
        y: RUNNER_GROUND - 55,
        width: 46,
        height: 26,
      },
    ];
    tickRunner(run, 0.1);
    assert.equal(run.phase, ducking ? "playing" : "over");
  }
});

test("duck does not evade ground obstacles and release restores standing height", () => {
  const run = playing();
  duckRunner(run, true);
  assert.equal(runnerBody(run).height, 23);
  jumpRunner(run);
  assert.equal(run.velocity, 0);
  duckRunner(run, false);
  assert.equal(runnerBody(run).height, 47);
  run.obstacles = [
    {
      id: 1,
      kind: "log",
      x: 120,
      y: RUNNER_GROUND - 34,
      width: 58,
      height: 34,
    },
  ];
  tickRunner(run, 0.1);
  assert.equal(run.phase, "over");
});

test("ducking in the air speeds up descent without clipping into the ground", () => {
  const normal = playing(),
    fast = playing();
  jumpRunner(normal);
  jumpRunner(fast);
  for (let i = 0; i < 3; i++) {
    tickRunner(normal, 0.1);
    tickRunner(fast, 0.1);
  }
  duckRunner(fast, true);
  tickRunner(normal, 0.1);
  tickRunner(fast, 0.1);
  assert.ok(fast.y > normal.y);
  for (let i = 0; i < 5; i++) tickRunner(fast, 0.1);
  assert.equal(fast.y, RUNNER_GROUND);
});

test("pause freezes all progress and clears held duck input", () => {
  const run = playing();
  duckRunner(run, true);
  pauseRunner(run);
  assert.equal(run.ducking, false);
  const before = structuredClone(run);
  tickRunner(run, 5);
  jumpRunner(run);
  duckRunner(run, true);
  assert.deepEqual(run, before);
});

test("30fps and 120fps produce the same movement and score", () => {
  const slow = playing(),
    fast = playing();
  jumpRunner(slow);
  jumpRunner(fast);
  for (let i = 0; i < 15; i++) tickRunner(slow, 1 / 30);
  for (let i = 0; i < 60; i++) tickRunner(fast, 1 / 120);
  assert.ok(Math.abs(slow.y - fast.y) < 1e-7);
  assert.ok(Math.abs(slow.distance - fast.distance) < 1e-7);
  assert.equal(slow.score, fast.score);
});

test("obstacles are spaced for recovery and speed has an upper bound", () => {
  const run = playing();
  const kinds = new Set<string>();
  for (let i = 0; i < 1600; i++) {
    run.obstacles = run.obstacles.filter((obstacle) => obstacle.x > 220);
    tickRunner(run, 0.1);
    assert.equal(run.phase, "playing");
    for (const obstacle of run.obstacles) kinds.add(obstacle.kind);
    assert.ok(run.obstacles.length < 5);
    for (let j = 1; j < run.obstacles.length; j++) {
      assert.ok(
        run.obstacles[j].x -
          run.obstacles[j - 1].x -
          run.obstacles[j - 1].width >
          300,
      );
    }
  }
  assert.equal(run.speed, 500);
  assert.deepEqual([...kinds].sort(), ["bird", "cactus", "log"]);
});

test("death freezes score; restart resets obstacles, speed, and distance", () => {
  const run = playing();
  run.obstacles = [
    {
      id: 1,
      kind: "cactus",
      x: 120,
      y: RUNNER_GROUND - 48,
      width: 30,
      height: 48,
    },
  ];
  tickRunner(run, 0.1);
  assert.equal(run.phase, "over");
  const before = structuredClone(run);
  tickRunner(run, 10);
  assert.deepEqual(run, before);
  const fresh = createRunner(run.width);
  assert.equal(fresh.phase, "ready");
  assert.equal(fresh.score, 0);
  assert.equal(fresh.speed, 270);
  assert.deepEqual(fresh.obstacles, []);
  assert.equal(readRunnerBest("123"), 123);
  assert.equal(readRunnerBest("NaN"), 0);
  assert.equal(readRunnerBest("Infinity"), 0);
  assert.equal(readRunnerBest("-3"), 0);
});
