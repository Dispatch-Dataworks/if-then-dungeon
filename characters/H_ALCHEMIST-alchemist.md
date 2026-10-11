# Alchemist

**ID:** `H_ALCHEMIST`  
**Category:** Hero  
**Theme:** chemical thrower

## Visual description
A masked tinkerer with vials, bandoliers, and stained gloves. Reads as fantasy-science without resembling any existing property.

## Identity and learning role
Area effects and hazard management; teaches splash logic and zone control.

## Core rules
- **No diagonal movement**
- **One action per tick**
- **Speed** changes how many tiles a move action covers (does not add extra actions)

## Default behavior (when the active row does not trigger and no ELSE exists)
Step aside if an enemy is next to you; otherwise move forward (turn right, then left, if blocked).

## Hero Attack (effect of the `A_HERO_ATTACK` card)
**Throw Vial (Hero Attack):** Ranged attack to a tile; creates a short-lived hazard or debuff zone (poison/burn/smoke depending on upgrade).

## Baseline stats (tunable)
- HP: **8**
- Armor: **0**
- Speed tiles per move action: **1**
- Sight range: **4**

## Upgrade seeds (early tree ideas)
- **Antitoxin:** Reduce poison damage over time.
- **Neutralizer:** Once per turn, remove fog/smoke penalty in a small area.
- **Volatile Mix:** Hero Attack splash radius increases slightly (still one attack action).

## Typical card synergies
- Sensors that matter: **S_ENEMY_ADJACENT**, **S_ENEMY_VISIBLE**, **S_HAZARD_AHEAD** (L7+), **S_TRAP_AHEAD** (L16+), **S_BLOCKED_AHEAD**.
- Actions that matter: **A_MOVE_FWD**, **A_TURN_L** / **A_TURN_R**, **A_WAIT** / **A_HOLD**, **A_JUMP_FWD** (L3+), **A_HERO_ATTACK**.

## Balance knobs (for JSON)
- Base HP/Armor
- Attack damage + status chance (deterministic)
- Sight rules (LoS vs arc scan)
- Default behavior parameters (rotation preference, “safe tile” scoring)

## Design notes / tips
- Great for teaching that actions can affect tiles, not only enemies.
- Pairs with sensors like TILE_HAS_ENEMY, TILE_IS_HAZARD, ENEMY_CLUSTERED (later).
