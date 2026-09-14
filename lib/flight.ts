export const FLIGHT_HEIGHT = 720;
export const FLIGHT_GROUND = 678;
export const FLIGHT_RADIUS = 16;
export const GATE_WIDTH = 76;
export const FLIGHT_STEP = 1 / 120;

export type FlightPhase = "ready" | "playing" | "paused" | "over";
export type FlightGate = {
  id: number;
  x: number;
  center: number;
  gap: number;
  passed: boolean;
  collected: boolean;
  shield: boolean;
  broken: boolean;
};
export type FlightParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
};
export type FlightEvent =
  "flap" | "star" | "perfect" | "shield" | "hit" | "over";
export type Flight = {
  phase: FlightPhase;
  width: number;
  x: number;
  y: number;
  velocity: number;
  score: number;
  gatesPassed: number;
  stars: number;
  combo: number;
  bestCombo: number;
  shield: boolean;
  invincible: number;
  time: number;
  distance: number;
  speed: number;
  wing: number;
  flash: number;
  notice: string;
  noticeTime: number;
  cooldown: number;
  accumulator: number;
  seed: number;
  nextId: number;
  gates: FlightGate[];
  particles: FlightParticle[];
  events: FlightEvent[];
};

function random(run: Flight) {
  run.seed = (Math.imul(run.seed, 1664525) + 1013904223) >>> 0;
  return run.seed / 4294967296;
}

export function createFlight(width = 960, seed = 1): Flight {
  return {
    phase: "ready",
    width,
    x: Math.min(220, width * 0.25),
    y: 340,
    velocity: 0,
    score: 0,
    gatesPassed: 0,
    stars: 0,
    combo: 0,
    bestCombo: 0,
    shield: true,
    invincible: 0,
    time: 0,
    distance: 0,
    speed: 168,
    wing: 0,
    flash: 0,
    notice: "",
    noticeTime: 0,
    cooldown: 0,
    accumulator: 0,
    seed: seed >>> 0,
    nextId: 0,
    gates: [],
    particles: [],
    events: [],
  };
}

export function resizeFlight(run: Flight, width: number) {
  const nextX = Math.min(220, width * 0.25);
  for (const gate of run.gates) gate.x += nextX - run.x;
  for (const particle of run.particles) particle.x += nextX - run.x;
  run.width = width;
  run.x = nextX;
}

function addGate(run: Flight) {
  const previous = run.gates.at(-1);
  const gap = Math.max(174, 224 - run.gatesPassed * 1.5);
  const center = previous
    ? Math.max(160, Math.min(520, previous.center + (random(run) - 0.5) * 240))
    : 340;
  run.gates.push({
    id: run.nextId,
    x: previous ? previous.x + 295 : run.x + 395,
    center,
    gap,
    passed: false,
    collected: false,
    shield: (run.nextId + 1) % 6 === 0,
    broken: false,
  });
  run.nextId++;
}

export function startFlight(run: Flight) {
  if (run.phase !== "ready") return;
  run.phase = "playing";
  while (!run.gates.length || run.gates.at(-1)!.x < run.width + 295)
    addGate(run);
  flapFlight(run);
}

export function flapFlight(run: Flight) {
  if (run.phase !== "playing" || run.cooldown > 0) return;
  run.velocity = -315;
  run.wing = 1;
  run.cooldown = 0.085;
  run.events.push("flap");
}

export function pauseFlight(run: Flight) {
  if (run.phase !== "playing") return;
  run.phase = "paused";
  run.accumulator = 0;
  run.events = [];
}

export function resumeFlight(run: Flight) {
  if (run.phase !== "paused") return;
  run.phase = "playing";
  run.cooldown = 0;
  flapFlight(run);
}

export function flightMedal(passed: number) {
  return passed >= 30
    ? "Gold wings"
    : passed >= 15
      ? "Silver wings"
      : passed >= 5
        ? "Bronze wings"
        : "First flight";
}

function burst(run: Flight, color: string, count = 9) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    run.particles.push({
      x: run.x,
      y: run.y,
      vx: Math.cos(angle) * 95,
      vy: Math.sin(angle) * 95,
      life: 0.55,
      maxLife: 0.55,
      color,
    });
  }
}

function hit(run: Flight, gate?: FlightGate) {
  if (run.invincible > 0) return;
  run.combo = 0;
  run.flash = 0.25;
  if (run.shield) {
    run.shield = false;
    run.invincible = 1.25;
    if (gate) gate.broken = true;
    run.y = Math.max(
      FLIGHT_RADIUS + 14,
      Math.min(FLIGHT_GROUND - FLIGHT_RADIUS - 8, run.y),
    );
    run.velocity = run.y > FLIGHT_HEIGHT / 2 ? -240 : 90;
    run.notice = "SHIELD SAVE!";
    run.noticeTime = 1.2;
    run.events.push("hit");
    burst(run, "#baf8e2", 16);
  } else {
    run.phase = "over";
    run.events.push("over");
    burst(run, "#ffc58b", 20);
  }
}

function stepFlight(run: Flight) {
  const dt = FLIGHT_STEP;
  run.time += dt;
  run.speed = Math.min(248, 168 + run.gatesPassed * 2.6);
  run.distance += run.speed * dt;
  run.cooldown = Math.max(0, run.cooldown - dt);
  run.invincible = Math.max(0, run.invincible - dt);
  run.wing = Math.max(0, run.wing - dt * 4);
  run.flash = Math.max(0, run.flash - dt);
  run.noticeTime = Math.max(0, run.noticeTime - dt);
  run.velocity = Math.min(480, run.velocity + 850 * dt);
  run.y += run.velocity * dt;

  for (const particle of run.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
  }
  run.particles = run.particles.filter((p) => p.life > 0);
  for (const gate of run.gates) gate.x -= run.speed * dt;

  if (run.y - FLIGHT_RADIUS < 8 || run.y + FLIGHT_RADIUS > FLIGHT_GROUND)
    hit(run);
  if (run.phase !== "playing") return;
  run.y = Math.max(
    FLIGHT_RADIUS + 8,
    Math.min(FLIGHT_GROUND - FLIGHT_RADIUS, run.y),
  );

  for (const gate of run.gates) {
    const top = gate.center - gate.gap / 2;
    const bottom = gate.center + gate.gap / 2;
    const nearestX = Math.max(
      gate.x - 7,
      Math.min(gate.x + GATE_WIDTH + 7, run.x),
    );
    const verticalDistance =
      run.y < top
        ? 0
        : run.y > bottom
          ? 0
          : Math.min(run.y - top, bottom - run.y);
    if (
      !gate.broken &&
      Math.hypot(run.x - nearestX, verticalDistance) < FLIGHT_RADIUS
    )
      hit(run, gate);
    if (run.phase !== "playing") return;
    if (
      !gate.collected &&
      Math.hypot(gate.x + GATE_WIDTH / 2 - run.x, gate.center - run.y) < 34
    ) {
      gate.collected = true;
      if (gate.shield) {
        run.shield = true;
        run.notice = "SHIELD RESTORED";
        run.events.push("shield");
        burst(run, "#baf8e2");
      } else {
        run.stars++;
        run.score += 3;
        run.notice = "+3 STAR";
        run.events.push("star");
        burst(run, "#ffdd83", 6);
      }
      run.noticeTime = 0.9;
    }
    if (!gate.passed && gate.x + GATE_WIDTH + FLIGHT_RADIUS < run.x) {
      gate.passed = true;
      run.gatesPassed++;
      run.score++;
      if (gate.collected && !gate.broken) {
        run.combo = Math.min(5, run.combo + 1);
        run.bestCombo = Math.max(run.bestCombo, run.combo);
        run.score += run.combo;
        run.notice = run.combo > 1 ? `PERFECT ×${run.combo}` : "PERFECT +1";
        run.noticeTime = 1.15;
        run.events.push("perfect");
      } else run.combo = 0;
    }
  }
  run.gates = run.gates.filter((gate) => gate.x + GATE_WIDTH > -80);
  while (!run.gates.length || run.gates.at(-1)!.x < run.width + 295)
    addGate(run);
}

export function tickFlight(run: Flight, elapsed: number) {
  if (run.phase === "over") {
    const dt = Math.max(0, Math.min(0.05, elapsed));
    run.flash = Math.max(0, run.flash - dt);
    run.particles = run.particles.filter(
      (particle) => (particle.life -= dt) > 0,
    );
    return;
  }
  if (run.phase !== "playing") return;
  run.accumulator += Math.max(0, Math.min(0.1, elapsed));
  while (run.accumulator + 1e-9 >= FLIGHT_STEP && run.phase === "playing") {
    run.accumulator = Math.max(0, run.accumulator - FLIGHT_STEP);
    stepFlight(run);
  }
}

export function readFlightBest(value: string | null) {
  const score = Number(value);
  return Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
}
