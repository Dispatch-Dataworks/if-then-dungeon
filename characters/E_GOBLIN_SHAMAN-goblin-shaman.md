# Goblin Shaman

**ID:** `E_GOBLIN_SHAMAN`  
**Category:** Enemy  
**Theme:** goblin warrens / shrines

## Visual description
A goblin in bone fetishes and ash paint, holding a rattling totem.

## Role on the board
- **Danger:** 3 skull(s) · **Spawn cost:** 7 Pressure (base, before modifiers)
- **Stats:** HP 3, armor 0, damage 0, attack range 3, speed 1 (see `enemies.json`)
- Intended role: pressure, zoning, damage, support, or disruption.

## Core behavior (readable “rule”)
On cadence, buffs allies or conjures a minor hazard; avoids direct combat.

## Movement rules
- Move 1 tile; stays behind allies.
- Rotation / pathing should be deterministic and grid-based (no diagonal).

## Attack / ability rules
- Attacks happen **only when the enemy’s rule says so** (e.g., adjacent or LoS).
- Enemy attacks are still **one action per tick**.

## Variability (controlled randomness)
Cadence offset is seeded at spawn.

### Determinism note
Any “chance” is seeded and therefore repeatable on retries.

## What the player learns
- Condition ordering and edge cases related to this enemy (LoS, adjacency, distance thresholds, or cadence timers).

## Counterplay hints (for level tooltips / teach mode)
- Prioritize hazard avoidance first, then threat response (attack/turn).
- Use sensors like **S_ENEMY_ADJACENT**, **S_ENEMY_VISIBLE**, and **S_ENEMY_NEAR_2** (L5+) when introduced.

## Drops / rewards (tunable)
- Standard: small chance for HP, armor shard, or speed rune.
- Elite variants: higher drop odds.

## Tags (suggested)
- Assign tags in JSON for teaching moments (e.g., `swarm`, `undead`, `support`, `beast`).
