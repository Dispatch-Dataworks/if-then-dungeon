/** Kid-facing words for cards, statuses, levels and everything else the UI shows. Derived from the JSON content. */
import themesJson from "../../themes.json";
import { CARDS, CONTENT, ENEMIES, HEROES, MODIFIERS, getLevel, type CardType } from "../engine/content";
import { threatOf } from "../engine/game";
import { sheetName } from "./assets";

export interface ThemeDef {
  id: string;
  name: string;
  summary: string;
  palette: { floor: string; accent: string; glow: string };
  levels: number[];
}
export const THEMES = themesJson.themes as ThemeDef[];
export const themeOf = (levelId: number) => THEMES.find((t) => t.levels.includes(levelId)) ?? THEMES[0]!;

export const TYPE_LABEL: Record<CardType, string> = {
  sensor: "Sensor",
  action: "Action",
  operator: "Operator",
  hero_action: "Hero action",
};

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const modifierName = (m: string) => capital(m);

/** Name for any content ID: card, hero, enemy, modifier, trap, obstacle, mechanic or pickup. */
export function nameOf(id: string): string {
  return CARDS[id]?.name ?? HEROES[id]?.name ?? ENEMIES[id]?.name ?? sheetName(id)
    ?? (MODIFIERS[id] ? `${modifierName(id)} (modifier)` : id.replace(/^[A-Z]+_/, "").toLowerCase().replace(/_/g, " "));
}

export const STATUS_WORD: Record<string, string> = {
  poison: "Poisoned",
  bleed: "Bleeding",
  snare_root: "Snared",
  slowed: "Slowed",
  stun: "Stunned",
  hesitation: "Hesitating",
  fear: "Afraid",
  cursed: "Cursed",
  enraged: "Enraged",
  mark: "Marked",
  ranged_resist: "Shield up",
  push_resist: "Braced",
  armor_pierce: "Piercing",
  blood_tile_resist: "Cauterized",
};
const STACKING = new Set(["poison", "bleed"]);

export function statusLabel(status: string, n: number): string {
  const word = STATUS_WORD[status] ?? capital(status.replace(/_/g, " "));
  return STACKING.has(status) ? `${word} ×${n}` : `${word} (${n} loop${n === 1 ? "" : "s"})`;
}

export function statusRule(status: string): string {
  return (CONTENT.statuses[status] as { rule?: string } | undefined)?.rule ?? "";
}

const enemiesWithTag = (tag: string) => Object.values(ENEMIES).filter((e) => e.tags.includes(tag)).map((e) => e.name);
const listWords = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} or ${xs[xs.length - 1]}`);

function attackText(heroId: string): string {
  const a = HEROES[heroId]!.heroAttack;
  const how: Record<string, string> = {
    melee: "hits an enemy next to the hero (turns to face it if needed)",
    melee_push: "hits an enemy next to the hero and knocks it back 1 tile",
    line_reach: `hits the first enemy up to ${a.range} tiles straight ahead`,
    ranged_los: `shoots the first enemy in a straight line up to ${a.range} tiles away`,
    ranged_first_in_los: `fires a bolt at the first enemy in a straight line up to ${a.range} tiles away`,
    ranged_tile_splash: `throws at the first enemy in a straight line up to ${a.range} tiles away`,
    ranged_nearest: `shoots the nearest enemy it can see within ${a.range} tiles`,
  };
  let text = `${a.name}: ${how[a.key] ?? "attacks"} for ${a.damage} damage.`;
  const b = a.bonus;
  if (b?.damageAdd) {
    const when = b.vsTag ? `${b.vsTag} enemies` : b.vsStatus ? `${b.vsStatus.map((s) => (STATUS_WORD[s] ?? s).toLowerCase()).join(" / ")} enemies` : b.vsUnaware ? "enemies facing away" : b.vsHpAtOrBelowHalf ? "enemies at half HP or less" : "some enemies";
    text += ` +${b.damageAdd} against ${when}.`;
  }
  if (a.statusOnHit) text += ` ${a.statusOnHit.chancePercent && a.statusOnHit.chancePercent < 100 ? `${a.statusOnHit.chancePercent}% chance to make` : "Makes"} the target ${(STATUS_WORD[a.statusOnHit.status] ?? a.statusOnHit.status).toLowerCase()}.`;
  return text;
}

/** One or two sentences explaining what a card does. Hero Attack depends on the hero. */
export function cardText(cardId: string, heroId?: string): string {
  const c = CARDS[cardId];
  if (!c) return "";
  const p = c.params;
  const trap = (id: string) => nameOf(id);
  switch (c.engineKey) {
    case "wall_ahead": return "TRUE when the tile in front of the hero is a wall or another obstacle.";
    case "blocked_ahead": return "TRUE when the tile in front is a wall, an obstacle or an enemy.";
    case "enemy_ahead": return "TRUE when an enemy stands on the tile directly in front of the hero.";
    case "enemy_adjacent": return "TRUE when an enemy is right next to the hero (front, back or sides; not diagonal).";
    case "enemy_visible_los": return "TRUE when the hero can see any enemy (in sight range, not hidden behind walls).";
    case "enemy_within": return `TRUE when an enemy is ${p.distance ?? 2} steps away or closer (counting steps, no diagonals; walls don't matter).`;
    case "enemy_left": return "TRUE when an enemy is right next to the hero on its left side.";
    case "enemy_right": return "TRUE when an enemy is right next to the hero on its right side.";
    case "enemy_count_at_least": return `TRUE when there are ${p.count ?? 3} or more enemies on the board.`;
    case "enemy_visible_by_tag": {
      const names = enemiesWithTag(p.tag);
      return `TRUE when the hero can see a ${p.tag} enemy${names.length ? ` (${listWords(names)}, or anything ${p.tag === "armored" ? "with the Iron modifier" : "like it"})` : ""}.`;
    }
    case "enemy_visible_by_status": return `TRUE when the hero can see an enemy that is ${(STATUS_WORD[p.status] ?? p.status).toLowerCase()}.`;
    case "ranged_threat_visible": return `TRUE when the hero can see an enemy that shoots from range (${listWords(enemiesWithTag("ranged"))}).`;
    case "trap_ahead": return `TRUE when the tile in front of the hero has ${trap(p.trapId)}.`;
    case "any_trap_ahead": return "TRUE when the tile in front of the hero has any trap.";
    case "on_trap": return `TRUE when the hero is standing on ${trap(p.trapId)}.`;
    case "hazard_ahead": return `TRUE when the tile in front of the hero has ${trap(p.hazardId)}.`;
    case "in_hazard": return `TRUE when the hero is standing in ${trap(p.hazardId)}.`;
    case "any_hazard_ahead": return "TRUE when the tile in front has a trap, fog, smoke, or a vent that is on (or about to turn on).";
    case "safe_ahead": return "TRUE when the tile in front is open and safe: no wall, enemy, trap, active vent or blood.";
    case "occupied_or_will_be_occupied_ahead": return "TRUE when an enemy is in front of the hero, or an enemy could step there next.";
    case "vent_active_ahead": return "TRUE when the steam vent in front of the hero is ON right now.";
    case "vent_active_here": return "TRUE when the hero is standing on a steam vent that is ON.";
    case "corpse_within": return `TRUE when a corpse is within ${p.distance ?? 1} step of the hero.`;
    case "resurrection_pending": return "TRUE when there is Pressure and a defeated enemy that could rise again (and no Ward is active).";
    case "hero_hp_at_or_below": return `TRUE when the hero has ${p.hp ?? 3} HP or less.`;
    case "hero_has_status": return `TRUE when the hero is ${(STATUS_WORD[p.status] ?? p.status).toLowerCase()}.`;
    case "phase_threat_next_loop": return `TRUE when an enemy that walks through walls (${listWords(enemiesWithTag("phase"))}) is within 2 steps.`;
    case "illusion_ahead": return "TRUE when the tile in front is an illusion wall, even if it looks open.";
    case "blood_tile_within": return `TRUE when a blood tile is within ${p.distance ?? 2} steps of the hero.`;
    case "move_forward":
      return p.requiresTwoOpen
        ? `Move ${p.tiles} tiles forward. Fails if either tile is blocked.`
        : `Move ${p.tiles ?? 1} tile forward. Fails (and wastes the loop) if blocked.`;
    case "turn": return p.dir === "around" ? "Turn to face the opposite way." : `Turn 90° to the ${p.dir}. Turning always works.`;
    case "wait": return "Do nothing this loop. Sometimes waiting is the smart move.";
    case "jump_forward": return "Jump 2 tiles forward, over a trap or a low obstacle (water, lava, chasm, bones). Fails if the landing tile is blocked.";
    case "move_backward": return "Step 1 tile backward without turning around. Fails if blocked.";
    case "step_aside_nearest_open": return "Step sideways to the right (or left if right is blocked), preferring a safe tile. Facing stays the same.";
    case "buff":
      if (p.buff === "ranged_resist") return "Raise your shield: ranged hits deal 1 less damage this loop and the next.";
      if (p.buff === "push_resist") return "Brace: ignore push plates and knock-backs this loop and the next.";
      if (p.buff === "armor_pierce") return "Your next Hero Attack ignores enemy armor.";
      return "Gives the hero a short buff.";
    case "stomp_corpse": return "Crush corpses next to the hero, so ghouls can't feed and the dead can't rise.";
    case "ward_spawn": return "A ward that stops defeated enemies from rising again at the end of this turn.";
    case "cleanse": {
      const what = listWords((p.cleanses as string[]).map((s) => (STATUS_WORD[s] ?? s).toLowerCase()));
      return `Cure being ${what}${p.stacks && p.stacks < 99 ? " (1 stack)" : ""}.${p.alsoGrants ? " Blood tiles can't make you bleed for a moment." : ""}`;
    }
    case "reveal": return `Light up the area: illusion walls within ${p.radius ?? 2} steps are revealed.`;
    case "probe_adjacent": return "Poke around: reveals illusion walls right next to the hero.";
    case "taunt": return "Distract every enemy you can see: they hesitate (lose their next action) and stop being enraged.";
    case "hero_attack": return heroId ? attackText(heroId) : "Your hero's own attack. What it does depends on the hero.";
    case "not": return "Flips the sensor right after it: TRUE becomes FALSE and FALSE becomes TRUE.";
    case "and": return "TRUE only when the parts on both sides are TRUE.";
    case "or": return "TRUE when at least one side is TRUE.";
    case "else": return "Adds an ELSE part to a row: when the IF is FALSE, the hero does the ELSE action.";
    default: return "";
  }
}

export const threatLine = (cardId: string) => `Threat ${threatOf(cardId)}: adds ${threatOf(cardId)} Pressure if left unplaced.`;

export function levelTitle(levelId: number): string {
  return `Level ${levelId}: ${themeOf(levelId).name}`;
}

/** Short subtitle for the level list: what the level brings in. */
export function levelBlurb(levelId: number): string {
  const intro = getLevel(levelId).introduces;
  if (!intro.length) return "Final challenge: everything you've learned.";
  const names = intro.slice(0, 3).map(nameOf);
  return `New: ${names.join(", ")}${intro.length > 3 ? ` +${intro.length - 3} more` : ""}`;
}

export const DIR_WORD: Record<string, string> = { N: "north", E: "east", S: "south", W: "west" };
export const DIR_ARROW: Record<string, string> = { N: "↑", E: "→", S: "↓", W: "←" };

/** Engine event text with direction letters spelled out. */
export function eventText(text: string): string {
  return text.replace(/\b(turns|shoves the hero) ([NESW])\b/g, (_, verb: string, d: string) => `${verb} ${DIR_WORD[d]}`);
}
