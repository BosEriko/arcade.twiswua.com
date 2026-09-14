export function runnerNightAmount(distance: number) {
  const cycle = Math.floor(distance / 5000);
  if (cycle === 0) return 0;
  const progress = Math.min(1, Math.max(0, (distance - cycle * 5000) / 600));
  const eased = progress * progress * (3 - 2 * progress);
  return cycle % 2 ? eased : 1 - eased;
}

function blend(day: string, night: string, amount: number) {
  return (
    "#" +
    [0, 2, 4, 6]
      .map((offset) => {
        const a = parseInt(day.slice(offset, offset + 2) || "ff", 16);
        const b = parseInt(night.slice(offset, offset + 2) || "ff", 16);
        return Math.round(a + (b - a) * amount)
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
  );
}

export function runnerPalette(distance: number) {
  const night = runnerNightAmount(distance);
  return {
    night,
    sky: blend("f5dfb5", "2d4546", night),
    sun: blend("fff3d2", "f4edcd", night),
    farHill: blend("d3d1aa", "3c5652", night),
    nearHill: blend("b7c29b", "486358", night),
    cloud: blend("fff6dfaa", "d4decb55", night),
    ground: blend("778e67", "233a32", night),
    grass: blend("c9d6a7", "77967a", night),
    detail: blend("566f51", "5f7b61", night),
  };
}
