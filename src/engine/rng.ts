/** Seeded RNG (mulberry32). The simulation must never use Math.random(). */
export interface RngState {
  s: number;
}

export function createRng(seed: number): RngState {
  return { s: seed >>> 0 };
}

/** Returns a float in [0, 1) and advances the state in place. */
export function next(rng: RngState): number {
  rng.s = (rng.s + 0x6d2b79f5) >>> 0;
  let t = rng.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Integer in [1, sides], e.g. a die roll. */
export function roll(rng: RngState, sides: number): number {
  return 1 + Math.floor(next(rng) * sides);
}

/** Fisher-Yates shuffle returning a new array. */
export function shuffle<T>(rng: RngState, items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next(rng) * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Derive a 32-bit seed from any mix of numbers and strings (FNV-1a). Used for turn/dice/enemy sub-seeds. */
export function seedFrom(...parts: (number | string)[]): number {
  let h = 0x811c9dc5;
  for (const ch of parts.join("|")) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** A one-off float in [0, 1) for the given seed parts. */
export function chance(...parts: (number | string)[]): number {
  return next(createRng(seedFrom(...parts)));
}
