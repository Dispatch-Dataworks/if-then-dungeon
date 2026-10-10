/** Hero actions, hero attacks and class default behaviors. Every function performs exactly one action. */
import { add, back, bfs, DIRS, dirTo, eq, left, manhattan, right, rotate, type Dir, type Vec } from "./board";
import { CARDS, CONTENT, HEROES, key } from "./content";
import { applyStatus, damageEnemy, damageHero, isBloodTile, rollStatus } from "./effects";
import {
  boardOf, emit, enemyAt, enemyName, enemyTags, forwardOf, hasLoS, hazardous, isIllusion, isRevealed,
  mechanicAt, obstacleAt, open, solid, trapAt, visibleEnemies, type EnemyState, type GameState,
} from "./state";

const cursed = (s: GameState) => (s.hero.statuses.cursed ?? 0) > 0;
/** Directions to try when the way ahead is blocked: right, then left, then turn around (left first when cursed). */
const rotationOrder = (s: GameState): Dir[] =>
  cursed(s) ? [left(s.hero.facing), right(s.hero.facing), back(s.hero.facing)] : [right(s.hero.facing), left(s.hero.facing), back(s.hero.facing)];

// ---------- movement ----------

/** Puts the hero on a tile and resolves what happens on arrival (traps, blood, push plates, exit). */
export function enterTile(state: GameState, p: Vec, depth = 0) {
  const h = state.hero;
  h.pos = p;
  h.movedThisLoop = true;
  if (eq(p, boardOf(state).exit)) {
    state.status = "won";
    emit(state, "win", "The hero reaches the exit!", p);
    return;
  }
  const trap = trapAt(state, p);
  if (trap) stepOnTrap(state, trap);
  if (isBloodTile(state, p) && !h.statuses.blood_tile_resist) {
    applyStatus(h.statuses, "bleed", 1);
    emit(state, "status", "Blood tile: bleeding.", p);
  }
  const mech = mechanicAt(state, p);
  if (mech?.id === "M_PUSH_PLATES" && mech.dir && depth < 3 && state.hero.hp > 0) {
    if (h.statuses.push_resist) emit(state, "info", "Braced: the push plate does nothing.", p);
    else {
      const to = add(p, mech.dir);
      if (open(state, to)) {
        emit(state, "push", `A push plate shoves the hero ${mech.dir}.`, p);
        enterTile(state, to, depth + 1);
      } else emit(state, "info", "The push plate clanks, but the way is blocked.", p);
    }
  }
}

function stepOnTrap(state: GameState, trap: string) {
  const def = CONTENT.traps[trap]!;
  if (def.damage === undefined) return; // region traps (fog, smoke) resolve at loop end
  damageHero(state, def.damage, CARDS[trap]?.name ?? trapName(trap), { ignoreArmor: true });
  if (state.hero.hp <= 0) return;
  for (const st of def.appliesStatus ?? []) {
    if (applyStatus(state.hero.statuses, st, def.statusStacks)) emit(state, "status", `The hero is ${statusWord(st)}.`, state.hero.pos);
  }
}

export const trapName = (id: string) => id.replace(/^T_/, "").toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
export const statusWord = (st: string) =>
  ({ snare_root: "snared", bleed: "bleeding", poison: "poisoned", cursed: "cursed", fear: "afraid", stun: "stunned" })[st] ?? st;

function effectiveSpeed(state: GameState, base: number) {
  return Math.max(0, base + state.hero.runeSpeed - (state.hero.statuses.snare_root ? 1 : 0));
}

/** Walk up to n tiles in a direction, stopping early when blocked. Returns tiles moved. */
function walk(state: GameState, dir: Dir, n: number): number {
  let moved = 0;
  for (let i = 0; i < n && state.status === "playing" && state.hero.hp > 0; i++) {
    const next = add(state.hero.pos, dir);
    if (isIllusion(state, next) && !isRevealed(state, next)) {
      state.revealed.push(key(next));
      damageHero(state, CONTENT.traps.T_ILLUSION_WALL!.damageOnImpact ?? 2, "An illusion wall", { ignoreArmor: true });
      emit(state, "reveal", "That wall was an illusion... and solid!", next);
      break;
    }
    if (!open(state, next)) break;
    enterTile(state, next);
    moved++;
  }
  return moved;
}

function fail(state: GameState, text: string) {
  emit(state, "fail", text, state.hero.pos);
}

function moveForward(state: GameState, tiles: number, requireAll = false): boolean {
  const n = effectiveSpeed(state, state.hero.speedTiles + tiles - 1);
  if (n === 0) return fail(state, "Snared: can't move!"), false;
  if (requireAll) {
    for (let i = 1; i <= n; i++) {
      if (!open(state, forwardOf(state, i))) return fail(state, `Not enough room to sprint.`), false;
    }
  }
  const moved = walk(state, state.hero.facing, n);
  if (moved === 0) fail(state, "Blocked: the move fails.");
  return moved > 0;
}

/** Move 1 tile, turning clockwise to the first open direction if the way ahead is blocked. */
function forwardOrRotate(state: GameState, avoid?: (p: Vec) => boolean): boolean {
  const ok = (d: Dir) => open(state, add(state.hero.pos, d)) && !(avoid?.(add(state.hero.pos, d)));
  if (ok(state.hero.facing)) return moveForward(state, 1);
  const d = rotationOrder(state).find(ok);
  if (!d) return emit(state, "wait", "Nowhere to go: the hero waits.", state.hero.pos), false;
  state.hero.facing = d;
  emit(state, "turn", `The way is blocked: the hero turns ${d}.`, state.hero.pos);
  return moveForward(state, 1);
}

function stepAside(state: GameState): boolean {
  const sides = cursed(state) ? [left(state.hero.facing), right(state.hero.facing)] : [right(state.hero.facing), left(state.hero.facing)];
  const safe = sides.find((d) => open(state, add(state.hero.pos, d)) && !hazardous(state, add(state.hero.pos, d)));
  const d = safe ?? sides.find((d) => open(state, add(state.hero.pos, d)));
  if (!d) return fail(state, "No room to step aside."), false;
  if (effectiveSpeed(state, 1) === 0) return fail(state, "Snared: can't move!"), false;
  enterTile(state, add(state.hero.pos, d));
  emit(state, "move", "The hero steps aside.", state.hero.pos);
  return true;
}

function stepToward(state: GameState, target: Vec): boolean {
  const path = bfs(state.hero.pos, (p) => eq(p, target), (p) => open(state, p) && !hazardous(state, p), true, 30);
  const step = path?.[0];
  if (!step || !open(state, step)) return forwardOrRotate(state);
  state.hero.facing = dirTo(state.hero.pos, step)!;
  return moveForward(state, 1);
}

function stepAwayFrom(state: GameState, threat: Vec): boolean {
  const options = DIRS.map((d) => ({ d, p: add(state.hero.pos, d) }))
    .filter(({ p }) => open(state, p) && !hazardous(state, p))
    .sort((a, b) => manhattan(b.p, threat) - manhattan(a.p, threat));
  const best = options[0];
  if (!best || manhattan(best.p, threat) <= manhattan(state.hero.pos, threat)) return forwardOrRotate(state);
  state.hero.facing = best.d;
  return moveForward(state, 1);
}

// ---------- attacks ----------

function lineTargets(state: GameState, range: number): EnemyState | undefined {
  for (let i = 1; i <= range; i++) {
    const p = forwardOf(state, i);
    const e = enemyAt(state, p);
    if (e) return e;
    if (solid(state, p) && (obstacleAt(state, p) === null || CONTENT.obstacles[obstacleAt(state, p)!]!.blocksLoS)) return undefined;
  }
  return undefined;
}

export function heroAttack(state: GameState): boolean {
  const def = HEROES[state.heroId]!.heroAttack;
  const h = state.hero;
  let target: EnemyState | undefined;
  switch (def.key) {
    case "melee":
    case "melee_push": {
      target = enemyAt(state, forwardOf(state));
      if (!target) {
        const d = [right(h.facing), left(h.facing), back(h.facing)].find((d) => enemyAt(state, add(h.pos, d)));
        if (d) {
          h.facing = d;
          target = enemyAt(state, add(h.pos, d));
        }
      }
      break;
    }
    case "line_reach":
    case "ranged_los":
    case "ranged_first_in_los":
    case "ranged_tile_splash":
      target = lineTargets(state, def.range);
      if (!target && def.key !== "line_reach") {
        // Ranged heroes turn toward the nearest visible enemy in a straight line.
        const inLine = visibleEnemies(state).filter((e) => (e.pos.x === h.pos.x || e.pos.y === h.pos.y) && manhattan(e.pos, h.pos) <= def.range);
        const e = inLine.sort((a, b) => manhattan(a.pos, h.pos) - manhattan(b.pos, h.pos))[0];
        if (e) {
          h.facing = e.pos.x === h.pos.x ? (e.pos.y < h.pos.y ? "N" : "S") : e.pos.x < h.pos.x ? "W" : "E";
          target = lineTargets(state, def.range);
        }
      }
      if (!target && def.key === "line_reach") {
        const d = [right(h.facing), left(h.facing), back(h.facing)].find((d) => enemyAt(state, add(h.pos, d)));
        if (d) { h.facing = d; target = enemyAt(state, add(h.pos, d)); }
      }
      break;
    case "ranged_nearest":
      target = state.enemies
        .filter((e) => manhattan(e.pos, h.pos) <= def.range && ((e.statuses.mark ?? 0) > 0 || hasLoS(state, h.pos, e.pos)))
        .sort((a, b) => manhattan(a.pos, h.pos) - manhattan(b.pos, h.pos))[0];
      break;
  }
  if (!target) return fail(state, `${def.name} hits nothing.`), false;

  let dmg = def.damage;
  const b = def.bonus;
  if (b) {
    const unaware = b.vsUnaware && dirTo(target.pos, h.pos) !== target.facing && !eq(add(target.pos, target.facing), h.pos);
    const slowed = b.vsStatus?.some((st) => (target!.statuses[st] ?? 0) > 0);
    if ((b.vsTag && enemyTags(target).includes(b.vsTag)) || slowed || unaware || (b.vsHpAtOrBelowHalf && target.hp * 2 <= target.maxHp)) {
      dmg += b.damageAdd ?? 0;
    }
  }
  const pierce = (h.statuses.armor_pierce ?? 0) > 0;
  if (pierce) delete h.statuses.armor_pierce;
  emit(state, "attack", `${def.name}!`, target.pos);
  const tPos = target.pos;
  damageEnemy(state, target, dmg, { ignoreArmor: pierce });
  if (target.hp > 0) {
    if (def.statusOnHit && rollStatus(state, def.statusOnHit, `hero-hit-${target.uid}`)) {
      applyStatus(target.statuses, def.statusOnHit.status, def.statusOnHit.stacks);
      emit(state, "status", `${enemyName(target)} is ${statusWord(def.statusOnHit.status)}.`, tPos);
    }
    if (def.key === "melee_push") {
      const to = add(target.pos, h.facing);
      if (open(state, to)) {
        target.pos = to;
        emit(state, "push", `${enemyName(target)} is knocked back.`, to);
      }
    }
  }
  return true;
}

// ---------- defaults ----------

export function defaultBehavior(state: GameState) {
  const key = HEROES[state.heroId]!.defaultBehavior.key;
  const h = state.hero;
  const seen = visibleEnemies(state);
  const nearest = [...state.enemies].sort((a, b) => manhattan(a.pos, h.pos) - manhattan(b.pos, h.pos))[0];
  const adjacent = state.enemies.find((e) => manhattan(e.pos, h.pos) === 1);
  emit(state, "default", "No rule fired: default behavior.", h.pos);
  switch (key) {
    case "hold_if_enemy_visible_else_forward":
      if (seen.length) return emit(state, "wait", "Enemy in sight: holding position.", h.pos);
      return forwardOrRotate(state);
    case "hold_if_enemy_adjacent_else_forward":
      if (adjacent) return emit(state, "wait", "Enemy next to us: holding position.", h.pos);
      return forwardOrRotate(state);
    case "sidestep_hazard_else_forward":
      if (hazardous(state, forwardOf(state))) return stepAside(state);
      return forwardOrRotate(state);
    case "scan_then_move_safest":
      return forwardOrRotate(state, (p) => hazardous(state, p) || state.enemies.some((e) => manhattan(e.pos, p) <= 1));
    case "wait_if_safe_else_step_aside":
    case "keep_distance":
      if (adjacent) return stepAside(state);
      return forwardOrRotate(state);
    case "cautious_avoid_cursed":
      return forwardOrRotate(state, (p) => trapAt(state, p) === "T_CURSE_SIGIL");
    case "charge_nearest_visible":
    case "track": {
      const target = seen.sort((a, b) => manhattan(a.pos, h.pos) - manhattan(b.pos, h.pos))[0];
      if (target) return stepToward(state, target.pos);
      return forwardOrRotate(state);
    }
    case "kite":
      if (nearest && manhattan(nearest.pos, h.pos) <= 2) return stepAwayFrom(state, nearest.pos);
      return forwardOrRotate(state);
    default:
      return forwardOrRotate(state);
  }
}

// ---------- card actions ----------

export function performAction(state: GameState, cardId: string) {
  const card = CARDS[cardId]!;
  const h = state.hero;
  const p = card.params;
  emit(state, "action", `${card.name}.`, h.pos);
  if ((h.statuses.stun ?? 0) > 0 || (h.statuses.hesitation ?? 0) > 0) {
    delete h.statuses.hesitation;
    return emit(state, "wait", "Stunned/hesitating: the action is lost.", h.pos);
  }
  if (h.statuses.fear && (card.engineKey === "move_forward") && visibleEnemies(state).some((e) => dirTo(h.pos, e.pos) === h.facing || isAhead(state, e.pos))) {
    return fail(state, "Too afraid to step toward the enemy!");
  }
  switch (card.engineKey) {
    case "move_forward": return void moveForward(state, p.tiles ?? 1, !!p.requiresTwoOpen);
    case "turn":
      h.facing = p.dir === "left" ? left(h.facing) : p.dir === "right" ? right(h.facing) : back(h.facing);
      return;
    case "wait": return;
    case "jump_forward": {
      const mid = forwardOf(state, 1), land = forwardOf(state, 2);
      const midObstacle = obstacleAt(state, mid);
      if (h.statuses.snare_root) return fail(state, "Snared: can't jump!");
      if ((midObstacle && !CONTENT.obstacles[midObstacle]!.jumpable) || isIllusion(state, mid)) return fail(state, "Too tall to jump over.");
      if (!open(state, land) || isIllusion(state, land)) return fail(state, "No safe landing: the jump fails.");
      emit(state, "jump", "The hero jumps!", land);
      return void enterTile(state, land);
    }
    case "move_backward": {
      const to = add(h.pos, back(h.facing));
      if (effectiveSpeed(state, 1) === 0) return fail(state, "Snared: can't move!");
      if (!open(state, to)) return fail(state, "Can't back up: blocked.");
      return void enterTile(state, to);
    }
    case "step_aside_nearest_open": return void stepAside(state);
    case "buff":
      applyStatus(h.statuses, p.buff, (p.durationLoops ?? 1) + 1);
      return;
    case "stomp_corpse": {
      const before = state.corpses.length;
      state.corpses = state.corpses.filter((c) => manhattan(c.pos, h.pos) > (p.radius ?? 1));
      return emit(state, "info", before > state.corpses.length ? "Corpses crushed." : "Nothing to stomp.", h.pos);
    }
    case "ward_spawn":
      state.wardTurns = p.blocksResurrectionTurns ?? 1;
      return emit(state, "info", "A ward stops the dead from rising this turn.", h.pos);
    case "cleanse":
      for (const st of p.cleanses as string[]) {
        if (!h.statuses[st]) continue;
        h.statuses[st] = Math.max(0, h.statuses[st]! - (p.stacks ?? 1));
        if (!h.statuses[st] || st !== "poison" && st !== "bleed") delete h.statuses[st];
        emit(state, "cleanse", `Cleansed ${statusWord(st)}.`, h.pos);
      }
      if (p.alsoGrants) applyStatus(h.statuses, p.alsoGrants.buff, (p.alsoGrants.durationLoops ?? 1) + 1);
      return;
    case "reveal":
    case "probe_adjacent": {
      const r = p.radius ?? 1;
      for (const [k, t] of boardOf(state).traps) {
        const [x, y] = k.split(",").map(Number) as [number, number];
        if (t === "T_ILLUSION_WALL" && manhattan({ x, y }, h.pos) <= r && !state.revealed.includes(k)) {
          state.revealed.push(k);
          emit(state, "reveal", "An illusion wall is revealed!", { x, y });
        }
      }
      return;
    }
    case "taunt":
      for (const e of visibleEnemies(state)) {
        delete e.statuses.enraged;
        applyStatus(e.statuses, "hesitation", 1);
      }
      return emit(state, "info", "Enemies in sight hesitate.", h.pos);
    case "hero_attack": return void heroAttack(state);
    default:
      throw new Error(`No action implementation for ${card.engineKey}`);
  }
}

function isAhead(state: GameState, p: Vec): boolean {
  for (let i = 1; i <= 3; i++) if (eq(forwardOf(state, i), p)) return true;
  return false;
}


