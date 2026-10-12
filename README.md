# If-Then Dungeon — Design Spec (v0.1)

A logic-first, grid-based dungeon game for ages 10–15. Players “program” their hero using **rule rows** built from **cards** (Sensors, Actions, Operators). Each row runs for a random number of loops based on a dice roll. Enemies move on deterministic rules with controlled randomness. Unused cards create **Pressure** that spawns more enemies.

This repository contains the complete written specification and JSON references for:

- Core rules and turn structure
- Rule-row grammar (IF / THEN / ELSE with NOT/AND/OR precedence)
- Deck + exchange system (finite deck, persistent per level)
- Pressure system (carryover, deterministic, always manifests)
- Heroes (class defaults, upgrades, polymorphic hero actions)
- Enemies + modifiers (costs, behaviors, variability)
- Traps + board mechanics
- 24-level campaign plan across 8 themes
- JSON reference formats

## Design goals

1. **Teach CS logic**: conditionals, boolean operators, precedence, debugging, edge cases.
2. **Feel like a game**: tension, monsters, hazards, upgrades, replay.
3. **Low syntax burden**: players manipulate cards, not code.
4. **Deterministic learning loops**: retries do not “reroll luck” (same deal + same RNG).

## Glossary

- **Loop / Tick**: one simulation step during execution.
- **Row**: a single rule line: `IF <predicate> THEN <action> [ELSE <action>]`.
- **Predicate**: boolean expression built from Sensors + Operators.
- **Pressure**: persistent threat budget created by unused cards; spawns enemies.
- **Nuisance spawn**: fallback enemy spawn when Pressure > 0 but can’t afford anything.

## Files

- `01-core-rules.md` — non-negotiable rules, constraints, definitions
- `02-turn-execution.md` — exact execution order and determinism rules
- `03-cards-and-deck.md` — card types, deck model, exchange, rarity, examples
- `04-threat-pressure-spawn.md` — threat formula, pressure lifecycle, spawn rules
- `05-heroes.md` — hero roster, defaults, stats, upgrades, hero-attack polymorphism
- `06-enemies-and-modifiers.md` — roster, behaviors, variability, spawn costs, modifiers
- `07-traps-and-board-mechanics.md` — traps, damage, telegraphing, mechanics
- `08-levels-and-progression.md` — 24-level plan, introductions, tuning knobs
- `09-ui-and-teaching.md` — builder UI, explanation UI, kid-facing clarity
- `10-json-reference.md` — JSON examples and reference objects
- `engine-spec.md` — engine modules, data shapes, determinism and persistence (authoritative for implementation)
- `technical-notes-4-7.md` — PWA, offline/caching, privacy and performance notes
- `Style-guide.md` — colors, typography, UI styling and accessibility rules
- `cards.json`, `levels.json`, `rules.json` — cards, campaign (levels, maps, decks, traps, obstacles, statuses, pickups) and global rules
- `heroes.json`, `enemies.json`, `themes.json` — hero and enemy stats, modifier effects, per-theme art direction
- `characters/` — one sheet per hero, enemy, modifier, trap, mechanic and obstacle (see `characters/readme.md`)
- `assets/placeholders/` — generated placeholder images for every card and character (temporary until final art)
- `branding/` — logo and key-art concepts (see `branding/README.md`)
- `assets/art/` — final in-game art: `<ID>/card.mp4` loop + `card.webp` still, `<ID>--f/` for a character's second (girl) look, `faces.json` portrait crops
- `art/` — concept reference sheets (`art/references/`) and Flow inputs and prompts for making card art (`art/flow-inputs/`)
- `art/MISSING-ART.md` — art still on placeholders (kept in sync with `assets/` by a test)
- `IDEAS.md` — parked ideas (e.g. a separate adult art build)

## Play

**Online demo:** https://dispatch-dataworks.github.io/if-then-dungeon/ (deployed from `main` by `.github/workflows/pages.yml`; add `?unlock=all` to open every level and hero).

To run it locally:

```sh
npm install
npm run dev            # then open the printed URL
```

Pick a hero and a level. Each turn: swap up to 5 cards, build IF / THEN (/ ELSE) rows from your hand, press **Roll & Lock**, and watch your rules run. Reach the exit; unused cards add Pressure, which spawns enemies. Add `?unlock=all` to the URL to open every level and hero.

## Development

The game is built with TypeScript + Vite (see §0 of `engine-spec.md` for why).

```sh
npm install
npm test               # engine unit tests + content validation
npm run validate       # content validation only (all JSON files, level maps, character sheets, placeholders)
npm run typecheck
npm run dev            # local dev server
npm run placeholders   # regenerate placeholder images after adding cards or character sheets
npm run sim -- 1-3 starter 4   # bot plays levels 1-3 with the starter heroes, 4 seeds each
scripts/sim-all.sh     # full balance run in parallel (see BALANCE.md)
```

- `src/engine/` — pure simulation core (no DOM; seeded RNG only): `game.ts` turn lifecycle, `hero.ts`, `enemy.ts`, `effects.ts`, `rules/` (rows, sensors, parser)
- `src/ui/` — browser UI (title/level select, board, row builder, playback, progress in localStorage)
- `src/sim/` — balance bot and simulation runner (see `BALANCE.md`)
- `tests/` — Vitest tests; CI runs typecheck and tests on every push (`.github/workflows/ci.yml`)
