/** Turn lifecycle: deal, exchange, roll & lock, execute loops, Pressure and spawning, death and retry. */
import { eq, manhattan } from "./board";
import { CARDS, COSTS, CONTENT, ENEMIES, MODIFIER_COSTS, MODIFIERS, RULES, pressureSpendCap } from "./content";
import { draw, ensureMinimum, type CardInstance, type DeckState } from "./deck";
import { collectPickups, damageHero, tickStatuses } from "./effects";
import { afterHeroAction, applyHeroStatus, resistsPush } from "./upgrades";
import { enemyAct, enemyLoopEnd } from "./enemy";
import { defaultBehavior, enterTile, performAction } from "./hero";
import { createRng, chance, roll, seedFrom } from "./rng";
import { describeRow, evalPredicate, rowCardIds, validateRows, type ParsedRow, type RowDraft } from "./rules/rows";
import {
  boardOf, createState, emit, enemyAt, levelOf, mechanicAt, open, trapAt, ventActive,
  type GameEvent, type GameState,
} from "./state";

export type Phase = "exchange" | "build" | "won" | "lost";

export interface Game {
  state: GameState;
  /** Turn-start state used to rewind on death (same deal, same seeds). */
  snapshot: GameState;
  phase: Phase;
  deaths: number;
  levelRestarts: number;
}

export interface Frame {
  rowIndex: number;
  loopInRow: number;
  /** Whether the row's IF was true this loop (undefined for the turn-end frame). */
  truth?: boolean;
  fired: "then" | "else" | "default";
  events: GameEvent[];
  state: GameState;
}

export interface TurnResult {
  rows: ParsedRow[];
  loops: number[];
  frames: Frame[];
  outcome: "continue" | "died" | "won" | "lost";
  threat: number;
  spawned: string[];
}

const HAND_SIZE = RULES.core.handSize;
const EXCHANGE_MAX = RULES.core.exchangeMax;
/** Safety valve for simulations: a level that is not won by this turn counts as stuck. */
export const MAX_TURNS = 40;

const clone = <T>(x: T): T => structuredClone(x);

/** `upgrades`: the hero's unlocked upgrade ids (see `unlockedUpgrades` in upgrades.ts). */
export function newGame(levelId: number, heroId: string, seed: number, upgrades: string[] = []): Game {
  const state = createState(levelId, heroId, seed, upgrades);
  spawnFromPressure(state);
  state.hand = deal(seedFrom(seed, "deal", 0), state.deck);
  state.log = [];
  return { state, snapshot: clone(state), phase: "exchange", deaths: 0, levelRestarts: 0 };
}

const isSensor = (c: CardInstance) => CARDS[c.cardId]!.type === "sensor";
const isAction = (c: CardInstance) => CARDS[c.cardId]!.type === "action" || CARDS[c.cardId]!.type === "hero_action";

/** Deal a hand that can always build at least one row (2+ sensors and 2+ actions when the deck has them). */
function deal(seed: number, deck: DeckState): CardInstance[] {
  const hand = draw(createRng(seed), deck, HAND_SIZE);
  ensureMinimum(hand, deck, isSensor, 2);
  ensureMinimum(hand, deck, isAction, 2);
  return hand;
}

export function exchange(game: Game, instanceIds: string[]) {
  if (game.phase !== "exchange") throw new Error("Exchange is only allowed before building rows.");
  if (instanceIds.length > EXCHANGE_MAX) throw new Error(`You can exchange at most ${EXCHANGE_MAX} cards.`);
  const s = game.state;
  const discard = s.hand.filter((c) => instanceIds.includes(c.instanceId));
  s.hand = s.hand.filter((c) => !instanceIds.includes(c.instanceId));
  s.deck.discardPile.push(...discard);
  const ids = discard.map((c) => c.cardId).sort().join(",");
  s.hand.push(...draw(createRng(seedFrom(s.seed, "exchange", s.turnIndex, ids)), s.deck, discard.length));
  game.phase = "build";
}

export function threatOf(cardId: string): number {
  const c = CARDS[cardId]!;
  const tp = RULES.threatPressure;
  return (tp.typeBase as Record<string, number>)[c.type]! + ((tp.rarityBonus as Record<string, number>)[c.rarity] ?? 0);
}

export function rollLoops(state: GameState, rows: number): number[] {
  const sides = levelOf(state).diceSides;
  return Array.from({ length: rows }, (_, i) => roll(createRng(seedFrom(state.seed, "dice", state.turnIndex, i)), sides));
}

/** Validates rows, rolls dice and runs the whole turn. Returns frames for replay/animation. */
/**
 * opts.loops overrides the dice (for planning). opts.record=false skips per-loop frames.
 * opts.simulate=true is for look-ahead: it implies no frames and never touches the deck, hand or snapshot.
 */
export function playTurn(game: Game, drafts: RowDraft[], opts: { loops?: number[]; record?: boolean; simulate?: boolean } = {}): TurnResult {
  const simulate = opts.simulate ?? false;
  const record = !simulate && (opts.record ?? true);
  if (game.phase === "exchange") game.phase = "build";
  if (game.phase !== "build") throw new Error("The level is over.");
  const s = game.state;
  const { rows, errors } = validateRows(s.hand, drafts);
  if (errors.length) throw new Error(errors.join(" "));
  const loops = opts.loops ?? rollLoops(s, rows.length);
  const frames: Frame[] = [];
  s.log = [];
  s.turnFlags = {};
  s.loopInTurn = 0;
  emit(s, "turn", `Turn ${s.turnIndex + 1}: ${rows.length} row(s), loops ${loops.join(" / ")}.`);

  outer: for (let r = 0; r < rows.length; r++) {
    for (let i = 0; i < loops[r]!; i++) {
      const fired = runLoop(s, rows[r]!);
      if (record) frames.push({ rowIndex: r, loopInRow: i, truth: fired === "then", fired, events: s.log, state: clone({ ...s, log: [] }) });
      s.log = [];
      if (s.status !== "playing" || s.diedThisTurn) break outer;
    }
  }

  const result: TurnResult = { rows, loops, frames, outcome: "continue", threat: 0, spawned: [] };
  if (s.status === "won") {
    game.phase = "won";
    result.outcome = "won";
    return result;
  }
  if (s.diedThisTurn && simulate) {
    result.outcome = "died";
    return result;
  }
  if (s.diedThisTurn) {
    game.deaths++;
    const lives = s.lives - 1;
    if (lives <= 0) {
      game.phase = "lost";
      result.outcome = "lost";
      return result;
    }
    game.state = clone(game.snapshot);
    game.state.lives = lives;
    game.snapshot.lives = lives;
    game.phase = "exchange";
    result.outcome = "died";
    return result;
  }

  // Turn end: unplaced cards become Threat, then Pressure spawns enemies.
  const placed = new Set(drafts.flatMap(rowCardIds));
  const unplaced = s.hand.filter((c) => !placed.has(c.instanceId));
  result.threat = levelOf(s).pressureEnabled === false ? 0 : unplaced.reduce((sum, c) => sum + threatOf(c.cardId), 0);
  s.pressure += result.threat;
  s.log = [];
  if (simulate) {
    result.spawned = spawnFromPressure(s);
    return result;
  }
  s.deck.discardPile.push(...s.hand);
  s.hand = [];
  if (result.threat) emit(s, "pressure", `${unplaced.length} unused card(s) add ${result.threat} Pressure (total ${s.pressure}).`);
  result.spawned = spawnFromPressure(s);
  s.wardTurns = Math.max(0, s.wardTurns - 1);
  s.hero.runeSpeed = 0;
  s.turnIndex++;
  // Catch your breath: a little HP back each turn keeps long levels from becoming pure attrition.
  s.hero.hp = Math.min(s.hero.maxHp, s.hero.hp + RULES.core.healPerTurn);
  s.hand = deal(seedFrom(s.seed, "deal", s.turnIndex), s.deck);
  if (s.turnIndex >= MAX_TURNS) {
    game.phase = "lost";
    result.outcome = "lost";
    return result;
  }
  if (record) frames.push({ rowIndex: -1, loopInRow: 0, fired: "default", events: s.log, state: clone({ ...s, log: [] }) });
  s.log = [];
  game.snapshot = clone(s);
  game.phase = "exchange";
  return result;
}

/** Restart the level from scratch (after losing all lives). Same seed, so the same first deal. */
export function restartLevel(game: Game): Game {
  const fresh = newGame(game.state.levelId, game.state.heroId, game.state.seed, game.state.upgrades);
  fresh.deaths = game.deaths;
  fresh.levelRestarts = game.levelRestarts + 1;
  return fresh;
}

function runLoop(s: GameState, row: ParsedRow): Frame["fired"] {
  const h = s.hero;
  h.movedThisLoop = false;
  s.heldThisLoop = false;
  let fired: Frame["fired"];
  const truth = evalPredicate(s, row.predicate);
  emit(s, "eval", `${describeRow(row)} → ${truth ? "TRUE" : "FALSE"}`, undefined, { truth });
  if (truth) {
    fired = "then";
    performAction(s, row.thenCardId);
  } else if (row.elseCardId) {
    fired = "else";
    performAction(s, row.elseCardId);
  } else {
    fired = "default";
    if (h.statuses.stun || h.statuses.hesitation) {
      delete h.statuses.hesitation;
      emit(s, "wait", "Stunned/hesitating: the hero loses the loop.", h.pos);
    } else defaultBehavior(s);
  }
  if (s.status === "playing" && h.hp > 0) afterHeroAction(s);
  if (s.status !== "playing") return fired;

  collectPickups(s);
  // Region hazards and vents hurt at the end of the loop.
  const trap = trapAt(s, h.pos);
  const trapDef = trap ? CONTENT.traps[trap] : undefined;
  if (trapDef?.damagePerLoop) {
    damageHero(s, trapDef.damagePerLoop, trap === "T_POISON_FOG" ? "Poison fog" : "Smoke", { ignoreArmor: true, kind: "region" });
    if (trapDef.appliesStatus && chance(s.seed, s.turnIndex, s.loop, "fog") * 100 < (trapDef.statusChancePercent ?? 100)) {
      if (h.hp > 0 && applyHeroStatus(s, trapDef.appliesStatus[0]!, trapDef.statusStacks)) emit(s, "status", "The hero is poisoned.", h.pos);
    }
  }
  if (ventActive(s, h.pos)) damageHero(s, CONTENT.mechanics.M_TIMED_VENTS!.damage ?? 2, "A steam vent", { ignoreArmor: true, kind: "vent" });

  for (const e of [...s.enemies].sort((a, b) => a.uid - b.uid)) {
    if (h.hp <= 0 || s.status !== "playing") break;
    if (s.enemies.includes(e)) enemyAct(s, e);
  }

  const mech = mechanicAt(s, h.pos);
  if (mech?.id === "M_CONVEYOR" && mech.dir && h.hp > 0 && s.status === "playing") {
    const to = { x: h.pos.x + (mech.dir === "E" ? 1 : mech.dir === "W" ? -1 : 0), y: h.pos.y + (mech.dir === "S" ? 1 : mech.dir === "N" ? -1 : 0) };
    if (open(s, to) && !resistsPush(s, "conveyor")) {
      emit(s, "push", "The conveyor carries the hero.", to);
      enterTile(s, to);
    }
  }

  tickStatuses(h.statuses, h.movedThisLoop, (dmg, why) => damageHero(s, dmg, why, { ignoreArmor: true, kind: "status" }));
  enemyLoopEnd(s);
  s.bloodTiles = s.bloodTiles.map((b) => ({ ...b, loops: b.loops - 1 })).filter((b) => b.loops > 0);
  s.loop++;
  s.loopInTurn++;
  return fired;
}

// ---------- spawning ----------

function costOf(typeId: string, modifier: string | null) {
  return COSTS[typeId]! + (modifier ? MODIFIER_COSTS[modifier] ?? 0 : 0);
}

export function spawnFromPressure(s: GameState): string[] {
  const level = levelOf(s);
  const board = boardOf(s);
  let budget = Math.min(s.pressure, pressureSpendCap(level));
  const spawned: string[] = [];
  const salt = (x: string | number) => chance(s.seed, "spawn", s.turnIndex, spawned.length, x);
  const freePoints = () =>
    level.spawnPoints
      .map((id) => board.spawnPoints.get(id)!)
      .filter((p) => open(s, p) && !enemyAt(s, p) && manhattan(p, s.hero.pos) >= 3 && !eq(p, board.exit));
  const pool = level.enemyPool;
  const cheapest = Math.min(...pool.map((id) => COSTS[id]!));

  const boardCap = 4 + Math.floor(level.levelId / 6);
  while (spawned.length < level.maxSpawnsPerTurn && s.enemies.length < boardCap) {
    const points = freePoints();
    if (!points.length) break;
    let typeId: string | undefined;
    const resurrect = s.wardTurns === 0 ? s.defeatedPool.find((id) => pool.includes(id) && COSTS[id]! <= budget) : undefined;
    if (resurrect) {
      typeId = resurrect;
      s.defeatedPool.splice(s.defeatedPool.indexOf(resurrect), 1);
    } else {
      const affordable = pool.filter((id) => COSTS[id]! <= budget);
      if (!affordable.length) break;
      typeId = affordable[Math.floor(salt("type") * affordable.length)]!;
    }
    const mods = level.modifiersAllowed.filter((m) => !MODIFIERS[m]?.optional && costOf(typeId!, m) <= budget);
    const modifier = mods.length && salt("mod") < 0.35 ? mods[Math.floor(salt("which") * mods.length)]! : null;
    const point = points[Math.floor(salt("point") * points.length)]!;
    spawnEnemy(s, typeId, modifier, point, !!resurrect);
    budget -= costOf(typeId, modifier);
    s.pressure -= costOf(typeId, modifier);
    spawned.push(typeId);
  }
  // Pressure always manifests: a nuisance spawn if nothing was affordable.
  if (!spawned.length && s.pressure > 0 && s.pressure < cheapest && s.enemies.length < boardCap && level.nuisancePool.length) {
    const points = freePoints();
    if (points.length) {
      const typeId = level.nuisancePool[Math.floor(salt("nuisance") * level.nuisancePool.length)]!;
      spawnEnemy(s, typeId, null, points[Math.floor(salt("npoint") * points.length)]!, false);
      s.pressure -= 1;
      spawned.push(typeId);
    }
  }
  return spawned;
}

function spawnEnemy(s: GameState, typeId: string, modifier: string | null, pos: { x: number; y: number }, risen: boolean) {
  const def = ENEMIES[typeId]!;
  const hp = def.hp + (modifier ? MODIFIERS[modifier]?.hpAdd ?? 0 : 0);
  const uid = s.nextUid++;
  const dx = s.hero.pos.x - pos.x, dy = s.hero.pos.y - pos.y;
  const facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "E" : "W") : dy > 0 ? "S" : "N";
  s.enemies.push({
    uid, typeId, modifier, pos, facing, hp, maxHp: hp, statuses: {}, movedThisLoop: false, risen,
    ai: {
      offset: Math.floor(chance(s.seed, "offset", uid) * 3),
      priority: chance(s.seed, "priority", uid) < 0.5 ? "corpse" : "hero",
    },
  });
  const name = `${modifier ? modifier[0]!.toUpperCase() + modifier.slice(1) + " " : ""}${def.name}`;
  emit(s, "spawn", `${risen ? "Risen" : "Spawned"}: ${name}.`, pos);
}

export { HAND_SIZE, EXCHANGE_MAX };
