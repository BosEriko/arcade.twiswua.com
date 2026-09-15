export const NEST_SIZE = 8;
export const DUCK_COUNT = 10;
export type Egg = { duck: boolean; nearby: number; open: boolean; flagged: boolean };
export type Nest = {
  eggs: Egg[];
  phase: "playing" | "paused" | "lost" | "won";
  planted: boolean;
  opened: number;
  hit: number | null;
};

export function createNest(): Nest {
  return {
    eggs: Array.from({ length: NEST_SIZE ** 2 }, () => ({
      duck: false, nearby: 0, open: false, flagged: false,
    })),
    phase: "playing", planted: false, opened: 0, hit: null,
  };
}

export function neighbors(index: number) {
  const row = Math.floor(index / NEST_SIZE);
  const col = index % NEST_SIZE;
  const result: number[] = [];
  for (let y = Math.max(0, row - 1); y <= Math.min(NEST_SIZE - 1, row + 1); y++) {
    for (let x = Math.max(0, col - 1); x <= Math.min(NEST_SIZE - 1, col + 1); x++) {
      if (y !== row || x !== col) result.push(y * NEST_SIZE + x);
    }
  }
  return result;
}

export function openEgg(nest: Nest, index: number, random = Math.random): Nest {
  const egg = nest.eggs[index];
  if (nest.phase !== "playing" || !egg || egg.open || egg.flagged) return nest;
  const next = { ...nest, eggs: nest.eggs.map((cell) => ({ ...cell })) };
  if (!next.planted) {
    const safe = new Set([index, ...neighbors(index)]);
    const candidates = next.eggs.map((_, i) => i).filter((i) => !safe.has(i));
    for (let i = 0; i < DUCK_COUNT; i++) {
      const pick = i + Math.floor(random() * (candidates.length - i));
      [candidates[i], candidates[pick]] = [candidates[pick], candidates[i]];
      next.eggs[candidates[i]].duck = true;
    }
    next.eggs.forEach((cell, i) => {
      cell.nearby = neighbors(i).filter((n) => next.eggs[n].duck).length;
    });
    next.planted = true;
  }
  if (next.eggs[index].duck) {
    next.phase = "lost";
    next.hit = index;
    next.eggs.forEach((cell) => { if (cell.duck) cell.open = true; });
    return next;
  }
  const pending = [index];
  while (pending.length) {
    const current = pending.pop()!;
    const cell = next.eggs[current];
    if (cell.open || cell.flagged || cell.duck) continue;
    cell.open = true;
    next.opened++;
    if (!cell.nearby) pending.push(...neighbors(current));
  }
  if (next.opened === NEST_SIZE ** 2 - DUCK_COUNT) next.phase = "won";
  return next;
}

export function flagEgg(nest: Nest, index: number): Nest {
  const egg = nest.eggs[index];
  if (nest.phase !== "playing" || !egg || egg.open) return nest;
  return { ...nest, eggs: nest.eggs.map((cell, i) => i === index ? { ...cell, flagged: !cell.flagged } : cell) };
}
