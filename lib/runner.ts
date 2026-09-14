export const RUNNER_HEIGHT = 420;
export const RUNNER_GROUND = 332;
export const RUNNER_STEP = 1 / 120;
export type RunnerObstacle = {
  id: number;
  kind: "cactus" | "log" | "bird";
  x: number;
  y: number;
  width: number;
  height: number;
};
export type Runner = {
  phase: "ready" | "playing" | "paused" | "over";
  width: number;
  y: number;
  velocity: number;
  ducking: boolean;
  distance: number;
  time: number;
  speed: number;
  score: number;
  cleared: number;
  obstacles: RunnerObstacle[];
  untilSpawn: number;
  seed: number;
  nextId: number;
  accumulator: number;
};

export function createRunner(width = 900, seed = 1): Runner {
  return {
    phase: "ready",
    width,
    y: RUNNER_GROUND,
    velocity: 0,
    ducking: false,
    distance: 0,
    time: 0,
    speed: 270,
    score: 0,
    cleared: 0,
    obstacles: [],
    untilSpawn: 170,
    seed: seed >>> 0,
    nextId: 0,
    accumulator: 0,
  };
}

export function jumpRunner(run: Runner) {
  if (run.phase !== "playing" || run.y < RUNNER_GROUND || run.ducking) return;
  run.velocity = -650;
}

export function duckRunner(run: Runner, down: boolean) {
  run.ducking = run.phase === "playing" && down;
}

export function pauseRunner(run: Runner) {
  if (run.phase === "playing") run.phase = "paused";
  run.ducking = false;
}

export function runnerBody(run: Runner) {
  const low = run.ducking && run.y === RUNNER_GROUND;
  return {
    x: 105,
    y: run.y - (low ? 23 : 47),
    width: low ? 51 : 54,
    height: low ? 23 : 47,
  };
}

function random(run: Runner) {
  run.seed = (Math.imul(run.seed, 1664525) + 1013904223) >>> 0;
  return run.seed / 4294967296;
}

export function tickRunner(run: Runner, elapsed: number) {
  if (run.phase !== "playing") return;
  run.accumulator += Math.max(0, Math.min(elapsed, 0.1));
  while (run.accumulator >= RUNNER_STEP && run.phase === "playing") {
    run.accumulator -= RUNNER_STEP;
    run.time += RUNNER_STEP;
    run.speed = Math.min(500, 270 + run.time * 2.5);
    const move = run.speed * RUNNER_STEP;
    run.distance += move;
    run.score = Math.floor(run.distance / 10);
    run.velocity +=
      (run.ducking && run.y < RUNNER_GROUND ? 3000 : 1800) * RUNNER_STEP;
    run.y = Math.min(RUNNER_GROUND, run.y + run.velocity * RUNNER_STEP);
    if (run.y === RUNNER_GROUND) run.velocity = 0;
    run.untilSpawn -= move;
    if (run.untilSpawn <= 0) {
      const choice = random(run);
      const kind =
        run.time > 8 && choice > 0.62
          ? "bird"
          : choice < 0.3
            ? "log"
            : "cactus";
      const width = kind === "log" ? 58 : kind === "bird" ? 46 : 30;
      const height = kind === "log" ? 34 : kind === "bird" ? 26 : 48;
      run.obstacles.push({
        id: run.nextId++,
        kind,
        x: run.width + 70,
        y: RUNNER_GROUND - (kind === "bird" ? 55 : height),
        width,
        height,
      });
      run.untilSpawn = run.speed * (1.3 + random(run) * 0.5) + width;
    }
    const body = runnerBody(run);
    for (const obstacle of run.obstacles) {
      const wasAhead = obstacle.x + obstacle.width >= body.x;
      obstacle.x -= move;
      if (wasAhead && obstacle.x + obstacle.width < body.x) run.cleared++;
      if (
        body.x + body.width - 3 > obstacle.x + 3 &&
        body.x + 3 < obstacle.x + obstacle.width - 3 &&
        body.y + body.height - 2 > obstacle.y + 3 &&
        body.y + 3 < obstacle.y + obstacle.height - 2
      ) {
        run.phase = "over";
        run.ducking = false;
        break;
      }
    }
    run.obstacles = run.obstacles.filter((obstacle) => obstacle.x > -100);
  }
}

export function readRunnerBest(value: string | null) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}
