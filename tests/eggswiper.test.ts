import { test } from "node:test";
import assert from "node:assert/strict";
import { createNest, openEgg, flagEgg, neighbors, NEST_SIZE, DUCK_COUNT } from "../lib/eggswiper.ts";

test("first egg and its neighbors are safe with exactly ten ducks", () => {
  for (let first = 0; first < 64; first++) {
    const nest = openEgg(createNest(), first, () => 0.37);
    assert.equal(nest.phase, "playing");
    assert.equal(nest.eggs.filter((egg) => egg.duck).length, DUCK_COUNT);
    for (const index of [first, ...neighbors(first)]) assert.equal(nest.eggs[index].duck, false);
    assert.ok(nest.eggs[first].open);
    nest.eggs.forEach((egg, index) => assert.equal(egg.nearby, neighbors(index).filter((n) => nest.eggs[n].duck).length));
  }
});

test("neighbors respect the board edges", () => {
  assert.deepEqual(neighbors(0), [1, 8, 9]);
  assert.deepEqual(neighbors(63), [54, 55, 62]);
  assert.equal(neighbors(27).length, 8);
});

test("empty regions expand without opening ducks or flagged eggs", () => {
  const initial = flagEgg(createNest(), 1);
  const nest = openEgg(initial, 0, () => 0.5);
  assert.equal(initial.planted, false);
  assert.ok(nest.opened > 1);
  assert.equal(nest.eggs[1].open, false);
  assert.ok(nest.eggs.filter((egg) => egg.duck).every((egg) => !egg.open));
  assert.equal(nest.opened, nest.eggs.filter((egg) => egg.open).length);
  assert.equal(openEgg(nest, 0), nest);
});

test("flags toggle and prevent opening until removed", () => {
  const marked = flagEgg(createNest(), 0);
  assert.equal(openEgg(marked, 0), marked);
  const unmarked = flagEgg(marked, 0);
  const opened = openEgg(unmarked, 0, () => 0.5);
  assert.ok(opened.eggs[0].open);
  assert.equal(flagEgg(opened, 0), opened);
});

test("hitting a duck reveals every duck and locks the board", () => {
  const nest = openEgg(createNest(), 0, () => 0.3);
  const ducks = nest.eggs.flatMap((egg, i) => egg.duck ? [i] : []);
  const marked = flagEgg(nest, ducks[1]);
  const lost = openEgg(marked, ducks[0]);
  assert.equal(lost.phase, "lost");
  assert.equal(lost.hit, ducks[0]);
  assert.equal(lost.opened, nest.opened);
  assert.ok(ducks.every((i) => lost.eggs[i].open));
  assert.equal(openEgg(lost, 63), lost);
  assert.equal(flagEgg(lost, 63), lost);
});

test("opening every safe egg wins without requiring flags", () => {
  let nest = openEgg(createNest(), 0, () => 0.2);
  for (let index = 0; index < 64; index++) {
    if (!nest.eggs[index].duck) nest = openEgg(nest, index);
  }
  assert.equal(nest.phase, "won");
  assert.equal(nest.opened, NEST_SIZE ** 2 - DUCK_COUNT);
  assert.equal(flagEgg(nest, 0), nest);
  assert.equal(openEgg(nest, nest.eggs.findIndex((egg) => egg.duck)), nest);
});

test("paused nests ignore inputs and a new nest resets the run", () => {
  const nest = { ...openEgg(createNest(), 0, () => 0.7), phase: "paused" as const };
  assert.equal(openEgg(nest, 63), nest);
  assert.equal(flagEgg(nest, 63), nest);
  const fresh = createNest();
  assert.equal(fresh.opened, 0);
  assert.equal(fresh.planted, false);
  assert.ok(fresh.eggs.every((egg) => !egg.duck && !egg.open && !egg.flagged));
});
