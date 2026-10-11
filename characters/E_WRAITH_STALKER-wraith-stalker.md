# Wraith Stalker

**ID:** `E_WRAITH_STALKER`  
**Category:** Enemy  
**Theme:** haunted halls

## Visual description
A translucent shadow with ragged cloak edges and hollow eyes, half-phased into walls.

## Role on the board
- **Danger:** 4 skull(s) · **Spawn cost:** 10 Pressure (base, before modifiers)
- **Stats:** HP 5, armor 0, damage 3, attack range 1, speed 1 (see `enemies.json`)
- Intended role: pressure, zoning, damage, support, or disruption.

## Core behavior (readable “rule”)
Can threaten from behind obstacles; cycles between stalking and striking.

## Movement rules
- Move 1 tile; may 'phase threaten' without moving depending on rules.
- Rotation / pathing should be deterministic and grid-based (no diagonal).

## Attack / ability rules
- Attacks happen **only when the enemy’s rule says so** (e.g., adjacent or LoS).
- Enemy attacks are still **one action per tick**.

## Variability (controlled randomness)
Seeded stalk/strike cycle at spawn.

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
