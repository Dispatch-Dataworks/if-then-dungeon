# Hound

**ID:** `E_HOUND`  
**Category:** Enemy  
**Theme:** dungeon kennels

## Visual description
A mangy war hound with a spiked collar and cloudy eyes. Fast and relentless.

## Role on the board
- **Danger:** 2 skull(s) · **Spawn cost:** 4 Pressure (base, before modifiers)
- **Stats:** HP 3, armor 0, damage 1, attack range 1, speed 2 (see `enemies.json`)
- Intended role: pressure, zoning, damage, support, or disruption.

## Core behavior (readable “rule”)
Chases hero; if adjacent, bites.

## Movement rules
- Move 2 tiles when chasing (still 1 action).
- Rotation / pathing should be deterministic and grid-based (no diagonal).

## Attack / ability rules
- Attacks happen **only when the enemy’s rule says so** (e.g., adjacent or LoS).
- Enemy attacks are still **one action per tick**.

## Variability (controlled randomness)
May pounce: if within 2 and line clear, skip movement and attack (seeded).

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
