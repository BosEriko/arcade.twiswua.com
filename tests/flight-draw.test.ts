import { test } from "node:test";
import assert from "node:assert/strict";
import { createFlight, FLIGHT_GROUND, type Flight } from "../lib/flight.ts";
import { drawFlight } from "../lib/flight-draw.ts";

type Scenery = { x: number; y: number; scale: number };

function sceneryAt(distance: number, width: number, state: Partial<Flight> = {}) {
  const clouds: Scenery[] = [];
  const trees: Scenery[] = [];
  const colors: string[] = [];
  let translation = { x: 0, y: 0 };
  const context = new Proxy(
    { fillStyle: "" },
    {
      get(target, key) {
        if (key === "fillStyle") return target.fillStyle;
        if (key === "createLinearGradient")
          return () => ({
            addColorStop(_offset: number, color: string) {
              colors.push(color);
            },
          });
        if (key === "ellipse")
          return (_x: number, _y: number, radius: number) => {
            if (radius === 70) colors.push(target.fillStyle);
          };
        if (key === "translate")
          return (x: number, y: number) => {
            translation = { x, y };
          };
        if (key === "scale")
          return (scale: number) => {
            if ([112, 178, 244, 568, 606].includes(translation.y)) {
              clouds.push({ ...translation, scale });
            }
          };
        if (key === "moveTo")
          return (x: number, y: number) => {
            if (target.fillStyle === "#447e6d" && y >= 648)
              trees.push({ x: x + 16, y, scale: 1 });
          };
        return () => {};
      },
    },
  ) as unknown as CanvasRenderingContext2D;
  const run = createFlight(width);
  run.phase = "playing";
  run.distance = distance;
  Object.assign(run, state);
  drawFlight(context, run, 0);
  return { clouds, trees, colors };
}

test("every palm trunk reaches the ground across scenery variants", () => {
  for (const width of [320, 960, 1920]) {
    for (const distance of [0, 604, 1800, 10000]) {
      const { trees } = sceneryAt(distance, width);
      assert.ok(trees.length > 0);
      assert.ok(trees.every((tree) => tree.y >= FLIGHT_GROUND));
    }
  }
});

test("sky and sun blend continuously through both directions and repeated cycles", () => {
  const colorsAt = (time: number) => sceneryAt(0, 960, { time }).colors;
  const day = colorsAt(0);
  const dusk = colorsAt(33);
  assert.notDeepEqual(day, dusk);
  assert.deepEqual(colorsAt(58), day);
  assert.deepEqual(colorsAt(83), dusk);
  for (const [time, start, end] of [[29, day, dusk], [54, dusk, day]] as const) {
    const middle = colorsAt(time);
    for (let i = 0; i < middle.length; i++) {
      for (const offset of [1, 3, 5]) {
        const channel = (color: string) => parseInt(color.slice(offset, offset + 2), 16);
        assert.ok(Math.abs(channel(middle[i]) - (channel(start[i]) + channel(end[i])) / 2) <= 1);
      }
    }
  }
  for (const boundary of [25, 33, 50, 58, 75, 83, 100]) {
    assert.deepEqual(colorsAt(boundary - 0.001), colorsAt(boundary + 0.001));
  }
  assert.deepEqual(
    sceneryAt(0, 960, { time: 29, gatesPassed: 14 }).colors,
    sceneryAt(0, 960, { time: 29, gatesPassed: 15 }).colors,
  );
  assert.deepEqual(
    sceneryAt(0, 960, { time: 29, phase: "playing" }).colors,
    sceneryAt(0, 960, { time: 29, phase: "paused" }).colors,
  );
});

for (const width of [320, 960, 1920]) {
  for (const [layer, speed, spacing] of [
    ["clouds", 0.17, 380],
    ["trees", 0.48, 290],
  ] as const) {
    test(`${layer} move continuously across recycling boundaries at width ${width}`, () => {
      for (const boundary of [1, 2, 3, 6, 25, 100]) {
        const distance = (boundary * spacing) / speed;
        const before = sceneryAt(distance - 0.01, width)[layer];
        const after = sceneryAt(distance + 0.01, width)[layer];
        const visible = before.filter(({ x }) => x > -60 && x < width + 60);
        assert.ok(visible.length > 0);
        for (const object of visible) {
          assert.ok(
            after.some(
              (next) =>
                Math.abs(next.x - (object.x - 0.02 * speed)) < 1e-7 &&
                next.y === object.y &&
                next.scale === object.scale,
            ),
            `${layer} at x=${object.x} changed position or appearance at boundary ${boundary}`,
          );
        }
      }
    });
  }
}
