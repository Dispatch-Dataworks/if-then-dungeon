/** Balance report. Usage: npm run sim -- [levels e.g. 1-24] [starter|all|H_ID,...] [seeds]. VERBOSE=1 prints turn logs. */
import { HERO_LIST, LEVELS } from "../engine/content";
import { SKILLED } from "./bot";
import { playLevel, type LevelRun } from "./run";
const [lv = "1-24", hs = "starter", sd = "5"] = process.argv.slice(2);
const [a, b] = lv.split("-").map(Number) as [number, number?];
const levels = LEVELS.filter((l) => l.levelId >= a && l.levelId <= (b ?? a)).map((l) => l.levelId);
const heroes = hs === "starter" ? HERO_LIST.filter((h) => h.tier === "starter").map((h) => h.id)
  : hs === "all" ? HERO_LIST.map((h) => h.id) : hs.split(",");
const seeds = Number(sd);
const verbose = process.env.VERBOSE === "1";
console.log("level hero          1stTry  cleared  avgTurns  avgDeaths  avgHP  maxEnemies");
for (const levelId of levels) {
  for (const heroId of heroes) {
    const runs = Array.from({ length: seeds }, (_, i) => playLevel(levelId, heroId, 1000 + i, SKILLED, verbose));
    const cleared = runs.filter((r) => r.cleared);
    const avg = (f: (r: LevelRun) => number, xs = runs) => (xs.length ? xs.reduce((s, r) => s + f(r), 0) / xs.length : 0).toFixed(1);
    console.log(
      `${String(levelId).padStart(5)} ${heroId.padEnd(15)} ${`${runs.filter((r) => r.cleared && r.attempts === 1).length}/${seeds}`.padStart(6)} ${`${cleared.length}/${seeds}`.padStart(7)} ${avg((r) => r.turns, cleared).padStart(9)} ${avg((r) => r.deaths).padStart(10)} ${avg((r) => r.hpLeft, cleared).padStart(6)} ${avg((r) => r.maxEnemies).padStart(11)}`,
    );
    if (verbose) for (const r of runs) console.log(r.log.join("\n"));
  }
}
