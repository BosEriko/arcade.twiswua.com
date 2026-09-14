import { test } from "node:test";
import assert from "node:assert/strict";
import { createFlight } from "../lib/flight.ts";
import { drawFlight } from "../lib/flight-draw.ts";

type Scenery = { x: number; y: number; scale: number };

function sceneryAt(distance: number, width: number) {
  const clouds: Scenery[] = [];
  const trees: Scenery[] = [];
  let translation = { x: 0, y: 0 };
  const context = new Proxy(
    { fillStyle: "" },
    {
      get(target, key) {
        if (key === "fillStyle") return target.fillStyle;
        if (key === "createLinearGradient")
          return () => ({ addColorStop() {} });
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
  drawFlight(context, run, 0);
  return { clouds, trees };
}

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
