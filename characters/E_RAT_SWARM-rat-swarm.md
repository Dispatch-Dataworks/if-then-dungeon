# Rat Swarm

**ID:** `E_RAT_SWARM`  
**Category:** Enemy  
**Theme:** sewers / crypt floors

## Visual description
A writhing mass of pale rats and fleas; the swarm looks like a moving shadow over the tiles.

## Role on the board
- **Spawn cost:** 1 skull(s) (base; modified by level tuning)
- Intended role: pressure, zoning, damage, support, or disruption.

## Core behavior (readable “rule”)
Moves toward hero if within 3 tiles; otherwise performs a seeded random walk.

## Movement rules
- Move 1 tile; prefers openings; clogs lanes.
- Rotation / pathing should be deterministic and grid-based (no diagonal).

## Attack / ability rules
- Attacks happen **only when the enemy’s rule says so** (e.g., adjacent or LoS).
- Enemy attacks are still **one action per tick**.

## Variability (controlled randomness)
Can apply a light stacking nibble debuff (optional).

### Determinism note
Any “chance” is seeded and therefore repeatable on retries.

## What the player learns
- Condition ordering and edge cases related to this enemy (LoS, adjacency, distance thresholds, or cadence timers).

## Counterplay hints (for level tooltips / teach mode)
- Prioritize hazard avoidance first, then threat response (attack/turn).
- Use sensors like **ENEMY_ADJACENT**, **ENEMY_IN_LOS**, and **ENEMY_DISTANCE** when introduced.

## Drops / rewards (tunable)
- Standard: small chance for HP, armor shard, or speed rune.
- Elite variants: higher drop odds.

## Tags (suggested)
- Assign tags in JSON for teaching moments (e.g., `swarm`, `undead`, `support`, `beast`).
