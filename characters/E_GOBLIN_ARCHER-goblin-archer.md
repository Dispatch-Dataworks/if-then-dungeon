# Goblin Archer

**ID:** `E_GOBLIN_ARCHER`  
**Category:** Enemy  
**Theme:** goblin warrens

## Visual description
A goblin with a crude shortbow and mismatched arrows, hiding behind debris.

## Role on the board
- **Spawn cost:** 2 skull(s) (base; modified by level tuning)
- Intended role: pressure, zoning, damage, support, or disruption.

## Core behavior (readable “rule”)
If hero in line-of-sight, shoot; else reposition to restore LoS.

## Movement rules
- Move 1 tile; favors cover and corners.
- Rotation / pathing should be deterministic and grid-based (no diagonal).

## Attack / ability rules
- Attacks happen **only when the enemy’s rule says so** (e.g., adjacent or LoS).
- Enemy attacks are still **one action per tick**.

## Variability (controlled randomness)
Chooses a preferred left/right lane at spawn (seeded).

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
