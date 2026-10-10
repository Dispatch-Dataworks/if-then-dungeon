/** Plays whole levels with the bot. */

import { newGame, playTurn, restartLevel, type Game } from "../engine/game";
import { describeRow } from "../engine/rules/rows";
import { planTurn, SKILLED, type BotOptions } from "./bot";

export interface LevelRun {
  levelId: number;
  heroId: string;
  seed: number;
  cleared: boolean;
  /** 1 = cleared with the first 3 lives; 2-3 = after restarting the level. */
  attempts: number;
  turns: number;
  deaths: number;
  hpLeft: number;
  maxEnemies: number;
  pressureEnd: number;
  threatPerTurn: number;
  spawnsPerTurn: number;
  rowsPerTurn: number;
  cardsPerTurn: number;
  log: string[];
}

export const MAX_ATTEMPTS = 3;

export function playLevel(levelId: number, heroId: string, seed: number, opts: BotOptions = SKILLED, verbose = false): LevelRun {
  let game: Game = newGame(levelId, heroId, seed);
  let maxEnemies = 0, turns = 0, attempts = 1, threat = 0, spawned = 0, rows = 0, cardsPlaced = 0;
  const log: string[] = [];
  for (let guard = 0; guard < 300; guard++) {
    const drafts = planTurn(game, opts);
    const r = playTurn(game, drafts, { record: verbose });
    turns++;
    threat += r.threat;
    spawned += r.spawned.length;
    rows += r.rows.length;
    cardsPlaced += drafts.reduce((n, d) => n + d.ifTokens.length + 1 + (d.elseCard ? 2 : 0), 0);
    maxEnemies = Math.max(maxEnemies, game.state.enemies.length);
    if (verbose) {
      log.push(`T${turns} ${r.outcome} loops=${r.loops.join("/")} hp=${game.state.hero.hp} pos=${game.state.hero.pos.x},${game.state.hero.pos.y} enemies=${game.state.enemies.length} P=${game.state.pressure} threat=${r.threat}`);
      for (const row of r.rows) log.push(`   ${describeRow(row)}`);
      for (const f of r.frames) for (const e of f.events) if (e.kind !== "eval") log.push(`     · ${e.text}`);
    }
    if (r.outcome === "won") break;
    if (r.outcome === "lost") {
      if (attempts >= MAX_ATTEMPTS) break;
      attempts++;
      game = restartLevel(game);
      if (verbose) log.push(`--- level restart (attempt ${attempts}) ---`);
    }
  }
  return {
    levelId, heroId, seed, cleared: game.phase === "won", attempts, turns, deaths: game.deaths, hpLeft: game.state.hero.hp,
    maxEnemies, pressureEnd: game.state.pressure, log, threatPerTurn: threat / turns, spawnsPerTurn: spawned / turns, rowsPerTurn: rows / turns, cardsPerTurn: cardsPlaced / turns,
  };
}

export { restartLevel };
