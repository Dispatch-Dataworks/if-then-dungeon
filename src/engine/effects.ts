/** Damage, status effects, deaths and drops. */
import { eq, type Vec } from "./board";
import { CONTENT, DROPS, ENEMIES, MODIFIERS, key } from "./content";
import { chance } from "./rng";
import { emit, enemyArmor, enemyName, heroArmor, type EnemyState, type GameState, type Statuses } from "./state";
import { has, once, upgradeName } from "./upgrades";

const STACKING = new Set(["poison", "bleed"]);

export function applyStatus(statuses: Statuses, status: string, amount?: number, immune: string[] = []): boolean {
  if (immune.includes(status)) return false;
  const def = CONTENT.statuses[status];
  if (STACKING.has(status)) {
    statuses[status] = Math.min(def?.maxStacks ?? 3, (statuses[status] ?? 0) + (amount ?? 1));
  } else {
    statuses[status] = Math.max(statuses[status] ?? 0, amount ?? def?.durationLoops ?? 1);
  }
  return true;
}

export type DamageKind = "melee" | "ranged" | "trap" | "illusion" | "region" | "vent" | "status";

export function damageHero(
  state: GameState, amount: number, source: string,
  opts: { ignoreArmor?: boolean; ranged?: boolean; kind?: DamageKind } = {},
) {
  if (amount <= 0 || state.hero.hp <= 0) return;
  const kind = opts.kind ?? (opts.ranged ? "ranged" : "melee");
  const blockedBy = (upgrade: string) => {
    emit(state, "block", `${upgradeName(upgrade)}: ${source} does no damage.`, state.hero.pos);
  };
  if (kind === "trap" && once(state, "U_BULWARK")) return blockedBy("U_BULWARK");
  if (kind === "illusion" && once(state, "U_ILLUMINATION")) return blockedBy("U_ILLUMINATION");
  if (kind === "vent" && once(state, "U_VENT_MASTERY")) return blockedBy("U_VENT_MASTERY");
  if (kind === "region" && has(state, "U_NEUTRALIZER")) return blockedBy("U_NEUTRALIZER");
  let dmg = opts.ignoreArmor ? amount : Math.max(1, amount - heroArmor(state));
  if (opts.ranged && state.hero.statuses.ranged_resist) dmg = Math.max(0, dmg - 1);
  if (kind === "melee" && once(state, "U_EVASION")) dmg = Math.max(0, dmg - 1);
  if ((kind === "melee" || kind === "ranged") && once(state, "U_PARRY")) dmg = Math.max(0, dmg - 1);
  if (dmg > 0 && has(state, "U_RAGE_METER")) state.hero.rage = true;
  if (dmg <= 0) {
    emit(state, "block", `${source} is blocked.`, state.hero.pos);
    return;
  }
  state.hero.hp = Math.max(0, state.hero.hp - dmg);
  emit(state, "hero_hurt", `${source} deals ${dmg} damage (HP ${state.hero.hp}).`, state.hero.pos, { amount: dmg, target: "hero" });
  if (state.hero.hp <= 0 && !state.diedThisTurn) {
    state.diedThisTurn = true;
    emit(state, "hero_dead", "The hero falls!", state.hero.pos);
  }
}

export function healHero(state: GameState, amount: number) {
  const before = state.hero.hp;
  state.hero.hp = Math.min(state.hero.maxHp, state.hero.hp + amount);
  if (state.hero.hp > before) {
    emit(state, "heal", `Healed ${state.hero.hp - before} HP (HP ${state.hero.hp}).`, state.hero.pos, { amount: state.hero.hp - before, target: "hero" });
  }
}

export function damageEnemy(
  state: GameState, enemy: EnemyState, amount: number,
  opts: { ignoreArmor?: boolean; trap?: boolean; armorIgnored?: number } = {},
) {
  if (amount <= 0 || enemy.hp <= 0) return;
  const armor = opts.ignoreArmor || opts.trap ? 0 : Math.max(0, enemyArmor(enemy) - (opts.armorIgnored ?? 0));
  const dmg = Math.max(1, amount + (enemy.statuses.mark && !opts.trap ? 1 : 0) - armor);
  enemy.hp -= dmg;
  emit(state, "enemy_hurt", `${enemyName(enemy)} takes ${dmg} damage.`, enemy.pos, { amount: dmg, target: enemy.uid });
  if (enemy.modifier && MODIFIERS[enemy.modifier]?.enragedAtOrBelowHalfHp && enemy.hp > 0 && enemy.hp * 2 <= enemy.maxHp) {
    applyStatus(enemy.statuses, "enraged");
  }
  if (enemy.hp <= 0) killEnemy(state, enemy);
}

function killEnemy(state: GameState, enemy: EnemyState) {
  state.enemies = state.enemies.filter((e) => e !== enemy);
  emit(state, "enemy_dead", `${enemyName(enemy)} is defeated.`, enemy.pos);
  state.corpses.push({ pos: enemy.pos, typeId: enemy.typeId, modifier: enemy.modifier });
  state.defeatedPool.push(enemy.typeId);
  const skulls = ENEMIES[enemy.typeId]!.dangerSkulls;
  const trophy = skulls >= 3 && has(state, "U_TROPHY_HUNTER") ? 2 : 1;
  if (chance(state.seed, "drop", enemy.uid) * 100 < skulls * DROPS.chancePercentPerSkull * trophy && !state.pickups[key(enemy.pos)]) {
    const table = DROPS.table;
    const pick = table[Math.floor(chance(state.seed, "dropkind", enemy.uid) * table.length)]!;
    state.pickups[key(enemy.pos)] = pick;
    emit(state, "drop", `It drops a ${pick.replace("P_", "").toLowerCase().replace("_", " ")}.`, enemy.pos);
  }
}

/** End-of-loop damage over time and duration countdown for one unit. */
export function tickStatuses(statuses: Statuses, moved: boolean, hurt: (dmg: number, why: string) => void) {
  if (statuses.poison) {
    hurt(1, "Poison");
    statuses.poison--;
  }
  if (statuses.bleed) {
    if (moved) hurt(1, "Bleeding");
    statuses.bleed--;
  }
  for (const s of Object.keys(statuses)) {
    if (s !== "poison" && s !== "bleed") statuses[s]!--;
    if (statuses[s]! <= 0) delete statuses[s];
  }
}

/** Status-applying hits. `chancePercent` uses a seeded roll so retries repeat exactly. */
export function rollStatus(state: GameState, onHit: { status: string; stacks?: number; chancePercent?: number } | undefined, salt: string): boolean {
  if (!onHit) return false;
  const pct = onHit.chancePercent ?? 100;
  return chance(state.seed, state.turnIndex, state.loop, salt) * 100 < pct;
}

export function collectPickups(state: GameState) {
  const h = state.hero;
  for (const [k, id] of Object.entries(state.pickups)) {
    const [x, y] = k.split(",").map(Number) as [number, number];
    const p: Vec = { x, y };
    if (Math.abs(p.x - h.pos.x) + Math.abs(p.y - h.pos.y) > 1) continue;
    delete state.pickups[k];
    const def = CONTENT.pickups[id]!;
    if (def.healHp) healHero(state, def.healHp);
    if (def.armorAdd && h.shardArmor < (def.maxStack ?? 2)) {
      h.shardArmor += def.armorAdd;
      emit(state, "pickup", `Armor shard: armor +1.`, p);
    }
    if (def.speedTilesAdd) {
      h.runeSpeed = def.speedTilesAdd;
      emit(state, "pickup", `Speed rune: moves cover +1 tile this turn.`, p);
    }
  }
}

export const isBloodTile = (state: GameState, p: Vec) => state.bloodTiles.some((b) => eq(b.pos, p));
