import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { Chiptune } from "../lib/music.ts";
import { MenuAudio } from "../lib/menu-audio.ts";

class Parameter {
  value = 0;
  setValueAtTime(value: number) { this.value = value; }
  linearRampToValueAtTime(value: number) { this.value = value; }
  exponentialRampToValueAtTime(value: number) { this.value = value; }
  setTargetAtTime(value: number) { this.value = value; }
}

class Gain {
  gain = new Parameter();
  connect() {}
  disconnect() {}
}

class Oscillator {
  type = "sine";
  frequency = new Parameter();
  started = 0;
  stopped = 0;
  onended: (() => void) | null = null;
  connect() {}
  disconnect() {}
  start(time: number) { this.started = time; }
  stop(time: number) { this.stopped = time; }
}

class Context {
  static instances: Context[] = [];
  currentTime = 0;
  state = "suspended";
  destination = {};
  oscillators: Oscillator[] = [];
  gains: Gain[] = [];
  constructor() { Context.instances.push(this); }
  createGain() { const gain = new Gain(); this.gains.push(gain); return gain; }
  createOscillator() { const oscillator = new Oscillator(); this.oscillators.push(oscillator); return oscillator; }
  resume() { this.state = "running"; return Promise.resolve(); }
  close() { this.state = "closed"; return Promise.resolve(); }
}

const original = globalThis.AudioContext;
beforeEach(() => {
  Context.instances = [];
  globalThis.AudioContext = Context as unknown as typeof AudioContext;
});
afterEach(() => { globalThis.AudioContext = original; });

test("each game plays a distinct tune and pauses and disposes its audio", async () => {
  const signatures = new Set<string>();
  for (const game of ["eggswiper", "survival", "flight", "dash"] as const) {
    const music = new Chiptune(game);
    try {
      music.play();
      await Promise.resolve();
      const context = Context.instances.at(-1)!;
      assert.ok(context.oscillators.length >= 2);
      signatures.add(JSON.stringify(context.oscillators.map((note) => [note.type, note.frequency.value, note.stopped])));
      music.play();
      await Promise.resolve();
      assert.equal(Context.instances.at(-1), context);
      music.pause();
      assert.equal(context.gains[0].gain.value, 0);
      music.dispose();
      assert.equal(context.state, "closed");
    } finally { music.dispose(); }
  }
  assert.equal(signatures.size, 4);
});

test("menu ticks are brief, reuse one audio context, and close on disposal", async () => {
  const menu = new MenuAudio();
  try {
    menu.play();
    await Promise.resolve();
    menu.play();
    await Promise.resolve();
    assert.equal(Context.instances.length, 1);
    const context = Context.instances[0];
    assert.equal(context.oscillators.length, 2);
    for (const note of context.oscillators) assert.ok(note.stopped - note.started <= 0.1);
    menu.dispose();
    assert.equal(context.state, "closed");
  } finally { menu.dispose(); }
});

test("disposing before audio resumes prevents delayed playback", async () => {
  const music = new Chiptune("dash");
  const menu = new MenuAudio();
  music.play();
  menu.play();
  music.dispose();
  menu.dispose();
  await Promise.resolve();
  for (const context of Context.instances) {
    assert.equal(context.oscillators.length, 0);
    assert.equal(context.state, "closed");
  }
});

test("unavailable audio does not interrupt gameplay or menu navigation", () => {
  globalThis.AudioContext = class { constructor() { throw new Error("Unavailable"); } } as unknown as typeof AudioContext;
  assert.doesNotThrow(() => { const music = new Chiptune("survival"); music.play(); music.dispose(); });
  assert.doesNotThrow(() => { const menu = new MenuAudio(); menu.play(); menu.dispose(); });
});
