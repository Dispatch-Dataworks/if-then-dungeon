# Cleric

**ID:** `H_CLERIC`  
**Category:** Hero  
**Theme:** grim healer

## Visual description
A traveler in a simple robe and light armor, carrying a small hammer and a lantern charm. Avoid overt religious symbols tied to real-world faiths.

## Identity and learning role
Anti-undead specialist that teaches tags (undead) and cleansing mechanics.

## Core rules
- **No diagonal movement**
- **One action per tick**
- **Speed** changes how many tiles a move action covers (does not add extra actions)

## Default behavior (when the active row does not trigger and no ELSE exists)
Move cautiously; avoid cursed tiles if visible; otherwise advance.

## Hero Attack (effect of the `A_HERO_ATTACK` card)
**Smite (Hero Attack):** Melee or short-range holy strike. Bonus damage vs enemies tagged **undead/hollow**.

## Baseline stats (tunable)
- HP: **10**
- Armor: **1**
- Speed tiles per move action: **1**
- Sight range: **3**

## Upgrade seeds (early tree ideas)
- **Cleanse:** Once per turn, remove a negative status after taking an action.
- **Ward:** Gain brief resistance to fear/curse effects.
- **Blessed Strike:** Improves Smite bonus and slightly extends reach (1→2 tiles).

## Typical card synergies
- Sensors that matter: **ENEMY_ADJACENT**, **ENEMY_IN_LOS**, **TILE_IS_HAZARD_AHEAD**, **TILE_IS_TRAP_AHEAD**, **PATH_BLOCKED** (as those become available).
- Actions that matter: **MOVE_FORWARD**, **TURN_LEFT/RIGHT**, **WAIT/HOLD**, **JUMP** (later), **HERO_ATTACK**.

## Balance knobs (for JSON)
- Base HP/Armor
- Attack damage + status chance (deterministic)
- Sight rules (LoS vs arc scan)
- Default behavior parameters (rotation preference, “safe tile” scoring)

## Design notes / tips
- Natural counter to Skeleton Guard and Hollow modifiers.
- Teaches strategy: build rules around tags and status cleanup.
