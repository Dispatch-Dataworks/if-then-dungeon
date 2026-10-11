/** Enemy AI: one action per enemy per loop, chosen by its behavior key with seeded variability. */
import { add, bfs, DIRS, dirTo, eq, manhattan, right, type Vec } from "./board";
import { CONTENT, ENEMIES, MODIFIERS } from "./content";
import { applyStatus, damageEnemy, damageHero, rollStatus } from "./effects";
import { enterTile, statusWord } from "./hero";
import { applyHeroStatus, resistsPush } from "./upgrades";
import { chance } from "./rng";
import {
  boardOf, emit, enemyAt, enemyDamage, enemyName, hasLoS, hazardous, inBounds, open, solid, trapAt,
  type EnemyState, type GameState,
} from "./state";

const roll = (s: GameState, e: EnemyState, salt: string) => chance(s.seed, s.turnIndex, s.loop, e.uid, salt);

function canSeeHero(s: GameState, e: EnemyState): boolean {
  const def = ENEMIES[e.typeId]!;
  return manhattan(e.pos, s.hero.pos) <= def.sightRange && hasLoS(s, e.pos, s.hero.pos);
}

/** Enemies never walk onto damaging traps (they know their dungeon); phasing enemies ignore terrain entirely. */
function passableFor(s: GameState, e: EnemyState, avoidHazards: boolean) {
  const ghost = ENEMIES[e.typeId]!.ignoresObstacles;
  return (p: Vec) => {
    if (!inBounds(s, p) || enemyAt(s, p) || eq(p, s.hero.pos)) return false;
    if (ghost) return true;
    if (solid(s, p)) return false;
    const trap = trapAt(s, p);
    if (trap && CONTENT.traps[trap]!.damage) return false;
    return !(avoidHazards && hazardous(s, p));
  };
}

/** Move one tile toward a goal. Prefers hazard-free paths, falls back to any path. */
function stepTowards(s: GameState, e: EnemyState, goal: (p: Vec) => boolean): boolean {
  const path =
    bfs(e.pos, goal, passableFor(s, e, true), true, 40) ?? bfs(e.pos, goal, passableFor(s, e, false), true, 40);
  const step = path?.[0];
  if (!step || goal(step) && (eq(step, s.hero.pos) || enemyAt(s, step))) return false;
  if (!passableFor(s, e, false)(step)) return false;
  moveEnemy(s, e, step);
  return true;
}

function moveEnemy(s: GameState, e: EnemyState, to: Vec) {
  if (e.modifier && MODIFIERS[e.modifier]?.leavesBoardEffect === "blood_tile") {
    s.bloodTiles.push({ pos: e.pos, loops: CONTENT.boardEffects.blood_tile!.durationLoops ?? 5 });
  }
  e.facing = dirTo(e.pos, to) ?? e.facing;
  e.pos = to;
  e.movedThisLoop = true;
  const trap = trapAt(s, to);
  const dmg = trap ? CONTENT.traps[trap]!.damage : undefined;
  if (dmg && !ENEMIES[e.typeId]!.ignoresObstacles) damageEnemy(s, e, dmg, { trap: true });
}

/**
 * Distance-to-hero maps over walkable terrain (ignoring units), shared by every enemy in a loop.
 * "safe" avoids hazards; "any" only avoids damaging traps. Recomputed when the hero moves or the loop changes.
 */
const fieldCache = new WeakMap<GameState, { stamp: string; safe: Int16Array; any: Int16Array }>();
function heroFields(s: GameState) {
  const b = boardOf(s);
  const stamp = `${s.loop}:${s.hero.pos.x},${s.hero.pos.y}:${s.revealed.length}:${s.bloodTiles.length}`;
  const cached = fieldCache.get(s);
  if (cached?.stamp === stamp) return cached;
  const build = (avoid: boolean) => {
    const dist = new Int16Array(b.width * b.height).fill(-1);
    const queue = [s.hero.pos];
    dist[s.hero.pos.y * b.width + s.hero.pos.x] = 0;
    for (let qi = 0; qi < queue.length; qi++) {
      const p = queue[qi]!;
      const d = dist[p.y * b.width + p.x]!;
      for (const dir of DIRS) {
        const n = add(p, dir);
        if (!inBounds(s, n) || dist[n.y * b.width + n.x]! >= 0 || solid(s, n)) continue;
        const trap = trapAt(s, n);
        if (trap && CONTENT.traps[trap]!.damage) continue;
        if (avoid && hazardous(s, n)) continue;
        dist[n.y * b.width + n.x] = d + 1;
        queue.push(n);
      }
    }
    return dist;
  };
  const fields = { stamp, safe: build(true), any: build(false) };
  fieldCache.set(s, fields);
  return fields;
}

function chase(s: GameState, e: EnemyState, tiles = ENEMIES[e.typeId]!.speedTiles) {
  for (let i = 0; i < tiles && e.hp > 0; i++) {
    if (manhattan(e.pos, s.hero.pos) <= 1) return;
    if (ENEMIES[e.typeId]!.ignoresObstacles) {
      if (!stepTowards(s, e, (p) => manhattan(p, s.hero.pos) === 1)) return;
      continue;
    }
    const b = boardOf(s);
    const { safe, any } = heroFields(s);
    const pass = passableFor(s, e, false);
    let moved = false;
    for (const field of [safe, any]) {
      const here = field[e.pos.y * b.width + e.pos.x]!;
      let best: Vec | undefined;
      let bestD = here >= 0 ? here : Infinity;
      for (const dir of DIRS) {
        const n = add(e.pos, dir);
        if (!inBounds(s, n) || !pass(n)) continue;
        const d = field[n.y * b.width + n.x]!;
        if (d >= 0 && d < bestD) { bestD = d; best = n; }
      }
      if (best) { moveEnemy(s, e, best); moved = true; break; }
    }
    if (!moved) return;
  }
}

function flee(s: GameState, e: EnemyState) {
  const options = DIRS.map((d) => add(e.pos, d)).filter(passableFor(s, e, true));
  const best = options.sort((a, b) => manhattan(b, s.hero.pos) - manhattan(a, s.hero.pos))[0];
  if (best && manhattan(best, s.hero.pos) > manhattan(e.pos, s.hero.pos)) moveEnemy(s, e, best);
}

function inAttackRange(s: GameState, e: EnemyState): boolean {
  const def = ENEMIES[e.typeId]!;
  const d = manhattan(e.pos, s.hero.pos);
  if (d === 1) return true;
  return def.attackRange > 1 && d <= def.attackRange && hasLoS(s, e.pos, s.hero.pos);
}

function attack(s: GameState, e: EnemyState) {
  const def = ENEMIES[e.typeId]!;
  e.facing = dirTo(e.pos, s.hero.pos) ?? e.facing;
  const ranged = manhattan(e.pos, s.hero.pos) > 1;
  const dmg = enemyDamage(e);
  emit(s, "enemy_attack", `${enemyName(e)} ${ranged ? "shoots" : "attacks"}!`, e.pos);
  damageHero(s, dmg, enemyName(e), { ranged, kind: ranged ? "ranged" : "melee" });
  if (s.hero.hp <= 0) return;
  const onHits = [def.statusOnHit, e.modifier ? MODIFIERS[e.modifier]?.statusOnHit : undefined];
  for (const onHit of onHits) {
    if (!onHit || !rollStatus(s, onHit, `enemy-hit-${e.uid}-${onHit.status}`)) continue;
    const alt = (onHit as { altStatus?: string }).altStatus;
    const st = alt && roll(s, e, "alt") < 0.5 ? alt : onHit.status;
    if (applyHeroStatus(s, st, onHit.stacks)) emit(s, "status", `The hero is ${statusWord(st)}.`, s.hero.pos);
    if (e.modifier === "cursed") applyHeroStatus(s, "hesitation", 1);
  }
  if (def.pushOnHitTiles && s.hero.hp > 0 && !resistsPush(s, "shove")) {
    const dir = dirTo(e.pos, s.hero.pos);
    const to = dir ? add(s.hero.pos, dir) : undefined;
    if (to && open(s, to)) {
      emit(s, "push", "The hero is shoved back!", to);
      enterTile(s, to);
    }
  }
}

/** One enemy's action for this loop. */
export function enemyAct(s: GameState, e: EnemyState) {
  const def = ENEMIES[e.typeId]!;
  const st = e.statuses;
  e.movedThisLoop = false;
  if (st.stun || st.hesitation) {
    delete st.hesitation;
    return;
  }
  if ((st.slowed || st.snare_root) && s.loop % 2 === 1) return;
  if (st.fear) return flee(s, e);
  const v = def.variability;
  if (v.hesitateChancePercent && !st.enraged && roll(s, e, "hesitate") * 100 < v.hesitateChancePercent) return;

  const key = def.behavior.key;
  const d = manhattan(e.pos, s.hero.pos);
  // Support enemies with no damage use their ability instead of attacking.
  if (key === "keep_distance_pulse") {
    if (d <= def.attackRange && hasLoS(s, e.pos, s.hero.pos) && (s.loop + e.uid) % 2 === 0) {
      const status = roll(s, e, "pulse") < 0.5 ? "fear" : "cursed";
      emit(s, "enemy_attack", `${enemyName(e)} chants a ${status === "fear" ? "fear" : "curse"} spell!`, e.pos);
      if (applyHeroStatus(s, status)) emit(s, "status", `The hero is ${statusWord(status)}.`, s.hero.pos);
      return;
    }
    if (d < 2) return flee(s, e);
    if (d > def.attackRange) return void stepTowards(s, e, (p) => manhattan(p, s.hero.pos) <= def.attackRange);
    return;
  }
  if (key === "support_cadence") {
    const offset = Number(e.ai.offset ?? 0);
    if ((s.loop + offset) % 3 === 0) {
      const ally = s.enemies.filter((o) => o !== e && manhattan(o.pos, e.pos) <= 5 && !o.statuses.enraged)[0];
      if (ally) {
        applyStatus(ally.statuses, "enraged");
        return emit(s, "enemy_buff", `${enemyName(e)} enrages ${enemyName(ally)}!`, ally.pos);
      }
    }
    if (d < 3) return flee(s, e);
    if (d > 5) return void stepTowards(s, e, (p) => manhattan(p, s.hero.pos) <= 4);
    return;
  }

  if (inAttackRange(s, e) && enemyDamage(e) > 0) {
    // Ranged attackers with a reload only fire on their loop; otherwise they hold position.
    const every = Number(v.fireEveryLoops ?? 1);
    const ranged = manhattan(e.pos, s.hero.pos) > 1;
    if (ranged && every > 1 && (s.loop + e.uid) % every !== 0) return;
    return attack(s, e);
  }

  switch (key) {
    case "patrol_turn_right": {
      if (canSeeHero(s, e)) return chase(s, e);
      const ahead = add(e.pos, e.facing);
      if (passableFor(s, e, true)(ahead)) return moveEnemy(s, e, ahead);
      e.facing = right(e.facing);
      return;
    }
    case "chase_within_3_else_wander": {
      if (d <= 3) return chase(s, e);
      const dirs = DIRS.map((dd) => add(e.pos, dd)).filter(passableFor(s, e, true));
      const pick = dirs[Math.floor(roll(s, e, "wander") * dirs.length)];
      if (pick) moveEnemy(s, e, pick);
      return;
    }
    case "shoot_if_los_else_reposition":
      return void stepTowards(s, e, (p) => manhattan(p, s.hero.pos) <= def.attackRange && hasLoS(s, p, s.hero.pos));
    case "march_hold_chokepoints":
      if (v.guardChancePercent && roll(s, e, "guard") * 100 < v.guardChancePercent) return;
      return chase(s, e);
    case "chase_if_visible_else_stomp_forward": {
      const every = Number(v.chaseOrHoldEveryLoops ?? 3);
      const mode = Math.floor((s.loop + e.uid) / every) % 2 === 0 || st.enraged ? "chase" : "hold";
      if (mode === "hold") return;
      if (canSeeHero(s, e) || d <= 4) return chase(s, e);
      const ahead = add(e.pos, e.facing);
      if (passableFor(s, e, true)(ahead)) return moveEnemy(s, e, ahead);
      e.facing = right(e.facing);
      return;
    }
    case "ambush_near_snares":
      if (d <= 3) return chase(s, e);
      return;
    case "hold_lane_push":
      if (canSeeHero(s, e) || d <= 3) return chase(s, e);
      return;
    case "seek_corpses": {
      const corpse = s.corpses.find((c) => eq(c.pos, e.pos));
      if (corpse) {
        s.corpses = s.corpses.filter((c) => c !== corpse);
        e.hp = Math.min(e.maxHp, e.hp + 2);
        return emit(s, "enemy_buff", `${enemyName(e)} feeds and heals.`, e.pos);
      }
      const near = s.corpses.filter((c) => manhattan(c.pos, e.pos) <= 5).sort((a, b) => manhattan(a.pos, e.pos) - manhattan(b.pos, e.pos))[0];
      if (near && e.ai.priority === "corpse") return void stepTowards(s, e, (p) => eq(p, near.pos));
      return chase(s, e);
    }
    default:
      return chase(s, e);
  }
}

/** Ally buffs/decay and status ticking for enemies at loop end. */
export function enemyLoopEnd(s: GameState) {
  for (const e of [...s.enemies]) {
    const statuses = e.statuses;
    if (statuses.poison) { damageEnemy(s, e, 1, { trap: true }); statuses.poison--; }
    if (e.hp > 0 && statuses.bleed) { if (e.movedThisLoop) damageEnemy(s, e, 1, { trap: true }); statuses.bleed--; }
    for (const k of Object.keys(statuses)) {
      if (k !== "poison" && k !== "bleed") statuses[k]!--;
      if (statuses[k]! <= 0) delete statuses[k];
    }
  }
}

export function enemyIntentText(e: EnemyState): string {
  return ENEMIES[e.typeId]!.behavior.text;
}
