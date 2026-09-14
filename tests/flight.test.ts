import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createFlight,
  flapFlight,
  flightMedal,
  FLIGHT_GROUND,
  FLIGHT_RADIUS,
  GATE_WIDTH,
  pauseFlight,
  readFlightBest,
  resizeFlight,
  resumeFlight,
  startFlight,
  tickFlight,
  type Flight,
} from "../lib/flight.ts";

function liveFlight(): Flight {
  const run = createFlight(960, 42);
  startFlight(run);
  run.events = [];
  return run;
}

test("a flight starts with a shield and approachable first gate", () => {
  const run = createFlight();
  tickFlight(run, 1);
  assert.equal(run.phase, "ready");
  startFlight(run);
  assert.equal(run.phase, "playing");
  assert.equal(run.shield, true);
  assert.equal(run.gates[0].center, 340);
  assert.ok(run.gates[0].x - run.x > 350);
  assert.ok(run.velocity < 0);
});

test("flapping adds lift, rejects held-key repeats and gravity brings the tiger down", () => {
  const run = liveFlight();
  const firstVelocity = run.velocity;
  tickFlight(run, 0.025);
  flapFlight(run);
  assert.notEqual(run.velocity, firstVelocity);
  for (let i = 0; i < 5; i++) tickFlight(run, 0.1);
  assert.ok(run.velocity > 0);
  flapFlight(run);
  assert.ok(run.velocity < 0);
});

test("fixed physics produce the same result at 30 and 120 frames per second", () => {
  const slow = liveFlight(),
    fast = liveFlight();
  for (let i = 0; i < 15; i++) tickFlight(slow, 1 / 30);
  for (let i = 0; i < 60; i++) tickFlight(fast, 1 / 120);
  assert.ok(Math.abs(slow.y - fast.y) < 0.00001);
  assert.ok(Math.abs(slow.gates[0].x - fast.gates[0].x) < 0.00001);
});

test("pause freezes physics, scoring and timers; resume gives a safe flap", () => {
  const run = liveFlight();
  pauseFlight(run);
  const before = structuredClone(run);
  tickFlight(run, 10);
  flapFlight(run);
  assert.deepEqual(run, before);
  resumeFlight(run);
  assert.equal(run.phase, "playing");
  assert.ok(run.velocity < 0);
});

test("collecting a star awards points once and clearing its gate starts a combo", () => {
  const run = liveFlight();
  const gate = run.gates[0];
  gate.x = run.x - GATE_WIDTH / 2;
  run.y = gate.center;
  run.velocity = 0;
  tickFlight(run, 1 / 120);
  assert.equal(run.stars, 1);
  assert.equal(run.score, 3);
  assert.equal(gate.collected, true);
  tickFlight(run, 1 / 120);
  assert.equal(run.score, 3);
  gate.x = run.x - GATE_WIDTH - FLIGHT_RADIUS - 1;
  tickFlight(run, 1 / 120);
  assert.equal(run.gatesPassed, 1);
  assert.equal(run.combo, 1);
  assert.equal(run.score, 5);
  tickFlight(run, 1 / 120);
  assert.equal(run.gatesPassed, 1);
});

test("missing a star ends the perfect streak while still scoring the gate", () => {
  const run = liveFlight();
  run.combo = 3;
  const gate = run.gates[0];
  gate.x = run.x - GATE_WIDTH - FLIGHT_RADIUS - 1;
  tickFlight(run, 1 / 120);
  assert.equal(run.gatesPassed, 1);
  assert.equal(run.combo, 0);
  assert.equal(run.score, 1);
});

test("a shield absorbs one gate hit, then a later hit ends the run", () => {
  const run = liveFlight();
  const gate = run.gates[0];
  gate.x = run.x - 10;
  run.y = gate.center - gate.gap / 2 - 10;
  tickFlight(run, 1 / 120);
  assert.equal(run.phase, "playing");
  assert.equal(run.shield, false);
  assert.equal(gate.broken, true);
  assert.ok(run.invincible > 0);
  run.invincible = 0;
  const nextGate = run.gates[1];
  nextGate.x = run.x - 10;
  run.y = nextGate.center - nextGate.gap / 2 - 10;
  tickFlight(run, 1 / 120);
  assert.equal(run.phase, "over");
});

test("shield pickups restore protection without counting as a star", () => {
  const run = liveFlight();
  run.shield = false;
  const gate = run.gates[0];
  gate.shield = true;
  gate.x = run.x - GATE_WIDTH / 2;
  run.y = gate.center;
  run.velocity = 0;
  tickFlight(run, 1 / 120);
  assert.equal(run.shield, true);
  assert.equal(run.stars, 0);
  assert.equal(gate.collected, true);
});

test("ground collision consumes protection, then ends a flight without protection", () => {
  const run = liveFlight();
  run.y = FLIGHT_GROUND - 5;
  tickFlight(run, 1 / 120);
  assert.equal(run.phase, "playing");
  assert.equal(run.shield, false);
  assert.ok(run.y + FLIGHT_RADIUS < FLIGHT_GROUND);
  run.invincible = 0;
  run.y = FLIGHT_GROUND - 5;
  tickFlight(run, 1 / 120);
  assert.equal(run.phase, "over");
});

test("resizing keeps the distance to obstacles and score unchanged", () => {
  const run = liveFlight();
  const distance = run.gates[0].x - run.x;
  resizeFlight(run, 390);
  assert.equal(run.gates[0].x - run.x, distance);
  assert.equal(run.width, 390);
  assert.equal(run.score, 0);
});

test("death freezes the flight while its impact flash fades away", () => {
  const run = liveFlight();
  run.shield = false;
  run.y = FLIGHT_GROUND - 5;
  tickFlight(run, 1 / 120);
  assert.equal(run.phase, "over");
  const { y, score, distance } = run;
  for (let i = 0; i < 15; i++) tickFlight(run, 0.05);
  assert.equal(run.y, y);
  assert.equal(run.score, score);
  assert.equal(run.distance, distance);
  assert.equal(run.flash, 0);
  assert.equal(run.particles.length, 0);
});

test("difficulty increases but keeps traversable gaps and bounded gate count", () => {
  const run = liveFlight();
  run.gatesPassed = 100;
  run.gates = [];
  tickFlight(run, 1 / 120);
  assert.equal(run.speed, 248);
  assert.ok(
    run.gates.every((g) => g.gap >= 174 && g.center >= 160 && g.center <= 520),
  );
  assert.ok(run.gates.length < 8);
});

test("restart resets the run; existing best scores and medals are handled safely", () => {
  const run = createFlight(390);
  assert.equal(run.score, 0);
  assert.equal(run.shield, true);
  assert.equal(run.phase, "ready");
  assert.equal(readFlightBest("27"), 27);
  assert.equal(readFlightBest("NaN"), 0);
  assert.equal(readFlightBest("Infinity"), 0);
  assert.equal(readFlightBest("-8"), 0);
  assert.equal(flightMedal(4), "First flight");
  assert.equal(flightMedal(5), "Bronze wings");
  assert.equal(flightMedal(15), "Silver wings");
  assert.equal(flightMedal(30), "Gold wings");
});
