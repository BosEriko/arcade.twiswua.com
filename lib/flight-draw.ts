import {
  FLIGHT_GROUND,
  FLIGHT_HEIGHT,
  GATE_WIDTH,
  type Flight,
} from "./flight";

function ellipse(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}

function star(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  rotation = 0,
) {
  c.fillStyle = color;
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2 + rotation;
    const r = i % 2 ? radius * 0.45 : radius;
    const px = x + Math.cos(angle) * r,
      py = y + Math.sin(angle) * r;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();
}

function cloud(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string,
) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  ellipse(c, 0, 6, 65, 14, color);
  ellipse(c, -29, -3, 28, 21, color);
  ellipse(c, 6, -15, 34, 31, color);
  ellipse(c, 34, 0, 26, 21, color);
  c.restore();
}

function wing(c: CanvasRenderingContext2D, side: number, beat: number) {
  c.save();
  c.scale(side, 1);
  c.rotate(-0.18 - beat * 0.45);
  c.fillStyle = "#fff8d9";
  c.strokeStyle = "#ddd7b2";
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(0, 7);
  c.bezierCurveTo(-5, -18, -21, -24, -48, -26);
  c.bezierCurveTo(-52, -16, -37, -11, -31, -8);
  c.bezierCurveTo(-43, -13, -46, -7, -35, 0);
  c.bezierCurveTo(-43, 1, -35, 13, -18, 15);
  c.closePath();
  c.fill();
  c.stroke();
  c.strokeStyle = "#dedbbd";
  c.beginPath();
  c.moveTo(-7, 5);
  c.quadraticCurveTo(-19, -2, -34, -11);
  c.stroke();
  c.restore();
}

export function drawFlyingTiger(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  velocity: number,
  beat: number,
  scale = 1,
) {
  c.save();
  c.translate(x, y);
  c.rotate(Math.max(-0.28, Math.min(0.65, velocity / 900)));
  c.scale(scale, scale);
  wing(c, -1, beat * 0.6);
  c.strokeStyle = "#d27a32";
  c.lineWidth = 7;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(-15, 13);
  c.bezierCurveTo(-39, 19, -38, -2, -29, 3);
  c.stroke();
  ellipse(c, 1, 12, 19, 16, "#ed9e43");
  ellipse(c, -7, 25, 7, 4, "#f7ba65");
  ellipse(c, 15, 24, 7, 4, "#f7ba65");
  wing(c, 1, beat);
  ellipse(c, -9, -19, 8, 9, "#86512e");
  ellipse(c, 22, -19, 8, 9, "#86512e");
  ellipse(c, -9, -19, 4, 5, "#efb56a");
  ellipse(c, 22, -19, 4, 5, "#efb56a");
  ellipse(c, 7, -4, 24, 22, "#f4ab4c");
  c.fillStyle = "#64432d";
  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      c.beginPath();
      c.moveTo(7 + side * 23, -15 + i * 12);
      c.lineTo(7 + side * 11, -9 + i * 9);
      c.lineTo(7 + side * 24, -6 + i * 11);
      c.fill();
    }
  }
  c.beginPath();
  c.moveTo(2, -26);
  c.lineTo(7, -13);
  c.lineTo(12, -26);
  c.fill();
  ellipse(c, 3, 7, 10, 9, "#fff0c7");
  ellipse(c, 16, 7, 10, 9, "#fff0c7");
  ellipse(c, 1, -3, 2.7, 3.6, "#303d34");
  ellipse(c, 18, -3, 2.7, 3.6, "#303d34");
  ellipse(c, 10, 5, 3.3, 2.5, "#734435");
  c.restore();
}

function pillar(
  c: CanvasRenderingContext2D,
  x: number,
  edge: number,
  top: boolean,
  broken: boolean,
) {
  c.save();
  if (broken) c.globalAlpha = 0.3;
  const y = top ? 0 : edge;
  const height = top ? edge : FLIGHT_GROUND - edge;
  c.fillStyle = "#678679";
  c.fillRect(x, y, GATE_WIDTH, height);
  c.fillStyle = "#8da18a";
  c.fillRect(x + 4, y, 15, height);
  c.fillStyle = "#426d65";
  c.fillRect(x + GATE_WIDTH - 13, y, 13, height);
  c.strokeStyle = "#496f652f";
  c.lineWidth = 2;
  for (let row = y + 34; row < y + height; row += 42) {
    c.beginPath();
    c.moveTo(x + 2, row);
    c.lineTo(x + GATE_WIDTH - 2, row);
    c.moveTo(x + (Math.floor(row / 42) % 2 ? 27 : 49), row);
    c.lineTo(x + (Math.floor(row / 42) % 2 ? 27 : 49), row - 40);
    c.stroke();
  }
  const capY = top ? edge - 24 : edge;
  c.fillStyle = "#3d655a";
  c.fillRect(x - 7, capY, GATE_WIDTH + 14, 24);
  c.fillStyle = "#9eb78b";
  c.fillRect(x - 7, capY, GATE_WIDTH + 14, 8);
  c.fillStyle = "#c4cd95";
  c.fillRect(x - 4, capY, GATE_WIDTH + 8, 3);
  c.strokeStyle = "#365b46";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(x + 23, top ? 0 : edge + 24);
  c.bezierCurveTo(
    x + 46,
    top ? edge * 0.4 : edge + 48,
    x + 7,
    top ? edge * 0.7 : edge + 86,
    x + 25,
    top ? edge - 27 : Math.min(FLIGHT_GROUND, edge + 126),
  );
  c.stroke();
  for (let i = 0; i < 4; i++) {
    const leafY = top ? edge - 38 - i * 24 : edge + 36 + i * 24;
    if (leafY < 0 || leafY > FLIGHT_GROUND) continue;
    ellipse(
      c,
      x + 25 + (i % 2 ? 8 : -7),
      leafY,
      8,
      4,
      i % 2 ? "#8eae72" : "#567e52",
    );
  }
  c.restore();
}

export function drawFlight(
  c: CanvasRenderingContext2D,
  run: Flight,
  now: number,
  reducedMotion = false,
) {
  const w = run.width,
    h = FLIGHT_HEIGHT;
  const preview = run.phase === "ready";
  const clock =
    run.phase === "playing"
      ? run.time
      : preview && !reducedMotion
        ? now
        : run.time;
  const scroll = preview ? clock * 12 : run.distance;
  const dusk = run.gatesPassed >= 15;
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, dusk ? "#b6cbd1" : "#f8dbac");
  sky.addColorStop(0.65, dusk ? "#d6d7bd" : "#f8edcb");
  sky.addColorStop(1, "#bacdb2");
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);
  const sunX = w * 0.77;
  ellipse(c, sunX, 148, 70, 70, dusk ? "#eef3dd" : "#fff4d6");
  ellipse(c, sunX, 148, 89, 89, "#fff6df20");

  for (let layer = 0; layer < 3; layer++) {
    const base = 425 + layer * 73;
    const speed = [0.1, 0.22, 0.4][layer];
    const offset = (scroll * speed) % 450;
    c.fillStyle = ["#b5c5ad", "#90b5a0", "#679b88"][layer];
    c.beginPath();
    c.moveTo(-450, h);
    for (let x = -450; x < w + 900; x += 450) {
      c.lineTo(x - offset, base + 45);
      c.bezierCurveTo(
        x + 100 - offset,
        base - 135,
        x + 255 - offset,
        base - 85,
        x + 450 - offset,
        base + 45,
      );
    }
    c.lineTo(w + 900, h);
    c.closePath();
    c.fill();
  }
  for (let i = 0; i < Math.ceil(w / 380) + 2; i++) {
    const x = i * 380 - ((scroll * 0.17) % 380);
    cloud(c, x + 80, 112 + (i % 3) * 66, 0.55 + (i % 2) * 0.22, "#fff9e3b3");
    cloud(c, x + 240, 568 + (i % 2) * 38, 0.95, "#e1edd3a0");
  }
  for (let i = 0; i < Math.ceil(w / 290) + 2; i++) {
    const x = i * 290 - ((scroll * 0.48) % 290);
    const y = 538 + (i % 3) * 24;
    c.fillStyle = "#447e6d";
    c.beginPath();
    c.moveTo(x - 16, y + 110);
    c.lineTo(x + 7, y - 42);
    c.lineTo(x + 22, y + 110);
    c.fill();
    for (const side of [-1, 1]) {
      c.beginPath();
      c.moveTo(x + 7, y - 40);
      c.quadraticCurveTo(x + side * 78, y - 70, x + side * 65, y - 6);
      c.quadraticCurveTo(x + side * 25, y - 44, x + 7, y - 40);
      c.fill();
    }
  }
  c.strokeStyle = "#60857755";
  c.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const x =
      (((w * 0.43 + i * 53 - scroll * 0.09) % (w + 100)) + w + 100) % (w + 100);
    const y = 195 + Math.sin(i * 2) * 32;
    c.beginPath();
    c.moveTo(x - 7, y + 3);
    c.quadraticCurveTo(x - 3, y - 2, x, y + 2);
    c.quadraticCurveTo(x + 3, y - 2, x + 7, y + 3);
    c.stroke();
  }

  for (const gate of run.gates) {
    if (gate.x > w + 100 || gate.x < -150) continue;
    pillar(c, gate.x, gate.center - gate.gap / 2, true, gate.broken);
    pillar(c, gate.x, gate.center + gate.gap / 2, false, gate.broken);
    if (!gate.collected) {
      const x = gate.x + GATE_WIDTH / 2;
      const y = gate.center;
      const pulse = reducedMotion ? 1 : 1 + Math.sin(clock * 4) * 0.1;
      ellipse(
        c,
        x,
        y,
        23 * pulse,
        23 * pulse,
        gate.shield ? "#b1ead335" : "#ffdf8a40",
      );
      if (gate.shield) {
        c.strokeStyle = "#edfbe7";
        c.lineWidth = 3;
        c.fillStyle = "#70b7a0";
        c.beginPath();
        c.moveTo(x, y - 16);
        c.lineTo(x + 13, y - 10);
        c.lineTo(x + 11, y + 7);
        c.lineTo(x, y + 17);
        c.lineTo(x - 11, y + 7);
        c.lineTo(x - 13, y - 10);
        c.closePath();
        c.fill();
        c.stroke();
        c.fillStyle = "#e7fae0";
        c.fillRect(x - 2, y - 7, 4, 15);
        c.fillRect(x - 7, y - 2, 14, 4);
      } else {
        star(c, x + 1, y + 2, 17, "#b27a37");
        star(c, x, y, 16, "#ffe49a", Math.sin(clock * 2) * 0.08);
        star(c, x, y - 1, 8, "#fff5d0");
      }
    }
  }
  if (preview) {
    for (let i = 0; i < 3; i++)
      star(c, w * 0.76 + i * 41, h * 0.43 + Math.sin(i) * 24, 9, "#e7b766");
  }
  const heroX = preview ? w * (w < 650 ? 0.5 : 0.72) : run.x;
  const heroY = preview
    ? (w < 650 ? 187 : 345) + (reducedMotion ? 0 : Math.sin(clock * 2) * 9)
    : run.y;
  const heroScale = preview ? (w < 650 ? 1.65 : 2.05) : 1;
  if (run.shield && run.phase !== "over") {
    c.strokeStyle = "#f1f8d780";
    c.lineWidth = 2;
    c.fillStyle = "#f6ffe416";
    c.beginPath();
    c.arc(heroX, heroY, 43 * heroScale, 0, Math.PI * 2);
    c.fill();
    c.stroke();
  }
  if (!preview) {
    for (let i = 0; i < 4; i++)
      ellipse(
        c,
        run.x - 28 - i * 10,
        run.y + 10 + i * 2,
        3 - i * 0.5,
        2,
        `rgba(255,241,200,${0.35 - i * 0.07})`,
      );
  }
  c.globalAlpha =
    run.invincible > 0 && !reducedMotion
      ? 0.65 + Math.sin(clock * 25) * 0.25
      : 1;
  drawFlyingTiger(
    c,
    heroX,
    heroY,
    preview ? 0 : run.velocity,
    preview ? Math.sin(clock * 6) * 0.5 + 0.5 : run.wing,
    heroScale,
  );
  c.globalAlpha = 1;

  for (const particle of run.particles) {
    c.globalAlpha = particle.life / particle.maxLife;
    star(c, particle.x, particle.y, 3, particle.color);
  }
  c.globalAlpha = 1;
  c.fillStyle = "#345d50";
  c.fillRect(0, FLIGHT_GROUND, w, 42);
  c.fillStyle = "#7e9e69";
  c.fillRect(0, FLIGHT_GROUND, w, 7);
  c.fillStyle = "#bdd095";
  c.fillRect(0, FLIGHT_GROUND, w, 2);
  for (let i = 0; i < Math.ceil(w / 42) + 1; i++) {
    const x = i * 42 - (scroll % 42);
    ellipse(c, x, FLIGHT_GROUND + 6, 14, 8, "#7e9e69");
    c.fillStyle = "#244d4340";
    c.fillRect(x + 10, FLIGHT_GROUND + 25, 13, 3);
  }
  if (run.flash > 0 && !reducedMotion) {
    c.fillStyle = `rgba(255,241,209,${run.flash * 1.6})`;
    c.fillRect(0, 0, w, h);
  }
}
