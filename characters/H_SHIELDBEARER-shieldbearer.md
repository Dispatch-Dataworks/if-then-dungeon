# Shieldbearer

**ID:** `H_SHIELDBEARER`  
**Category:** Hero  
**Theme:** tower-shield tank

## Visual description
A broad-shouldered guardian with a tall shield, simple helm, and layered armor plates. Visual focus is the shield; no emblem tied to any known IP.

## Identity and learning role
Defensive tank that teaches holding/guarding behavior and trap management.

## Core rules
- **No diagonal movement**
- **One action per tick**
- **Speed** changes how many tiles a move action covers (does not add extra actions)

## Default behavior (when the active row does not trigger and no ELSE exists)
If an enemy is visible: **Hold Position**. Otherwise: **Move Forward (1 tile)** (clockwise rotate if blocked).

## Hero Attack (effect of the `A_HERO_ATTACK` card)
**Shield Bash (Hero Attack):** Melee hit + optional **pushback 1 tile** if the destination is open.

## Baseline stats (tunable)
- HP: **12**
- Armor: **2**
- Speed tiles per move action: **1**
- Sight range: **3**

## Upgrade seeds (early tree ideas)
- **Fortify:** When you Wait/Hold, gain a temporary **ranged damage reduction** buff until your next action.
- **Bulwark:** Once per turn, ignore the damage portion of a trap trigger (status effects still apply).
- **Bash Mastery:** Improves push reliability; push fails less often when the tile behind is open.

## Typical card synergies
- Sensors that matter: **ENEMY_ADJACENT**, **ENEMY_IN_LOS**, **TILE_IS_HAZARD_AHEAD**, **TILE_IS_TRAP_AHEAD**, **PATH_BLOCKED** (as those become available).
- Actions that matter: **MOVE_FORWARD**, **TURN_LEFT/RIGHT**, **WAIT/HOLD**, **JUMP** (later), **HERO_ATTACK**.

## Balance knobs (for JSON)
- Base HP/Armor
- Attack damage + status chance (deterministic)
- Sight rules (LoS vs arc scan)
- Default behavior parameters (rotation preference, “safe tile” scoring)

## Design notes / tips
- Great for teaching ELSE use: IF ENEMY_VISIBLE THEN HOLD ELSE MOVE.
- Pairs with defensive rule sets that prevent rushing into hazards.
