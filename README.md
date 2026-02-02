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
