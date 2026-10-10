/** Campaign progress in localStorage. Every access is guarded: the game must work when storage is blocked. */
import { HERO_LIST, LEVELS } from "../engine/content";
import { prefersReducedMotion } from "./dom";

export interface Progress {
  version: 1;
  /** Level IDs cleared at least once. */
  cleared: number[];
  /** Level IDs whose "What's new" panel has been shown. */
  seenIntro: number[];
  heroId: string;
  /** Playback speed multiplier (0 = instant). */
  speed: number;
}

const KEY = "if-then-dungeon.progress.v1";
const fresh = (): Progress => ({ version: 1, cleared: [], seenIntro: [], heroId: "H_SWORDSMAN", speed: prefersReducedMotion() ? 0 : 1 });

let memory: Progress = load();

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const p = JSON.parse(raw) as Partial<Progress>;
    if (p.version !== 1) return fresh();
    return {
      ...fresh(),
      ...p,
      cleared: Array.isArray(p.cleared) ? p.cleared.filter((n) => typeof n === "number") : [],
      seenIntro: Array.isArray(p.seenIntro) ? p.seenIntro.filter((n) => typeof n === "number") : [],
    };
  } catch {
    return fresh();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // Storage blocked or full: progress lasts for this visit only.
  }
}

export const progress = (): Readonly<Progress> => memory;

export function update(change: (p: Progress) => void) {
  change(memory);
  save();
}

export function markCleared(levelId: number) {
  update((p) => {
    if (!p.cleared.includes(levelId)) p.cleared.push(levelId);
  });
}

export function resetProgress() {
  memory = fresh();
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export const highestCleared = () => Math.max(0, ...memory.cleared);

/** `?unlock=all` opens every level and hero (for playtesting and review). */
const unlockAll = (() => {
  try {
    return new URLSearchParams(location.search).get("unlock") === "all";
  } catch {
    return false;
  }
})();

export function levelUnlocked(levelId: number): boolean {
  if (unlockAll) return true;
  const index = LEVELS.findIndex((l) => l.levelId === levelId);
  return index <= 0 || memory.cleared.includes(LEVELS[index - 1]!.levelId);
}

export function heroUnlocked(heroId: string): boolean {
  const hero = HERO_LIST.find((h) => h.id === heroId);
  if (!hero) return false;
  return unlockAll || hero.tier === "starter" || hero.unlockAfterLevel <= 0 || memory.cleared.includes(hero.unlockAfterLevel);
}

/** Heroes that clearing this level unlocks. */
export const heroesUnlockedBy = (levelId: number) => HERO_LIST.filter((h) => h.tier !== "starter" && h.unlockAfterLevel === levelId);
