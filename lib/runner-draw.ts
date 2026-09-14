import { RUNNER_GROUND, RUNNER_HEIGHT, type Runner } from "./runner";
import { runnerPalette } from "./runner-palette";

export function drawRunner(
  c: CanvasRenderingContext2D,
  run: Runner,
  reducedMotion: boolean,
) {
  const w = run.width,
    g = RUNNER_GROUND;
  const palette = runnerPalette(run.distance);
  c.fillStyle = palette.sky;
  c.fillRect(0, 0, w, RUNNER_HEIGHT);
  c.fillStyle = palette.sun;
  c.beginPath();
  c.arc(w * 0.8, 90, 36, 0, Math.PI * 2);
  c.fill();
  if (palette.night > 0) {
    c.globalAlpha = palette.night;
    c.fillStyle = palette.sky;
    c.beginPath();
    c.arc(w * 0.8 - 13, 80, 33, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
  }
  for (let layer = 0; layer < 2; layer++) {
    const scroll = run.distance * (layer ? 0.18 : 0.07);
    c.fillStyle = layer ? palette.nearHill : palette.farHill;
    c.beginPath();
    c.moveTo(-300, g);
    for (
      let i = Math.floor(scroll / 300) - 1;
      i <= Math.ceil((scroll + w) / 300);
      i++
    ) {
      const x = i * 300 - scroll;
      c.lineTo(x, g - 20);
      c.quadraticCurveTo(x + 145, g - 220 + layer * 60, x + 300, g - 20);
    }
    c.lineTo(w + 300, g);
    c.closePath();
    c.fill();
  }
  c.fillStyle = palette.cloud;
  const cloudScroll = run.distance * 0.1;
  for (
    let i = Math.floor(cloudScroll / 290) - 1;
    i <= Math.ceil((w + cloudScroll) / 290);
    i++
  ) {
    const x = i * 290 - cloudScroll,
      y = 65 + (((i % 3) + 3) % 3) * 28;
    c.fillRect(x, y, 72, 10);
    c.fillRect(x + 15, y - 10, 40, 10);
    c.fillRect(x + 28, y - 17, 19, 7);
  }
  c.fillStyle = palette.ground;
  c.fillRect(0, g, w, 88);
  c.fillStyle = palette.grass;
  c.fillRect(0, g, w, 3);
  c.fillStyle = palette.detail;
  const groundScroll = run.distance % 100;
  for (let x = -100; x < w + 100; x += 100) {
    c.fillRect(x - groundScroll, g + 18, 20, 3);
    c.fillRect(x + 50 - groundScroll, g + 48, 7, 3);
    c.fillRect(x + 24 - groundScroll, g + 70, 32, 2);
  }
  for (const obstacle of run.obstacles) {
    const { x, y, width, height, kind } = obstacle;
    if (kind === "cactus") {
      c.fillStyle = "#335c49";
      c.fillRect(x + 10, y, 13, height);
      c.fillRect(x, y + 16, 10, 9);
      c.fillRect(x, y + 8, 6, 13);
      c.fillRect(x + 23, y + 23, 7, 8);
      c.fillRect(x + 27, y + 13, 6, 18);
      c.fillStyle = "#92b079";
      c.fillRect(x + 12, y + 3, 3, height - 3);
    } else if (kind === "log") {
      c.fillStyle = "#81573d";
      c.fillRect(x, y + 5, width, height - 5);
      c.fillStyle = "#be8a53";
      c.fillRect(x + width - 14, y, 14, height);
      c.fillStyle = "#e0b87b";
      c.fillRect(x + width - 10, y + 6, 6, height - 12);
      c.fillStyle = "#b17b48";
      c.fillRect(x + 4, y + 11, width - 24, 4);
    } else {
      const wing = reducedMotion ? 0 : Math.sin(run.time * 16) > 0 ? -9 : 5;
      c.fillStyle = "#fff0cf";
      c.fillRect(x + 7, y + 9, 32, 17);
      c.fillRect(x, y + 2, 16, 18);
      c.fillStyle = "#d3bf92";
      c.fillRect(x + 20, y + wing, 19, 13);
      c.fillStyle = "#d48a3b";
      c.fillRect(x - 6, y + 11, 9, 5);
      c.fillStyle = "#304b3b";
      c.fillRect(x + 4, y + 6, 3, 3);
    }
  }
  const x = 100,
    y = run.y;
  const low = run.ducking && y === g;
  const stride =
    run.phase === "playing" && y === g && !reducedMotion
      ? Math.sin(run.time * 22) * 5
      : 0;
  c.fillStyle = "#304b3b28";
  c.fillRect(x - 5, g + 3, 65, 5);
  c.save();
  c.translate(x, y);
  c.fillStyle = "#e99b43";
  c.fillRect(3, low ? -23 : -35, low ? 47 : 37, low ? 18 : 27);
  c.fillRect(-9, low ? -18 : -27, 17, 7);
  c.fillRect(-12, low ? -26 : -37, 7, 16);
  c.fillRect(8 + stride, -10, 9, 10);
  c.fillRect(34 - stride, -10, 9, 10);
  c.fillStyle = "#ffbd63";
  c.fillRect(low ? 32 : 20, low ? -26 : -49, 28, 27);
  c.fillRect(low ? 32 : 20, low ? -30 : -55, 7, 8);
  c.fillRect(low ? 52 : 40, low ? -30 : -55, 7, 8);
  c.fillStyle = "#fff0cf";
  c.fillRect(low ? 44 : 32, low ? -12 : -35, 20, 10);
  c.fillStyle = "#503d2c";
  c.fillRect(low ? 53 : 41, low ? -20 : -43, 4, 5);
  c.fillRect(low ? 61 : 49, low ? -12 : -35, 4, 4);
  c.fillRect(10, low ? -22 : -34, 5, 12);
  c.fillRect(22, low ? -22 : -34, 5, 9);
  c.fillRect(low ? 40 : 28, low ? -26 : -49, 4, 8);
  if (run.phase === "over") {
    c.strokeStyle = "#503d2c";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(40, -44);
    c.lineTo(46, -38);
    c.moveTo(46, -44);
    c.lineTo(40, -38);
    c.stroke();
  }
  c.restore();
}
