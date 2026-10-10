/**
 * A bot player for balancing. It builds rows by greedy search: try each candidate row, simulate the turn
 * against several sampled dice rolls (it never peeks at the real roll), keep the row that helps most.
 */
import { bfs, manhattan, type Vec } from "../engine/board";
import { CARDS } from "../engine/content";
import { EXCHANGE_MAX, exchange, playTurn, threatOf, type Game } from "../engine/game";
import { defaultBehavior } from "../engine/hero";
import { createRng, roll, seedFrom } from "../engine/rng";
import type { RowDraft } from "../engine/rules/rows";
import { boardOf, levelOf, solid, type GameState } from "../engine/state";

export interface BotOptions {
  /** Dice samples per candidate evaluation. */
  samples: number;
  maxRows: number;
  /** Allow two-sensor predicates (AND / OR). */
  compound: boolean;
  /** Partial plans kept per search depth. */
  beam: number;
}

export const SKILLED: BotOptions = { samples: 3, maxRows: 4, compound: true, beam: 3 };

const typeOf = (cardId: string) => CARDS[cardId]!.type;

/** Walking distance to the exit, ignoring enemies (traps count as passable). */
export function distanceToExit(state: GameState): number {
  const exit = boardOf(state).exit;
  if (state.hero.pos.x === exit.x && state.hero.pos.y === exit.y) return 0;
  const path = bfs(state.hero.pos, (p) => p.x === exit.x && p.y === exit.y, (p: Vec) => !solid(state, p), true, 400);
  return path ? path.length : 99;
}

/** True when the hero ends the turn facing along a shortest route to the exit. */
function facingRoute(state: GameState): boolean {
  const exit = boardOf(state).exit;
  const path = bfs(state.hero.pos, (p) => p.x === exit.x && p.y === exit.y, (p: Vec) => !solid(state, p), true, 400);
  const step = path?.[0];
  if (!step) return false;
  const f = { x: state.hero.pos.x + (state.hero.facing === "E" ? 1 : state.hero.facing === "W" ? -1 : 0), y: state.hero.pos.y + (state.hero.facing === "S" ? 1 : state.hero.facing === "N" ? -1 : 0) };
  return f.x === step.x && f.y === step.y;
}

/**
 * Look-ahead: the closest the hero's own default behavior gets to the exit over the next few loops,
 * ignoring enemies. Rewards plans that leave the hero facing a route the defaults will follow.
 */
function defaultWalkDistance(state: GameState, steps = 6): number {
  const { deck, hand, ...rest } = state;
  const s = { ...structuredClone(rest), deck, hand, enemies: [], log: [] } as GameState;
  let best = distanceToExit(s);
  for (let i = 0; i < steps && s.status === "playing" && best > 0; i++) {
    s.hero.hp = 99;
    defaultBehavior(s);
    best = Math.min(best, (s.status as string) === "won" ? 0 : distanceToExit(s));
  }
  return best;
}

function score(game: Game, distBefore: number, outcome: string, threat: number): number {
  const s = game.state;
  if (outcome === "won") return 100000 - s.turnIndex * 10 + s.hero.hp;
  if (outcome === "died" || outcome === "lost") return -100000;
  const dist = distanceToExit(s);
  const ahead = defaultWalkDistance(s);
  const danger = s.enemies.reduce((sum, e) => sum + Math.max(0, 4 - manhattan(e.pos, s.hero.pos)), 0);
  return (
    -dist * 8 -
    ahead * 6 +
    s.hero.hp * 8 -
    (s.hero.hp <= 3 ? 30 : 0) -
    threat * 3 -
    danger * 2 -
    s.enemies.length * 3 +
    (distBefore - dist > 0 ? 5 : 0) +
    (facingRoute(s) ? 6 : 0)
  );
}

/** Discard cards the bot can't use well: AND/OR when compound is off, and actions far beyond the sensor count. */
function chooseExchange(state: GameState, opts: BotOptions): string[] {
  const hand = state.hand;
  const out: string[] = [];
  const sensors = hand.filter((c) => typeOf(c.cardId) === "sensor").length;
  const actions = hand.filter((c) => typeOf(c.cardId) === "action" || typeOf(c.cardId) === "hero_action");
  const elses = hand.filter((c) => c.cardId === "OP_ELSE");
  const nots = hand.filter((c) => c.cardId === "OP_NOT");
  for (const c of hand) {
    if (!opts.compound && (c.cardId === "OP_AND" || c.cardId === "OP_OR")) out.push(c.instanceId);
  }
  // Keep at most (sensors + ELSE cards + 1) actions; prefer discarding duplicates of the most common action.
  let surplus = actions.length - (sensors + elses.length + 1);
  const counts = new Map<string, number>();
  for (const a of actions) counts.set(a.cardId, (counts.get(a.cardId) ?? 0) + 1);
  const sorted = [...actions].sort((a, b) => counts.get(b.cardId)! - counts.get(a.cardId)!);
  for (const a of sorted) {
    if (surplus <= 0) break;
    if (a.cardId === "A_HERO_ATTACK" || a.cardId === "A_MOVE_FWD") continue;
    out.push(a.instanceId);
    surplus--;
  }
  for (const n of nots.slice(2)) out.push(n.instanceId);
  return out.slice(0, EXCHANGE_MAX);
}

function candidates(state: GameState, used: Set<string>, opts: BotOptions): RowDraft[] {
  const free = state.hand.filter((c) => !used.has(c.instanceId));
  const first = (id: string) => free.find((c) => c.cardId === id)?.instanceId;
  const uniq = <T extends { cardId: string }>(xs: T[]) => [...new Map(xs.map((x) => [x.cardId, x])).values()];
  const sensors = uniq(free.filter((c) => typeOf(c.cardId) === "sensor"));
  const actions = uniq(free.filter((c) => typeOf(c.cardId) === "action" || typeOf(c.cardId) === "hero_action"));
  const not = first("OP_NOT"), els = first("OP_ELSE"), and = first("OP_AND"), or = first("OP_OR");
  const preds: string[][] = [];
  for (const sn of sensors) {
    preds.push([sn.instanceId]);
    if (not) preds.push([not, sn.instanceId]);
  }
  if (opts.compound) {
    for (const a of sensors) for (const b of sensors) {
      if (a.cardId >= b.cardId) continue;
      if (and) preds.push([a.instanceId, and, b.instanceId]);
      if (or) preds.push([a.instanceId, or, b.instanceId]);
    }
  }
  const out: RowDraft[] = [];
  for (const p of preds) {
    for (const a of actions) {
      out.push({ ifTokens: p, thenAction: a.instanceId });
      if (els) for (const b of actions) if (b.cardId !== a.cardId) out.push({ ifTokens: p, thenAction: a.instanceId, elseCard: els, elseAction: b.instanceId });
    }
  }
  return out;
}

/** Copies only what a simulated turn changes; the deck and hand are shared because simulate mode never mutates them. */
function lightClone(game: Game): Game {
  const { deck, hand, ...rest } = game.state;
  const state = { ...structuredClone(rest), deck, hand } as GameState;
  return { state, snapshot: game.snapshot, phase: game.phase, deaths: game.deaths, levelRestarts: game.levelRestarts };
}

function evaluate(game: Game, drafts: RowDraft[], opts: BotOptions, distBefore: number): number {
  const sides = levelOf(game.state).diceSides;
  let total = 0;
  for (let k = 0; k < opts.samples; k++) {
    const g = lightClone(game);
    // Sampled dice only: the bot plans against possible rolls, not the real one.
    const loops = drafts.map((_, i) => roll(createRng(seedFrom("bot", game.state.turnIndex, k, i, game.deaths)), sides));
    const r = playTurn(g, drafts, { loops, simulate: true });
    total += score(g, distBefore, r.outcome, r.threat);
  }
  return total / opts.samples;
}

/** Plans one turn: exchange, then a small beam search that adds rows while they improve the expected score. */
export function planTurn(game: Game, opts: BotOptions = SKILLED): RowDraft[] {
  if (game.phase === "exchange") exchange(game, chooseExchange(game.state, opts));
  type Plan = { rows: RowDraft[]; score: number };
  const usedBy = (rows: RowDraft[]) => new Set(rows.flatMap((r) => [...r.ifTokens, r.thenAction, r.elseCard, r.elseAction].filter((x): x is string => !!x)));
  const distBefore = distanceToExit(game.state);
  let beam: Plan[] = [{ rows: [], score: -Infinity }];
  let best: Plan = beam[0]!;
  for (let depth = 0; depth < opts.maxRows; depth++) {
    const next: Plan[] = [];
    for (const plan of beam) {
      const seen = new Set<string>();
      for (const cand of candidates(game.state, usedBy(plan.rows), opts)) {
        // Skip candidates that are the same card ids as one already tried from this plan.
        const sig = [...cand.ifTokens, cand.thenAction, cand.elseAction].map((id) => id?.split("#")[0]).join("|");
        if (seen.has(sig)) continue;
        seen.add(sig);
        const rows = [...plan.rows, cand];
        next.push({ rows, score: evaluate(game, rows, opts, distBefore) });
      }
    }
    next.sort((a, b) => b.score - a.score);
    beam = next.slice(0, opts.beam);
    if (!beam.length || beam[0]!.score <= best.score + 0.5) break;
    best = beam[0]!;
  }
  if (!best.rows.length) {
    const c = candidates(game.state, new Set(), opts)[0];
    return c ? [c] : [];
  }
  return best.rows;
}

export { threatOf };
