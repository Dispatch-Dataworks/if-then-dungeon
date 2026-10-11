# Balance report

The game is balanced by simulation: a bot plays every level with every starter hero, and numbers are tuned until the difficulty curve looks right. This file records the method, the current results and what was changed. Re-run it after any content change.

## How to run

```sh
scripts/sim-all.sh starter 8          # all levels, 4 starter heroes, 8 seeds each (about 10 minutes on 4 cores)
scripts/sim-all.sh all 4 13-18        # every hero on levels 13-18
scripts/sim-advanced.sh 8             # each advanced hero on the levels after it unlocks
UPGRADES=max scripts/sim-all.sh       # same, with every upgrade the hero could have earned by each level
npm run sim -- 12 H_SWORDSMAN 3       # one level; add VERBOSE=1 for turn-by-turn logs
python3 scripts/deck-topup.py         # after editing deck adjustments: keep core cards at a steady share
python3 scripts/sync-docs.py          # after changing numbers: update docs and character sheets
```

## The bot (`src/sim/bot.ts`)
- Each turn it swaps unusable cards (surplus actions beyond what its sensors can use), then builds rows with a small beam search: it tries candidate rows (one sensor, `NOT` sensor, or two sensors with `AND`/`OR`; optional `ELSE`) and simulates the whole turn.
- It **never sees the real dice**: every candidate is scored against 3 sampled dice rolls.
- Score: distance to the exit, how close the hero's default behavior would get over the next few loops, HP, nearby enemies and Threat created. A death scores as a disaster.
- It plans one turn ahead. It is a decent but not expert player: it fails some navigation puzzles a person would solve by watching the replay (for example, walking against the L8 conveyor). Treat its numbers as "a careful kid on a first visit", not a ceiling.

Metrics: **1st try** = cleared with the first 3 lives; **cleared** = cleared within 3 attempts (restarting the level counts as an attempt).

## Current results (starter heroes, 8 seeds each)

| Level | 1st try | Cleared | Turns | Notes |
|---|---|---|---|---|
| 1 | 97% | 100% | 5.1 | |
| 2 | 100% | 100% | 2.5 | |
| 3 | 78% | 97% | 6.9 | archers + pits |
| 4 | 88% | 100% | 5.8 | |
| 5 | 81% | 97% | 7.1 | |
| 6 | 91% | 100% | 5.8 | |
| 7 | 56% | 84% | 9.9 | new theme: ELSE, conveyors, smoke |
| 8 | 62% | 72% | 7.5 | conveyor puzzle (hard for the bot, fair for people) |
| 9 | 66% | 91% | 11.4 | |
| 10 | 69% | 88% | 6.4 | |
| 11 | 91% | 97% | 3.3 | |
| 12 | 44% | 59% | 11.3 | hardest non-finale level: hollow enemies rise again |
| 13 | 97% | 100% | 2.8 | |
| 14 | 94% | 97% | 4.3 | |
| 15 | 94% | 97% | 3.8 | |
| 16 | 50% | 78% | 8.3 | OR + push plates + bleed at once |
| 17 | 88% | 94% | 2.2 | |
| 18 | 72% | 81% | 6.8 | |
| 19 | 88% | — | — | starting Pressure added |
| 20 | 91% | — | — | starting Pressure added |
| 21 | 91% | — | — | starting Pressure added |
| 22 | 59% | 81% | 9.8 | finale remix |
| 23 | 44% | 72% | 12.9 | finale remix |
| 24 | 59% | 78% | 11.6 | finale remix |

By hero (all levels): Swordsman 84% / Rogue 85% / Shieldbearer 72% / Archer 69% first try. The Archer is meant to be the fragile, skill-heavy pick.

## Advanced heroes

Each advanced hero was run (8 seeds) on every level after it unlocks, and compared with the starter heroes on the same levels (`scripts/sim-advanced.sh`). Hero upgrades are not simulated yet; these are base heroes.

| Hero | Unlocks after | 1st try | Starters, same levels | Difference | Cleared |
|---|---|---|---|---|---|
| Alchemist | L3 | 71% | 75% | −4 | 85% |
| Monk | L6 | 78% | 73% | +5 | 91% |
| Cleric | L9 | 86% | 75% | +10 | 96% |
| Battlemage | L12 | 74% | 77% | −3 | 88% |
| Sentinel | L15 | 72% | 71% | +1 | 81% |
| Berserker | L15 | 78% | 71% | +6 | 92% |
| Ranger | L18 | 81% | 72% | +9 | 88% |
| Hunter | L18 | 83% | 72% | +11 | 94% |

- Target: within about ±10 points of the starters. Per-level numbers are noisy (±15 points at 8 seeds); the per-hero averages are the reliable signal.
- **Alchemist** was −9 (66%). It is the first hero a player unlocks, so it shouldn't feel like a downgrade: Throw Vial changed from 1 damage + 2 poison stacks to 2 damage + 1 stack (same total, front-loaded).
- **Cleric** (+10) and **Hunter** (+11) run slightly strong. Both unlock right before the themes they are built for (undead; blood trails), so that is intended. The Hunter figure covers only 6 levels.
- Weak spots worth watching: Battlemage on L16 (1/8 first try), Sentinel on L19 and L22.

## Hero upgrades

All 36 upgrades are implemented (`src/engine/upgrades.ts`). The sim was run twice on the same seeds: once with base heroes and once with **every upgrade the hero could have earned by that level** (`UPGRADES=max`: as if every earlier level since the hero unlocked was cleared with it). That is the upper bound on upgrade power.

| Hero | Levels | Base | Upgraded | Gain |
|---|---|---|---|---|
| Swordsman | 1–24 | 83% | 90% | +6 |
| Archer | 1–24 | 67% | 83% | +16 (16 seeds) |
| Shieldbearer | 1–24 | 70% | 78% | +8 |
| Rogue | 1–24 | 85% | 89% | +4 |
| Alchemist | 4–24 | 71% | 79% | +7 |
| Monk | 7–24 | 76% | 84% | +8 (16 seeds) |
| Cleric | 10–24 | 86% | 91% | +5 |
| Battlemage | 13–24 | 75% | 81% | +6 (16 seeds) |
| Sentinel | 16–24 | 72% | 82% | +10 |
| Berserker | 16–24 | 78% | 83% | +6 |
| Ranger | 19–24 | 81% | 85% | +4 |
| Hunter | 19–24 | 73% | 76% | +3 (16 seeds) |

- Upgrades do not break the curve: in the first pass no level got more than about 7 points easier (largest: L22 59%→66%, L8 56%→62%).
- **First pass:** offensive upgrades (Cleave, Smite reach, Rage Meter, Volley snares) showed up; six sets (Shieldbearer, Rogue, Alchemist, Battlemage, Sentinel, Hunter) added nothing measurable.
- **Strengthened** those six with always-on effects: armor while holding (Fortify), trap damage −1 (Bulwark, Trap Sense), +1 damage (Bash Mastery, Backstab, Pierce, Wardbreaker), range and sight (Neutralizer, Illumination, Smoke Step), immunities and stats (Antitoxin +2 HP, Curse Mitigation +1 armor, Blood Sense +2 HP), heal on kill (Trophy Hunter).
- **A sight bonus can hurt:** giving the Hunter +1 sight made its default ("move toward the nearest visible enemy") pick fights earlier and cost 8 points, so Blood Sense gives +2 max HP instead.
- **Noise:** with 6 levels × 8 seeds, a hero's average can swing about ±7 points (the Hunter read 83% base at 8 seeds and 73% at 16). The Battlemage and Hunter rows use 16 seeds.
- **Archer and Monk** were also +2, so they got the same treatment: Quickdraw +1 sight, Pinning Shot +1 damage, Evasion on every melee hit; Vent Mastery full vent immunity and +2 max HP, Push Plate Resist all pushes and +1 armor, Discipline +1 damage. The Archer's +16 is the largest gain, but it is also the weakest hero without upgrades; upgraded it matches a typical starter.

## What changed and why

| Change | Evidence |
|---|---|
| Threat per unused card: action 2→1, operator and hero attack 3→2 | Hands can't place every card (each row needs a sensor). At the old values a careful player still spawned 2 goblins a turn on Level 1. |
| Deal guarantees ≥2 sensors and ≥2 actions | Some hands had no sensor, so no legal row: the player was stuck. |
| Core-card top-ups in every deck (`topUp` adjustments) | Hero Attack fell from 9% of the deck (L1) to 2% (L16) as new cards were added, so most mid-game hands couldn't fight. |
| Default behavior turns right, then left, then around (was right, around, left) | Heroes U-turned whenever a right turn was blocked, even with an open path on the left. |
| Every map has a trap-free walking route (validator rule) | 17 of 24 maps forced the hero across traps, so "avoid the spikes" rules had nothing to do. |
| Trap damage: spikes/bone spikes 3→2, pit 4→3, curse sigil 2→1, bleed vines 2→1 (+2 bleed) | Traps were the top damage source on most mid levels. |
| +1 HP at the start of each turn | HP never recovered within a level, so long levels became pure attrition. |
| Board cap `4 + floor(level / 6)` enemies; extra Pressure is banked | Prevents runaway swarms when a player is stuck. |
| Enemies never step on damaging traps | Enemies were killing themselves on spikes, which made traps feel random. |
| Goblin Archer: range 4→3, fires every other loop, cost 4→5 | Archers were the top killer in the Foundry levels. |
| Smoke blocks line of sight through it | Archers could shoot a hero who couldn't see them. Now smoke is cover for both sides. |
| Hound damage 2→1; Goblin Knight 4 HP/2 dmg → 3 HP/1 dmg; Orc Brute damage 3→2; Orc Warden HP 5→4; Skeleton Guard 3 HP/2 dmg → 4 HP/1 dmg | Each was the top damage source on its levels. |
| Alchemist Throw Vial: 1 damage + 2 poison → 2 damage + 1 poison | Alchemist was 9 points behind the starters on its levels. |
| Hero Arrow damage 1→2; Shieldbearer holds only when an enemy is adjacent | Archer was far behind (31% first try); the Shieldbearer stalled forever whenever an enemy was in sight. |
| Fewer spawns per turn on L7–9, L12, L16, L23; L23 pool drops archers | Spike levels; archers didn't fit the undead remix. |
| Starting Pressure 4 on L19–21; Health Draughts on L12 and L16 safe routes | Smooths the curve (L19–21 were at 97–100%). |

## Next tuning targets
- **L12 and L16** are the steepest spikes outside the finale. Candidates: a slower resurrection rule for hollow enemies (L12), or splitting the L16 introductions across L16–17.
- **A real playtest**: the bot can't tell us whether rules are *understandable*. Watch a few kids play L1–7 and note where they get stuck.
