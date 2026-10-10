# Sentinel

**ID:** `H_SENTINEL`  
**Category:** Hero  
**Theme:** spear guardian

## Visual description
A stoic guard in mail with a long spear and a simple face-covering helm. Designed to be generic.

## Identity and learning role
Zone control hero; teaches reach and holding lanes.

## Core rules
- **No diagonal movement**
- **One action per tick**
- **Speed** changes how many tiles a move action covers (does not add extra actions)

## Default behavior (when the active row does not trigger and no ELSE exists)
If enemy visible: Hold; else advance. Very predictable, good for advanced planning.

## Hero Attack (effect of the `A_HERO_ATTACK` card)
**Spear Thrust (Hero Attack):** 2-tile reach in a straight line (still one attack action).

## Baseline stats (tunable)
- HP: **11**
- Armor: **2**
- Speed tiles per move action: **1**
- Sight range: **3**

## Upgrade seeds (early tree ideas)
- **Pierce:** Improves damage vs armored enemies.
- **Brace:** When holding, reduce pushback effects.
- **Crowd Control:** Thrust can apply brief slow on hit (deterministic).

## Typical card synergies
- Sensors that matter: **S_ENEMY_ADJACENT**, **S_ENEMY_VISIBLE**, **S_HAZARD_AHEAD** (L7+), **S_TRAP_AHEAD** (L16+), **S_BLOCKED_AHEAD**.
- Actions that matter: **A_MOVE_FWD**, **A_TURN_L** / **A_TURN_R**, **A_WAIT** / **A_HOLD**, **A_JUMP_FWD** (L3+), **A_HERO_ATTACK**.

## Balance knobs (for JSON)
- Base HP/Armor
- Attack damage + status chance (deterministic)
- Sight rules (LoS vs arc scan)
- Default behavior parameters (rotation preference, “safe tile” scoring)

## Design notes / tips
- Strong against chokepoint rushes (goblin knight/orc brute).
- Helps teach “reach” as a special rule, not diagonal.
