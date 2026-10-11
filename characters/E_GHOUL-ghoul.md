# Ghoul

**ID:** `E_GHOUL`  
**Category:** Enemy  
**Theme:** graveyards / plague pits

## Visual description
A hunched corpse-eater with torn flesh, glowing eyes, and clawed hands. Darker tone.

## Role on the board
- **Danger:** 3 skull(s) · **Spawn cost:** 7 Pressure (base, before modifiers)
- **Stats:** HP 4, armor 0, damage 2, attack range 1, speed 1 (see `enemies.json`)
- Intended role: pressure, zoning, damage, support, or disruption.

## Core behavior (readable “rule”)
Seeks corpses/defeated markers to heal or gain speed briefly; attacks adjacent.

## Movement rules
- Move 1 tile; may ignore hero to reach a corpse depending on trait.
- Rotation / pathing should be deterministic and grid-based (no diagonal).

## Attack / ability rules
- Attacks happen **only when the enemy’s rule says so** (e.g., adjacent or LoS).
- Enemy attacks are still **one action per tick**.

## Variability (controlled randomness)
Corpse-vs-hero priority trait is seeded at spawn.

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
