# Rogue

**ID:** `H_ROGUE`  
**Category:** Hero  
**Theme:** shadowy skirmisher

## Visual description
A lean figure in dark cloth and light leather, carrying a short blade and a coil of rope. Distinct from any popular stealth franchises by keeping details generic.

## Identity and learning role
Fast, tricky hero that teaches hazard detection, timing, and “wasted tick” management.

## Core rules
- **No diagonal movement**
- **One action per tick**
- **Speed** changes how many tiles a move action covers (does not add extra actions)

## Default behavior (when the active row does not trigger and no ELSE exists)
If a hazard is detected ahead: **Sidestep** to the first safe open tile (clockwise preference). Else **Move Forward**.

## Hero Attack (effect of the `A_HERO_ATTACK` card)
**Stab (Hero Attack):** Melee strike. Deals bonus damage if target is **slowed** or not facing the hero (unaware).

## Baseline stats (tunable)
- HP: **7**
- Armor: **0**
- Speed tiles per move action: **2**
- Sight range: **4**

## Upgrade seeds (early tree ideas)
- **Smoke Step:** Ignores smoke visibility penalty for sensors tied to adjacent tiles.
- **Trap Sense:** Improves hazard detection sensors by +1 tile (engine-side; not a new card).
- **Backstab:** Expands bonus damage conditions and improves damage multiplier slightly.

## Typical card synergies
- Sensors that matter: **S_ENEMY_ADJACENT**, **S_ENEMY_VISIBLE**, **S_HAZARD_AHEAD** (L7+), **S_TRAP_AHEAD** (L16+), **S_BLOCKED_AHEAD**.
- Actions that matter: **A_MOVE_FWD**, **A_TURN_L** / **A_TURN_R**, **A_WAIT** / **A_HOLD**, **A_JUMP_FWD** (L3+), **A_HERO_ATTACK**.

## Balance knobs (for JSON)
- Base HP/Armor
- Attack damage + status chance (deterministic)
- Sight rules (LoS vs arc scan)
- Default behavior parameters (rotation preference, “safe tile” scoring)

## Design notes / tips
- Because Speed=2 (movement only), rule ordering matters: avoid “charge into danger” behavior.
- Best used with sensors like TILE_IS_TRAP_AHEAD / ENEMY_ADJACENT.
