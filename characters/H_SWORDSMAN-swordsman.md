# Swordsman

**ID:** `H_SWORDSMAN`  
**Category:** Hero  
**Theme:** classic dungeon adventurer

## Visual description
A sturdy fighter in worn leather and chain, carrying a simple longsword and a battered belt pouch. Clean, iconic silhouette; no distinctive franchise markings.

## Identity and learning role
Balanced frontline that teaches simple movement rules and priority ordering.

## Core rules
- **No diagonal movement**
- **One action per tick**
- **Speed** changes how many tiles a move action covers (does not add extra actions)

## Default behavior (when the active row does not trigger and no ELSE exists)
**Move Forward (1 tile)**. If blocked, rotate **clockwise** to the nearest open direction and move if possible; otherwise **Wait**.

## Hero Attack (effect of the `A_HERO_ATTACK` card)
**Slash (Hero Attack):** Melee strike to the tile directly ahead. Medium damage. Gains a small bonus vs enemies tagged **swarm**.

## Baseline stats (tunable)
- HP: **10**
- Armor: **1**
- Speed tiles per move action: **1**
- Sight range: **3**

## Upgrade seeds (early tree ideas)
- **Cleave:** When using Slash, can hit up to **2 targets** in a straight line (still counts as **one attack action**).
- **Parry:** Once per turn, reduce the first incoming hit by a small amount (deterministic, no random dodge).
- **Heavy Boots:** Once per turn, resist forced movement (push plates / gusts).

## Typical card synergies
- Sensors that matter: **ENEMY_ADJACENT**, **ENEMY_IN_LOS**, **TILE_IS_HAZARD_AHEAD**, **TILE_IS_TRAP_AHEAD**, **PATH_BLOCKED** (as those become available).
- Actions that matter: **MOVE_FORWARD**, **TURN_LEFT/RIGHT**, **WAIT/HOLD**, **JUMP** (later), **HERO_ATTACK**.

## Balance knobs (for JSON)
- Base HP/Armor
- Attack damage + status chance (deterministic)
- Sight rules (LoS vs arc scan)
- Default behavior parameters (rotation preference, “safe tile” scoring)

## Design notes / tips
- Good starter for learning rule ordering: put hazard-avoidance above attack rows.
- Pairs well with sensors like **ENEMY_ADJACENT** and **TILE_IS_HAZARD_AHEAD**.
