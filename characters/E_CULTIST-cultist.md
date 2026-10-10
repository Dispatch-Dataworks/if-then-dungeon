# Cultist

**ID:** `E_CULTIST`  
**Category:** Enemy  
**Theme:** ritual chambers

## Visual description
A hooded fanatic with a bone charm and a crooked staff, face hidden by cloth.

## Role on the board
- **Danger:** 2 skull(s) · **Spawn cost:** 4 Pressure (base, before modifiers)
- **Stats:** HP 2, armor 0, damage 0, attack range 3, speed 1 (see `enemies.json`)
- Intended role: pressure, zoning, damage, support, or disruption.

## Core behavior (readable “rule”)
Keeps distance; applies a minor curse/fear pulse if in range; flees if threatened.

## Movement rules
- Move 1 tile; prefers to stay 2–3 tiles away.
- Rotation / pathing should be deterministic and grid-based (no diagonal).

## Attack / ability rules
- Attacks happen **only when the enemy’s rule says so** (e.g., adjacent or LoS).
- Enemy attacks are still **one action per tick**.

## Variability (controlled randomness)
Alternates between support and flee on a cadence.

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
