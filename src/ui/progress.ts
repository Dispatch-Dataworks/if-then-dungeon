/** Campaign progress in localStorage. Every access is guarded: the game must work when storage is blocked. */
import { HERO_LIST, LEVELS } from "../engine/content";
import { unlockedUpgrades } from "../engine/upgrades";
import { prefersReducedMotion } from "./dom";

export interface Progress {
  version: 1;
  /** Level IDs cleared at least once. */
  cleared: number[];
  /** Hero id -> level IDs cleared with that hero (drives hero upgrades). */
  heroClears: Record<string, number[]>;
  /** Level IDs whose "What's new" panel has been shown. */
  seenIntro: number[];
  heroId: string;
  /** Playback speed multiplier (0 = instant). */
  speed: number;
  /** Hero id -> chosen look ("m" or "f"); heroes without an entry use the mixed default (see looks.ts). */
  heroLooks: Record<string, "m" | "f">;
}

const KEY = "if-then-dungeon.progress.v1";
const fresh = (): Progress => ({ version: 1, cleared: [], heroClears: {}, seenIntro: [], heroId: "H_SWORDSMAN", speed: prefersReducedMotion() ? 0 : 1, heroLooks: {} });

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
      heroClears: Object.fromEntries(
        Object.entries(p.heroClears && typeof p.heroClears === "object" ? p.heroClears : {})
          .filter(([, v]) => Array.isArray(v))
          .map(([k, v]) => [k, (v as unknown[]).filter((n): n is number => typeof n === "number")]),
      ),
      heroLooks: Object.fromEntries(
        Object.entries(p.heroLooks && typeof p.heroLooks === "object" ? p.heroLooks : {}).filter(([, v]) => v === "m" || v === "f"),
      ),
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

export function markCleared(levelId: number, heroId: string) {
  update((p) => {
    if (!p.cleared.includes(levelId)) p.cleared.push(levelId);
    const mine = (p.heroClears[heroId] ??= []);
    if (!mine.includes(levelId)) mine.push(levelId);
  });
}

/** Different levels cleared with this hero. */
export const heroLevelsCleared = (heroId: string) => (unlockAll ? 99 : memory.heroClears[heroId]?.length ?? 0);

/** Upgrade ids this hero has earned (all of them with ?unlock=all). */
export const heroUpgrades = (heroId: string) => unlockedUpgrades(heroId, heroLevelsCleared(heroId));

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
