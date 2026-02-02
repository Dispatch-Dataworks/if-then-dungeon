# Ranger

**ID:** `H_RANGER`  
**Category:** Hero  
**Theme:** wilderness stalker

## Visual description
A green-cloaked explorer with a short bow and hunting knife, plus small talismans and utility pouches.

## Identity and learning role
Kiting specialist that teaches distance thresholds and multi-condition predicates (AND/OR).

## Core rules
- **No diagonal movement**
- **One action per tick**
- **Speed** changes how many tiles a move action covers (does not add extra actions)

## Default behavior (when the active row does not trigger and no ELSE exists)
Kite: if enemy within 2 tiles, **move away**; else move forward.

## Hero Attack (effect of the `A_HERO_ATTACK` card)
**Volley (Hero Attack):** Single attack action that can target nearest enemy; gains benefit when a target is **Marked** or in a “tracked” state.

## Baseline stats (tunable)
- HP: **8**
- Armor: **0**
- Speed tiles per move action: **1**
- Sight range: **5**

## Upgrade seeds (early tree ideas)
- **Snare Control:** Increases snare duration applied by certain effects.
- **Trap Interaction:** Once per turn, ignore damage from roots/vines when moving.
- **Tracking:** Expands sensors to treat “blood trail” tiles as a target hint (later).

## Typical card synergies
- Sensors that matter: **ENEMY_ADJACENT**, **ENEMY_IN_LOS**, **TILE_IS_HAZARD_AHEAD**, **TILE_IS_TRAP_AHEAD**, **PATH_BLOCKED** (as those become available).
- Actions that matter: **MOVE_FORWARD**, **TURN_LEFT/RIGHT**, **WAIT/HOLD**, **JUMP** (later), **HERO_ATTACK**.

## Balance knobs (for JSON)
- Base HP/Armor
- Attack damage + status chance (deterministic)
- Sight rules (LoS vs arc scan)
- Default behavior parameters (rotation preference, “safe tile” scoring)

## Design notes / tips
- Rewards building conditions like: IF ENEMY_DISTANCE<=2 THEN TURN/RETREAT ELSE MOVE.
- Strong on open boards with chokepoints.
