/** Hero upgrades: helpers used by the rules that each upgrade changes. Effects are described in heroes.json. */
import { HEROES } from "./content";
import { applyStatus } from "./effects";
import { emit, type GameState } from "./state";

/** Upgrades unlock after clearing this many different levels with the hero (heroes.json, per upgrade). */
export function unlockedUpgrades(heroId: string, levelsClearedWithHero: number): string[] {
  return HEROES[heroId]!.upgrades.filter((u) => levelsClearedWithHero >= u.unlockAfterLevelsClearedWithHero).map((u) => u.id);
}

export const has = (s: GameState, id: string) => s.upgrades.includes(id);

/** For "once per turn" upgrades: true the first time it is called in a turn (and marks it used). */
export function once(s: GameState, id: string): boolean {
  if (!has(s, id) || s.turnFlags[id]) return false;
  s.turnFlags[id] = 1;
  return true;
}

export function upgradeName(id: string): string {
  for (const h of Object.values(HEROES)) {
    const u = h.upgrades.find((x) => x.id === id);
    if (u) return u.name;
  }
  return id;
}

/** Applies a status to the hero, honoring upgrades that cap or block it. Returns true if it took effect. */
export function applyHeroStatus(s: GameState, status: string, amount?: number): boolean {
  const h = s.hero;
  if ((status === "fear" || status === "cursed") && has(s, "U_WARD") && s.loopInTurn < 2) {
    emit(s, "block", "Ward: the hero shrugs it off.", h.pos);
    return false;
  }
  if (!applyStatus(h.statuses, status, amount)) return false;
  if (status === "poison" && has(s, "U_ANTITOXIN")) h.statuses.poison = Math.min(1, h.statuses.poison!);
  if (status === "bleed" && has(s, "U_BLOOD_RESISTANCE")) h.statuses.bleed = Math.min(1, h.statuses.bleed!);
  if ((status === "cursed" || status === "fear") && has(s, "U_CURSE_MITIGATION")) h.statuses[status] = 1;
  return true;
}

/** Whether a push (plate, shove or conveyor) moves the hero, consuming once-per-turn protections. */
export function resistsPush(s: GameState, kind: "plate" | "shove" | "conveyor"): boolean {
  const h = s.hero;
  if (h.statuses.push_resist && kind !== "conveyor") return true;
  if (kind === "plate" && has(s, "U_PUSH_PLATE_RESIST")) return true;
  if (has(s, "U_BRACE") && s.heldThisLoop) return true;
  return once(s, "U_HEAVY_BOOTS");
}

const HARMFUL = ["bleed", "poison", "cursed", "fear", "snare_root", "hesitation", "stun"];
/** Cleric's Cleanse: once per turn after acting, remove one harmful status. */
export function afterHeroAction(s: GameState) {
  const h = s.hero;
  const bad = HARMFUL.find((st) => (h.statuses[st] ?? 0) > 0);
  if (bad && once(s, "U_CLEANSE")) {
    delete h.statuses[bad];
    emit(s, "cleanse", `Cleanse: no longer ${bad === "snare_root" ? "snared" : bad}.`, h.pos);
  }
}
